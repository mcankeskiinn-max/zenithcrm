# TENANT-SECURITY

## Kurallar
- Her Prisma sorgusu tenantId ile scope edilir.
- findUnique otomatik findFirst'e cevrilir.
- update/delete oncesi tenant ownership dogrulanir.
- Foreign key iliskilerinde tenant tutarliligi zorunludur.

## Bypass
- Yalniz SUPER_ADMIN, SYSTEM_JOB, DATA_ANALYST
- Reason zorunlu, audit log yazilir
