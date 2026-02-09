# Monitoring Dashboard (Tenant Isolation)

## Hedef
Tenant izolasyonu ve auth risklerini tek ekranda izlemek.

## Dashboard Bolumleri
1. Tenant Isolation Violations
   - Metric: `tenant_isolation_violations_total`
   - View: rate(5m) + 24h toplam
2. Auth Failures
   - Metric: `auth_failures_total{endpoint}`
   - View: top endpoints + rate(5m)
3. Bypass Usage
   - Metric: `bypass_usage_total{user_id, reason}`
   - View: user bazli heatmap
4. 5xx Error Rate
   - Metric: `http_5xx_total`
   - View: rate(5m) + spike alarm

## Alert Esikleri (Referans)
- HighCrossTenantAttempts: `rate(tenant_isolation_violations_total[5m]) > 5`
- BypassAbuseDetected: `sum(rate(bypass_usage_total[1h])) > 20`
- MiddlewareDisabled: `tenant_middleware_enabled == 0`

## Notlar
- Grafana/Prometheus veya Sentry Metrics kullanilabilir.
- Bu dokuman dashboard setup’ini tanimlar.

