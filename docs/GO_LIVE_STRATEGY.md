# Go-Live Strategy (Tenant Isolation)

## Hedef
Tenant izolasyonunu risk kontrollu sekilde production'da aktif etmek.

## Ortamlar
- Frontend: Vercel (prod)
- Backend: Railway (prod)

## Day 0 (Cuma Aksami) - Dark Launch
- `TENANT_MIDDLEWARE_ENFORCE=false` (log-only)
- `TENANT_MONITORING_VERBOSE=true`

## Day 1-2 (Hafta Sonu) - Monitor
- Log inceleme (anomali var mi?)
- Sentry: tenant violation ve auth failure spike kontrolu

## Day 3 (Pazartesi) - Gradual Rollout
- `TENANT_ENFORCEMENT_PERCENTAGE=10`
- 6 saat gozlem
- `TENANT_ENFORCEMENT_PERCENTAGE=50`
- 6 saat gozlem
- `TENANT_ENFORCEMENT_PERCENTAGE=100`

## Day 4 - Stabilize
- Monitoring yakindan takip
- Performance regression kontrolu

## Day 7 - Success
- Post-mortem ve ogrenimler

## RailWay Vars Set (ornek)
```bash
railway variables -e production -s zenithcrm-backend --set "TENANT_MIDDLEWARE_ENFORCE=false"
railway variables -e production -s zenithcrm-backend --set "TENANT_MONITORING_VERBOSE=true"
railway variables -e production -s zenithcrm-backend --set "TENANT_ENFORCEMENT_PERCENTAGE=10"
```

