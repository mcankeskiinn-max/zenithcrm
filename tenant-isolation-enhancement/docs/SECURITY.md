# SECURITY

## Tenant Izolasyonu Kurallari
- Her ORM sorgusu tenantId ile scope edilmelidir.
- findUnique kullanimi otomatik findFirst'e cevrilir.
- update/delete oncesi tenant ownership dogrulanir.
- Foreign key iliskilerinde tenant tutarliligi zorunludur.

## Bypass
- Yalniz SUPER_ADMIN ve SYSTEM_JOB rolunde izinli.
- Reason zorunludur ve audit loga yazilir.

