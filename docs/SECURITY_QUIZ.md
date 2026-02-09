# Security Basics Quiz (Tenant Isolation)

## Sorular (10)
1. Tenant izolasyonunun temel amaci nedir?
2. `findMany` sorgularinda tenantId nasil zorunlu hale gelir?
3. `update` islemlerinde tenant kontrolu neden once yapilir?
4. Include/nested relations neden risklidir?
5. Bypass mekanizmasi hangi rollerle sinirlandirilir?
6. Bypass kullanimi nasil audit edilir?
7. JWT dogrulama fail olursa hangi HTTP kodu doner?
8. CSRF korumasi hangi durumda zorunludur?
9. Cross-tenant veri sizintisi nasil tespit edilir?
10. Acil durum prosedurunde ilk adim ne olur?

## Cevap Anahtari (Kisa)
1. Cross-tenant veri sizintisini engellemek.
2. Prisma middleware `where` icine tenantId inject eder.
3. Baska tenant kaydina yazmayi engellemek.
4. Parent scope yoksa relation baska tenanttan gelebilir.
5. SUPER_ADMIN, SYSTEM_JOB, DATA_ANALYST.
6. `logAudit` ile `BYPASS`/`BYPASS_ABUSE` eventleri.
7. 401 Unauthorized.
8. Cookie auth kullanilan state-changing isteklerde.
9. `tenant_isolation_violations_total` ve Sentry.
10. Tenant middleware’i durdurmak / rollback.

