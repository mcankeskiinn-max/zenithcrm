/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    verbose: true,
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    testTimeout: 15000,
    coverageDirectory: '<rootDir>/coverage',
    coverageReporters: ['json-summary', 'text', 'lcov'],
    collectCoverageFrom: [
        '<rootDir>/src/middleware/**/*.ts',
        '!<rootDir>/src/middleware/upload.middleware.ts',
        '<rootDir>/src/lib/prisma-tenant-middleware.ts',
        '<rootDir>/src/utils/tenant-*.ts',
        '<rootDir>/src/utils/audit.util.ts',
        '<rootDir>/src/monitoring/bypass-abuse-detector.ts'
    ],
    coverageThreshold: {
        global: {
            statements: 80,
            branches: 70,
            functions: 80,
            lines: 80
        },
        './src/lib/prisma-tenant-middleware.ts': {
            statements: 85,
            branches: 70,
            functions: 85,
            lines: 85
        },
        './src/middleware/auth.middleware.ts': {
            statements: 85,
            branches: 70,
            functions: 85,
            lines: 85
        },
        './src/middleware/csrf.middleware.ts': {
            statements: 85,
            branches: 70,
            functions: 85,
            lines: 85
        },
        './src/utils/tenant-context.ts': {
            statements: 85,
            branches: 70,
            functions: 85,
            lines: 85
        },
        './src/utils/tenant-bypass.ts': {
            statements: 85,
            branches: 70,
            functions: 85,
            lines: 85
        },
        './src/utils/tenant-errors.ts': {
            statements: 85,
            branches: 70,
            functions: 85,
            lines: 85
        }
    }
};
