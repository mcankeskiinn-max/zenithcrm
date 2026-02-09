# Security Architecture (ZenithCRM)

**TL;DR:**
- Multi-tenant izolasyon: okuma/yazma/iliski kontrolleri tenant bazli ve fail-closed.
- Katmanli savunma: 11 guvenlik duvari.
- Fail-closed: tenant mismatch ve auth hatalari default olarak engeller.

## 1) Kimlik Dogrulama ve Yetkilendirme Duvari
**Ne Yapar:** JWT dogrular, kullanici/tenant baglami kurar, role check uygular.
**Kontroller:**
- ✅ JWT signature ve expiry dogrulama
- ✅ Kullanici aktif mi kontrolu
- ✅ Role tabanli yetkilendirme
- ✅ TenantId mismatch kontrolu
**Fail Scenario:**
- Token gecersiz/expired -> 401 Unauthorized
- TenantId mismatch -> 401 Unauthorized
- Yetkisiz role -> 403 Forbidden
**Amac:** Yetkisiz erisimi engellemek.

## 2) Tenant/Branch Izolasyon Duvari ⭐ (EN KRITIK)

### 2.1. Okuma Operasyonlari (Read)
**Kod Ornegi:**
```ts
// src/lib/prisma-tenant-middleware.ts
// Bu kontrol neden gerekli? Cross-tenant read engeller.
if (['findMany','findFirst','count'].includes(params.action)) {
  params.args.where = { ...(params.args.where || {}), tenantId: requireTenantId() };
}
```
**Kontroller:**
- ✅ findMany/findFirst/count icin tenantId zorunlu
- ✅ tenantId mismatch varsa error
**Fail Scenario:** tenantId farkli istek -> 403/404
**Attack Vector:** ID enumeration ile baska tenant verisi cekme girisimi.

### 2.2. Yazma Operasyonlari (Write)
**Kod Ornegi:**
```ts
// create/update/delete
// Bu kontrol neden gerekli? Cross-tenant write engeller.
if (params.action === 'create') {
  params.args.data.tenantId = requireTenantId();
}
if (['update','delete'].includes(params.action)) {
  // once tenant scope kontrol edilir
  await assertRecordInTenant(params.model, params.args.where.id);
}
```
**Kontroller:**
- ✅ create icin tenantId inject
- ✅ update/delete once tenant scope check
**Fail Scenario:** baska tenant kaydina update/delete -> 404/403
**Attack Vector:** baska tenant kaydini silme/degistirme.

### 2.3. Foreign Key Consistency
**Kod Ornegi:**
```ts
// Sale -> Customer tenant tutarliligi
// Bu kontrol neden gerekli? Iliskili kayit farkli tenant olamaz.
const customer = await prisma.customer.findFirst({
  where: { id: data.customerId, tenantId: requireTenantId() }
});
if (!customer) throw new TenantMismatchError();
```
**Kontroller:**
- ✅ Iliskili kayit ayni tenant mi
- ✅ Mismatch -> hata
**Fail Scenario:** Sale baska tenantin customer'ina baglanmak istenir.
**Attack Vector:** Cross-tenant data grafting.

### 2.4. Include/Nested Relations
**Kod Ornegi:**
```ts
// include altinda relation varsa parent scope ile sinirla
// Bu kontrol neden gerekli? nested relation cross-tenant sizmeyi engeller.
const sales = await prisma.sale.findMany({
  where: { tenantId: requireTenantId() },
  include: { customer: true }
});
```
**Kontroller:**
- ✅ Parent query tenant scope
- ✅ Relation query otomatik scope
**Fail Scenario:** Parent tenant mismatch -> bos/403
**Attack Vector:** include ile baska tenantin relation'ini cekme.

**Threat Model:**
- **ID Enumeration Attack:** tenant scope dogrulama ile engellenir.
**Monitoring:**
- Metric: `tenant_isolation_violations_total`
- Alert: `rate(tenant_isolation_violations_total[5m]) > 5` -> WARNING -> NOTIFY

## 3) Bypass Mekanizmasi ve Audit Duvari 🔐 (YENI)

### 3.1. Role-Based Bypass
**Kod Ornegi:**
```ts
// src/utils/tenant-bypass.ts
// Bu kontrol neden gerekli? Sadece belirli roller bypass yapar.
await runWithBypass({ actorId, actorRole: 'SUPER_ADMIN', reason: 'support' }, async () => {
  return prisma.customer.findMany({ where: { tenantId: targetTenantId } });
});
```
**Kontroller:**
- ✅ Roller: SUPER_ADMIN, SYSTEM_JOB, DATA_ANALYST
- ✅ reason zorunlu
**Fail Scenario:** rol uygun degil -> TenantBypassError
**Attack Vector:** Yetkisiz kullanicinin bypass ile veri cekmesi.

### 3.2. Abuse Detection
**Monitoring Metric (Prometheus):**
```promql
sum(rate(bypass_usage_total[1h])) by (user_id, reason)
```
**Alert Rules (Threshold + Action):**
- 1 saatte 10+ bypass -> WARNING -> NOTIFY
- Is saatleri disi bypass -> WARNING -> NOTIFY
- Ayni reason ile 50+ bypass -> CRITICAL -> NOTIFY + BLOCK

### 3.3. Audit Logging
**JSON Ornegi:**
```json
{
  "event": "TENANT_BYPASS",
  "actorId": "u123",
  "role": "SUPER_ADMIN",
  "tenantId": "t1",
  "targetTenantId": "t2",
  "reason": "support_case_554",
  "timestamp": "2026-02-09T12:00:00Z"
}
```
**Fail Scenario:** audit yazilamazsa bypass iptal edilir.

## 4) Veri Tutarliligi (Data Consistency) Duvari (YENI)
- Haftalik consistency scan: Pazartesi 02:00
- Kontroller: Policy -> Customer, Sale -> Branch, Task -> User
- Tutarsizlik bulunursa: Alert + rapor uretimi
- Duzeltme: `npm run tenant:fix-violations`

**Fail Scenario:** scan hata verirse -> CRITICAL alarm + scan yeniden calistirilir.

**Ornek Rapor:**
```
Tenant Consistency Report - 2026-02-09
✗ Found 3 cross-tenant relations in Policy -> Customer

Policy #456 (tenant: 1) -> Customer #789 (tenant: 2)
Policy #812 (tenant: 2) -> Customer #991 (tenant: 1)
Policy #901 (tenant: 3) -> Customer #122 (tenant: 2)
```

## 5) CSRF ve Cookie Guvenligi Duvari
**Ne Yapar:** Cookie auth icin CSRF header/cookie dogrular.
**Kontroller:**
- ✅ CSRF token header zorunlu
- ✅ Cookie flag: Secure/SameSite/HttpOnly
**Fail Scenario:** CSRF token yok -> 403
**Amac:** Tarayici kaynakli sahte istekleri engellemek.

## 6) CORS Duvari
**Ne Yapar:** Sadece allowlist origin'lere izin verir.
**Fail Scenario:** izinli olmayan origin -> 403
**Amac:** Yetkisiz cross-origin erisimi kesmek.

## 7) Rate Limit / Abuse Duvari
**Ne Yapar:** brute force ve abuse'u sinirlar.
**Fail Scenario:** limit asimi -> 429
**Amac:** Yetkisiz deneme/hizli deneme saldirilarini yavaslatmak.

## 8) Guvenli Basliklar ve CSP Duvari
**Ne Yapar:** XSS ve content injection riskini azaltir.
**Fail Scenario:** CSP ihlali -> tarayici bloklar
**Amac:** Icerik enjeksiyonunu engellemek.

## 9) Dosya Yukleme Duvari
**Ne Yapar:** MIME ve boyut limitleri.
**Fail Scenario:** invalid mime -> 400
**Amac:** Zararlı dosya yuklemelerini engellemek.

## 10) Gozlem ve Alarm Duvari (Monitoring & Alerting)
### 10.1. Error Monitoring (Sentry)
- Auth fail, tenant mismatch, 5xx hatalari izlenir.
### 10.2. Metrics (Prometheus)
```yaml
- tenant_isolation_violations_total
- bypass_usage_total{user_id, reason}
- auth_failures_total{endpoint}
```
**PromQL Ornekleri:**
```promql
rate(tenant_isolation_violations_total[5m])
sum(rate(bypass_usage_total[1h])) by (user_id, reason)
sum(rate(auth_failures_total[5m])) by (endpoint)
```
### 10.3. Alerts
```yaml
- HighCrossTenantAttempts: rate > 5/5min -> WARNING (NOTIFY)
- MiddlewareDisabled: middleware == 0 -> CRITICAL (BLOCK)
- BypassAbuseDetected: bypass > 20/hour -> WARNING (NOTIFY)
```
**PromQL Ornekleri:**
```promql
# HighCrossTenantAttempts
rate(tenant_isolation_violations_total[5m]) > 5

# MiddlewareDisabled (export edilen gauge varsayimi)
tenant_middleware_enabled == 0

# BypassAbuseDetected
sum(rate(bypass_usage_total[1h])) > 20
```
### 10.4. Dashboard
- Tenant violations
- Auth failures
- Bypass usage
- 5xx rate

**Fail Scenario:** error monitoring kapaliysa -> CRITICAL + deploy block.

## 11) Operasyonel Kapi (Release Gate)
- PR checklist + security checklist + threat model review zorunlu.
**Fail Scenario:** release gate fail -> prod cikis durur.

---

## 🎯 SAVUNMA KATMANLARI ONCELIK SIRASI (YENI)
- 🔴 CRITICAL: Tenant Izolasyonu, JWT Dogrulama
- 🟡 HIGH: Bypass Audit, Data Consistency
- 🟢 MEDIUM: CSRF, Rate Limiting
- 🔵 LOW: CSP/Helmet, File Upload

## 📊 THREAT MODEL OZET (YENI)
| Tehdit | Olasilik | Etki | Risk Skoru | Savunma Katmani |
|--------|----------|------|------------|-----------------|
| Cross-tenant veri sizintisi | Orta | Kritik | YUKSEK | #2 Tenant Izolasyonu |
| ID Enumeration attack | Yuksek | Orta | ORTA | #2 Tenant Izolasyonu |
| Bypass abuse | Dusuk | Yuksek | ORTA | #3 Bypass Audit |
| JWT manipulation | Dusuk | Kritik | ORTA | #1 JWT Dogrulama |

**Exploit Senaryolari:**
- Cross-tenant: saldirgan baska tenant ID ile data cekmeye calisir.
- ID enumeration: artan ID denemeleriyle veri toplar.
- Bypass abuse: rol kotuye kullanilarak tenant disi erisim.
- JWT manipulation: token manipule edilerek rol/tenant uretme.

**Savunma Mekanizmalari:**
- #1 JWT dogrulama
- #2 Tenant izolasyon
- #3 Bypass audit

## 🚀 ACIL DURUM PROSEDURU (YENI)
### Senaryo 1: Tenant Izolasyonu Ihlali
**Belirti:** cross-tenant erisim loglari
**Mudahale (ETA: 15 dk):**
```bash
# 1. Middleware'i derhal kapat
kubectl set env deployment/api TENANT_MIDDLEWARE_ENABLED=false
# 2. Etkilenen tenantlari tespit et
npm run audit:isolation-breach --since=1h
# 3. Rollback
kubectl rollout undo deployment/api
# 4. DB snapshot
# 5. Rapor ve musterileri bilgilendir
```

### Senaryo 2: Mass Cross-Tenant Attack
**Belirti:** tenant_isolation_violations_total spike
**Mudahale (ETA: 10 dk):**
```bash
# 1. Rate limit arttir
# 2. WAF rule ekle
# 3. Tokenlari invalidate et
# 4. Log analizi
# 5. Incident bildirimi
```

### Senaryo 3: Middleware Devre Disi Kaldi
**Belirti:** middleware metric == 0
**Mudahale (ETA: 5 dk):**
```bash
# 1. Config rollback
# 2. Deploy rollback
# 3. Health check
# 4. Root cause analizi
# 5. Preventive fix
```

## 📚 ILGILI DOKUMANTASYON (YENI)
- [Tenant Isolation PRD](./docs/TENANT_ISOLATION_PRD.md)
- [RUNBOOK.md](./docs/RUNBOOK.md)
- [ROLLBACK_PLAN.md](./docs/ROLLBACK_PLAN.md)
- [CONTRIBUTING.md](./docs/CONTRIBUTING.md)

## ✅ GUVENLIK MIMARISI DENETIM KONTROL LISTESI (YENI)
### Haftalik Kontroller (Her Pazartesi)
- [ ] Tenant consistency scan calistirildi mi?
- [ ] Bypass abuse raporu incelendi mi?
- [ ] Test coverage %95+ mi?

### Aylik Kontroller
- [ ] Dependency vulnerability scan
- [ ] Penetration test raporu review
- [ ] Security incident postmortem dokumani

### Ceyreklik Kontroller
- [ ] External security audit
- [ ] Threat model guncellendi mi?
- [ ] Disaster recovery plan test edildi mi?

**Son Guncelleme:** 2026-02-09
**Versiyon:** 2.0
**Durum:** Production-Ready ✅
