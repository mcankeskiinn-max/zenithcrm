import fs from "fs";
import path from "path";
import { createRequire } from "module";

const requireFromServer = createRequire(
  path.join(__dirname, "..", "..", "..", "server", "package.json")
);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dotenv = requireFromServer("dotenv");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = requireFromServer("@prisma/client");

const prisma = new PrismaClient();

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const SERVER_DIR = path.join(ROOT_DIR, "server");
const PRD_PATH = path.join(ROOT_DIR, "PRODUCTION_READINESS.md");
const CHECKLIST_PATH = path.join(ROOT_DIR, "SECURITY_HARDENING_CHECKLIST.md");

const DEFAULT_TENANT_FILES = [
  "server/src/lib/prisma-tenant-middleware.ts",
  "server/src/utils/tenant-bypass.ts",
  "server/src/utils/tenant-context.ts",
  "server/src/utils/tenant-errors.ts",
  "server/src/middleware/auth.middleware.ts",
];

const REQUIRED_SECRETS = ["JWT_SECRET", "JWT_REFRESH_SECRET"];
const MIN_SECRET_LENGTH = 64;

const WARN = "WARN" as const;
const PASS = "PASS" as const;
const FAIL = "FAIL" as const;

type Status = typeof WARN | typeof PASS | typeof FAIL;

type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

interface AuditResult {
  category: string;
  status: Status;
  message: string;
  severity: Severity;
  action?: string;
}

interface AuditReport {
  passed: boolean;
  results: AuditResult[];
  blockers: AuditResult[];
  summary: {
    passed: number;
    warned: number;
    failed: number;
  };
}

const logLine = (status: Status, message: string) => {
  const symbol = status === PASS ? "?" : status === WARN ? "??" : "?";
  console.log(`${symbol} ${status} - ${message}`);
};

const resolveEnvPath = () => {
  const serverEnv = path.join(SERVER_DIR, ".env");
  const rootEnv = path.join(ROOT_DIR, ".env");
  if (fs.existsSync(serverEnv)) {
    return serverEnv;
  }
  if (fs.existsSync(rootEnv)) {
    return rootEnv;
  }
  return null;
};

const loadEnvironment = () => {
  const envPath = resolveEnvPath();
  if (envPath) {
    dotenv.config({ path: envPath });
  }
};

const readEnv = (key: string) => process.env[key]?.trim() || "";

const checkSchemaHasTenantId = async (): Promise<AuditResult> => {
  const models = (await prisma.$queryRawUnsafe(
    `SELECT table_name
     FROM information_schema.columns
     WHERE column_name = 'tenantId' AND table_schema = 'public'`
  )) as Array<{ table_name: string }>;

  if (!models.length) {
    return {
      category: "schema",
      status: FAIL,
      message: "No tenantId columns found in public schema",
      severity: "CRITICAL",
      action: "Add tenantId columns to tenant-scoped tables",
    };
  }

  return {
    category: "schema",
    status: PASS,
    message: `tenantId column found in ${models.length} tables`,
    severity: "LOW",
  };
};

const checkMiddlewareActive = async (): Promise<AuditResult> => {
  const middlewareFlag = readEnv("TENANT_MIDDLEWARE_ENABLED");
  if (middlewareFlag && middlewareFlag.toLowerCase() === "false") {
    return {
      category: "middleware",
      status: FAIL,
      message: "Tenant middleware is disabled",
      severity: "CRITICAL",
      action: "Set TENANT_MIDDLEWARE_ENABLED=true",
    };
  }

  return {
    category: "middleware",
    status: PASS,
    message: "Tenant middleware is enabled",
    severity: "LOW",
  };
};

const checkEnvironmentConfig = async (): Promise<AuditResult> => {
  const missing = REQUIRED_SECRETS.filter(
    (key) => !readEnv(key) || readEnv(key).length < MIN_SECRET_LENGTH
  );

  if (missing.length) {
    const isProd = (process.env.NODE_ENV || "").toLowerCase() === "production";
    if (!isProd) {
      return {
        category: "environment",
        status: WARN,
        message: "JWT secrets are missing or too short (non-production)",
        severity: "MEDIUM",
        action: `Set strong secrets before production: ${missing.join(", ")}`,
      };
    }
    return {
      category: "environment",
      status: FAIL,
      message: "JWT secrets are missing or too short",
      severity: "CRITICAL",
      action: `Set strong secrets: ${missing.join(", ")}`,
    };
  }

  return {
    category: "environment",
    status: PASS,
    message: "Environment config looks OK",
    severity: "LOW",
  };
};

const checkBypassConfig = async (): Promise<AuditResult> => {
  const allowedRoles = readEnv("BYPASS_ALLOWED_ROLES")
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);

  const unsafeRoles = new Set(["USER", "AGENT", "EMPLOYEE"]);
  const foundUnsafe = allowedRoles.filter((role) => unsafeRoles.has(role));

  if (foundUnsafe.length) {
    return {
      category: "bypass",
      status: FAIL,
      message: `Non-admin roles can bypass tenant isolation: ${foundUnsafe.join(", ")}`,
      severity: "CRITICAL",
      action: "Remove USER/AGENT/EMPLOYEE from BYPASS_ALLOWED_ROLES",
    };
  }

  return {
    category: "bypass",
    status: PASS,
    message: "Bypass limited to admin roles",
    severity: "LOW",
  };
};

const checkDatabaseIndexes = async (): Promise<AuditResult> => {
  const indexes = (await prisma.$queryRawUnsafe(
    `SELECT indexname
     FROM pg_indexes
     WHERE indexname ILIKE '%tenantid%'
       AND schemaname = 'public'`
  )) as Array<{ indexname: string }>;

  if (indexes.length < 5) {
    return {
      category: "database",
      status: WARN,
      message: "Missing tenantId indexes (performance risk)",
      severity: "MEDIUM",
      action: "Add indexes on tenantId columns",
    };
  }

  return {
    category: "database",
    status: PASS,
    message: `${indexes.length} tenantId indexes found`,
    severity: "LOW",
  };
};

const checkEndpointProtection = async (): Promise<AuditResult> => {
  const routesDir = path.join(SERVER_DIR, "src", "routes");
  if (!fs.existsSync(routesDir)) {
    return {
      category: "endpoints",
      status: WARN,
      message: "Routes directory not found to verify endpoint protection",
      severity: "HIGH",
      action: "Review route protection manually",
    };
  }

  const criticalRoutes = [
    "customer.routes.ts",
    "policyType.routes.ts",
    "sale.routes.ts",
    "branch.routes.ts",
  ];
  const missingAuth = criticalRoutes.filter((file) => {
    const filePath = path.join(routesDir, file);
    if (!fs.existsSync(filePath)) {
      return true;
    }
    const contents = fs.readFileSync(filePath, "utf8");
    return !contents.includes("authenticate");
  });

  if (missingAuth.length) {
    return {
      category: "endpoints",
      status: WARN,
      message: `Potentially unprotected endpoints: ${missingAuth.join(", ")}`,
      severity: "HIGH",
      action: "Verify authenticate middleware on critical routes",
    };
  }

  return {
    category: "endpoints",
    status: PASS,
    message: "All critical endpoints protected",
    severity: "LOW",
  };
};

const checkAuditLog = async (): Promise<AuditResult> => {
  try {
    await prisma.auditLog.findFirst();
    return {
      category: "audit",
      status: PASS,
      message: "Audit log reachable",
      severity: "LOW",
    };
  } catch (error: any) {
    return {
      category: "audit",
      status: FAIL,
      message: `Audit log unreachable: ${error?.message || "unknown"}`,
      severity: "CRITICAL",
      action: "Fix audit logging database access",
    };
  }
};

const getTenantCoverageFiles = (): string[] => {
  const envList = readEnv("TENANT_COVERAGE_FILES");
  if (envList) {
    return envList.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return DEFAULT_TENANT_FILES;
};

const checkTestCoverage = async (): Promise<AuditResult> => {
  const coveragePath = path.join(ROOT_DIR, "server", "coverage", "coverage-summary.json");
  if (!fs.existsSync(coveragePath)) {
    return {
      category: "coverage",
      status: WARN,
      message: "Coverage report not found",
      severity: "MEDIUM",
      action: "Run npm run test:coverage",
    };
  }

  const summary = JSON.parse(fs.readFileSync(coveragePath, "utf8"));
  const tenantFiles = getTenantCoverageFiles();
  const minCoverage = Number(readEnv("TENANT_COVERAGE_MIN") || "85");

  let totalLines = 0;
  let coveredLines = 0;

  const normalize = (value: string) => value.replace(/\\/g, "/");
  const summaryKeys = Object.keys(summary);

  const findEntry = (filePath: string) => {
    const absolutePath = path.join(ROOT_DIR, filePath);
    const normalizedAbsolute = normalize(absolutePath);

    if (summary[absolutePath]) {
      return summary[absolutePath];
    }

    if (summary[normalizedAbsolute]) {
      return summary[normalizedAbsolute];
    }

    const normalizedFile = normalize(filePath);
    const matchedKey = summaryKeys.find((key) => normalize(key).endsWith(normalizedFile));
    if (matchedKey) {
      return summary[matchedKey];
    }

    return null;
  };

  for (const file of tenantFiles) {
    const entry = findEntry(file);
    if (!entry?.lines) {
      continue;
    }
    totalLines += entry.lines.total;
    coveredLines += entry.lines.covered;
  }

  if (!totalLines) {
    return {
      category: "coverage",
      status: WARN,
      message: "Tenant-critical coverage report missing",
      severity: "MEDIUM",
      action: "Verify TENANT_COVERAGE_FILES and coverage output",
    };
  }

  const percent = Number(((coveredLines / totalLines) * 100).toFixed(2));

  if (percent < minCoverage) {
    return {
      category: "coverage",
      status: FAIL,
      message: `Tenant-critical coverage ${percent}% below ${minCoverage}%`,
      severity: "HIGH",
      action: "Increase tenant isolation test coverage",
    };
  }

  return {
    category: "coverage",
    status: PASS,
    message: `Tenant-critical coverage ${percent}%`,
    severity: "LOW",
  };
};

const generateHTMLReport = (report: AuditReport): string => {
  const timestamp = new Date().toISOString();
  const statusColor = (status: Status) =>
    status === PASS ? "green" : status === WARN ? "orange" : "red";

  const rows = report.results
    .map(
      (result) => `
        <div style="margin-bottom:8px;color:${statusColor(result.status)}">
          <strong>${result.category}</strong>: ${result.message}
          ${result.action ? `<div><em>Action: ${result.action}</em></div>` : ""}
        </div>
      `
    )
    .join("");

  const blockers = report.blockers
    .map(
      (result) => `
        <div style="background:#ffebee;padding:10px;margin:10px 0">
          <strong>${result.category}</strong>: ${result.message}
          ${result.action ? `<div><em>Action: ${result.action}</em></div>` : ""}
        </div>
      `
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Pre-Production Audit - ${timestamp}</title>
</head>
<body>
  <h1>Tenant Isolation Pre-Production Audit</h1>
  <p>Timestamp: ${timestamp}</p>
  <p>Status: ${report.passed ? "? PASSED" : "? FAILED"}</p>
  <h2>Results</h2>
  ${rows}
  ${report.blockers.length ? `<h2>Blockers</h2>${blockers}` : ""}
</body>
</html>`;
};

const writeAuditToPRD = (report: AuditReport) => {
  if (!fs.existsSync(PRD_PATH)) {
    return;
  }

  const content = fs.readFileSync(PRD_PATH, "utf8");
  const startMarker = "<!-- TENANT_AUDIT_START -->";
  const endMarker = "<!-- TENANT_AUDIT_END -->";
  const summary = `\n${startMarker}\n## Son Tarama Durumu\n- Tarih: ${new Date().toISOString()}\n- Sonuc: ${report.passed ? "READY" : "BLOCKED"}\n- PASS: ${report.summary.passed}\n- WARN: ${report.summary.warned}\n- FAIL: ${report.summary.failed}\n${endMarker}\n`;

  if (content.includes(startMarker) && content.includes(endMarker)) {
    const updated = content.replace(
      new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`),
      summary.trim()
    );
    fs.writeFileSync(PRD_PATH, updated);
  } else {
    fs.writeFileSync(PRD_PATH, `${content.trim()}\n\n${summary}`);
  }
};

const updateSecurityChecklist = (report: AuditReport) => {
  if (!fs.existsSync(CHECKLIST_PATH)) {
    return;
  }

  const startMarker = "<!-- AUTO_SECURITY_REPORT_START -->";
  const endMarker = "<!-- AUTO_SECURITY_REPORT_END -->";

  const semgrepPath = path.join(ROOT_DIR, "semgrep.json");
  let semgrepCount = null as number | null;
  if (fs.existsSync(semgrepPath)) {
    try {
      const semgrep = JSON.parse(fs.readFileSync(semgrepPath, "utf8"));
      semgrepCount = Array.isArray(semgrep?.results) ? semgrep.results.length : 0;
    } catch {
      semgrepCount = null;
    }
  }

  const coverageResult = report.results.find((item) => item.category === "coverage");
  const coverageLine = coverageResult
    ? `- Coverage: ${coverageResult.message}`
    : "- Coverage: n/a";

  const semgrepLine =
    semgrepCount === null ? "- Semgrep: rapor bulunamadi" : `- Semgrep: ${semgrepCount} issue`;

  const block = `\n${startMarker}\n## Otomatik Guvenlik Raporu\n- Tarih: ${new Date().toISOString()}\n- Audit Sonucu: ${report.passed ? "READY" : "BLOCKED"}\n- PASS: ${report.summary.passed}\n- WARN: ${report.summary.warned}\n- FAIL: ${report.summary.failed}\n${coverageLine}\n${semgrepLine}\n${endMarker}\n`;

  const current = fs.readFileSync(CHECKLIST_PATH, "utf8");
  if (current.includes(startMarker) && current.includes(endMarker)) {
    const updated = current.replace(new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`), block.trim());
    fs.writeFileSync(CHECKLIST_PATH, updated);
  } else {
    fs.writeFileSync(CHECKLIST_PATH, `${current.trim()}\n\n${block}`);
  }
};

const runPreProductionAudit = async (): Promise<AuditReport> => {
  const results: AuditResult[] = [];

  results.push(await checkSchemaHasTenantId());
  results.push(await checkMiddlewareActive());
  results.push(await checkEnvironmentConfig());
  results.push(await checkBypassConfig());
  results.push(await checkDatabaseIndexes());
  results.push(await checkEndpointProtection());
  results.push(await checkAuditLog());
  results.push(await checkTestCoverage());

  const blockers = results.filter(
    (result) => result.status === FAIL && result.severity === "CRITICAL"
  );

  const summary = {
    passed: results.filter((result) => result.status === PASS).length,
    warned: results.filter((result) => result.status === WARN).length,
    failed: results.filter((result) => result.status === FAIL).length,
  };

  return {
    passed: blockers.length === 0,
    results,
    blockers,
    summary,
  };
};

const main = async () => {
  loadEnvironment();
  console.log("?? ZenithCRM Tenant Isolation Pre-Production Audit");

  const report = await runPreProductionAudit();

  report.results.forEach((result) => {
    logLine(result.status, result.message);
  });

  if (report.blockers.length) {
    console.log(`? BLOCKERS: ${report.blockers.length}`);
  } else {
    console.log("?? READY FOR PRODUCTION");
  }

  const htmlReport = generateHTMLReport(report);
  fs.writeFileSync(path.join(ROOT_DIR, "audit-report.html"), htmlReport);
  console.log("?? Report saved to audit-report.html");

  writeAuditToPRD(report);
  updateSecurityChecklist(report);

  await prisma.$disconnect();

  if (!report.passed) {
    process.exit(1);
  }
};

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
