# Tenant Isolation Operations Runbook

## TL;DR
- Gunluk: bypass abuse + tenant ihlal raporu kontrolu
- Haftalik: consistency taramasi ve coverage raporu
- Incident: audit log ile kullanici/durum tespiti

## Gunluk Kontroller (09:00)
```bash
npm run report:tenant-violations --since=yesterday
npm run report:bypass-abuse --since=yesterday
npm run report:suspicious-activity --since=yesterday
```

## Haftalik Kontroller (Pazartesi)
```bash
npm run check:tenant-consistency
npm run test:coverage:report
```

## Incident Response
### Supheli Cross-Tenant Access
1. Audit log tarama
2. Kullanici gecici blok
3. Security ekibine bildirim

### Bypass Abuse
1. Bypass gecmisi incele
2. Manager'a bildirim

## Monitoring Query Ornekleri
```sql
SELECT COUNT(*) FROM audit_log WHERE action = 'TENANT_VIOLATION' AND created_at > NOW() - INTERVAL '24 hours';
```

## Monitoring Query Ornekleri (Genislet)

### Anormal Tenant Switching
```sql
SELECT 
    user_id,
    COUNT(DISTINCT tenant_id) as tenant_count,
    ARRAY_AGG(DISTINCT tenant_id) as tenants
FROM audit_log
WHERE created_at > NOW() - INTERVAL '10 minutes'
GROUP BY user_id
HAVING COUNT(DISTINCT tenant_id) >= 3;
```

### En Cok 404 Alan Kullanicilar
```sql
SELECT 
    user_id,
    COUNT(*) as failed_attempts,
    COUNT(DISTINCT resource_id) as unique_resources
FROM audit_log
WHERE action = 'ACCESS_DENIED'
AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id
HAVING COUNT(*) > 50
ORDER BY failed_attempts DESC;
```

### Bypass Pattern Analizi
```sql
SELECT 
    user_id,
    reason,
    COUNT(*) as count,
    MAX(created_at) as last_used
FROM audit_log
WHERE action = 'BYPASS_USED'
GROUP BY user_id, reason
HAVING COUNT(*) > 20
ORDER BY count DESC;
```

## Incident Response (Genislet)

### Senaryo 1: Supheli Cross-Tenant Access
**Alert:** "High volume of 404 errors from single user"

**Adimlar:**
1. **Kullaniciyi tespit et**
```bash
npm run audit:user-activity --user-id=X --last=1h
```

2. **Erisim paternini incele**
```sql
SELECT 
    action,
    resource_type,
    resource_id,
    status_code,
    COUNT(*) as count
FROM audit_log
WHERE user_id = X
AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY action, resource_type, resource_id, status_code;
```

3. **Gercek ihlal mi kontrol et**
- Sequential ID'ler -> enumeration attack
- Random ID'ler -> kullanici hatasi olabilir

4. **Aksiyon al**
```bash
npm run user:temp-block --user-id=X --duration=24h --reason="Suspected enumeration attack"
```

5. **Security team'e rapor et**
```bash
npm run incident:create --type=CROSS_TENANT_ACCESS --user-id=X --severity=HIGH --attach-logs
```

### Senaryo 2: Bypass Abuse
**Alert:** "User exceeded bypass limit"

**Adimlar:**
1. **Bypass gecmisini incele**
```bash
npm run bypass:audit --user-id=X --show-affected-tenants --show-record-counts
```

2. **Pattern analizi**
- Ayni reason ile 50+ bypass -> script abuse
- Gece saatleri -> supheli

3. **Onay kontrolu**
```sql
SELECT * FROM bypass_approvals WHERE user_id = X AND created_at > NOW() - INTERVAL '7 days';
```

4. **Aksiyon**
```bash
npm run bypass:revoke --user-id=X
npm run notify:manager --user-id=X --type=UNAUTHORIZED_BYPASS
```

### Senaryo 3: Veri Tutarsizligi Tespit Edildi
**Alert:** "Cross-tenant relation detected in production"

**Adimlar:**
1. **Tutarsizligi tespit et**
```bash
npm run check:tenant-consistency --verbose
```

2. **Etkilenen kayitlari listele**
```bash
npm run tenant:list-violations --model=Policy --export=csv
```

3. **Veri kaybi olmadan duzelt**
```bash
npm run tenant:fix-violations --dry-run
npm run db:backup
npm run tenant:fix-violations --strategy=move-to-parent-tenant
```

4. **Nasil olustu arastir**
```sql
SELECT * FROM audit_log WHERE action = 'CREATE' AND resource_id = [problematic_policy_id] ORDER BY created_at DESC;
```
