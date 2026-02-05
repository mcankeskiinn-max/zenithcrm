# Security Best Practices Report (Sigorta CRM)

Date: 2026-02-06

## Executive Summary
Genel guvenlik temeli iyi: cookie tabanli oturum, CSRF, rate-limit, CSP/CORS ve rol/tenant izolasyonu mevcut. Ancak sigorta acentesi gibi hassas bir panel icin veri dogrulama eksikleri ve proxy/404/logging gibi operasyonel guvenlik bosluklari risk olusturuyor. Asagidaki bulgular giderildiginde guvenlik seviyesi belirgin sekilde artar.

## Findings

### SEC-EXPRESS-001 (High) ? Write endpoint?lerde merkezi input dogrulamasi eksik
Location: `server/src/controllers/customer.controller.ts:124-144`, `server/src/controllers/sale.controller.ts:80-176`

Evidence:
- `createCustomer` icinde `req.body` degerleri dogrudan kullaniliyor ve schema dogrulamasi yok.
  `const { name, email, phone, identityNumber, address, notes } = req.body;`
  `prisma.customer.create({ data: { ... } })`
- `createSale` icinde `amount`, `policyNumber`, `customerName` vb. alanlar dogrudan aliniyor.
  `const { amount, policyNumber, ... } = req.body;`
  `amount: Number(amount)`

Impact:
Hatali/eksik/sekil bozuk veriler DB?ye yazilabilir, is kurallari bozulabilir, beklenmeyen tipler runtime hatalarina ve saldirganin sistem davranisini istismar etmesine yol acabilir.

Fix (Oneri):
Route seviyesinde `zod` veya `express-validator` ile schema dogrulamasi ekleyin (or. `createCustomer` ve `createSale`).

Mitigation:
En azindan zorunlu alanlar ve tip dogrulama ekleyin; string uzunluk sinirlari koyun.

---

### SEC-EXPRESS-002 (Medium) ? `trust proxy` konfig?rasyonu yok
Location: `server/src/app.ts` (dosyada `app.set('trust proxy', ...)` bulunmuyor)

Evidence:
`server/src/app.ts` icinde Express app kurulumu var fakat `trust proxy` ayari gorunmuyor.

Impact:
Reverse proxy/CDN arkasinda `req.ip`, `req.protocol` ve rate-limit davranisi yanlis olabilir. Bu, loglama ve guvenlik denetimlerinde yanlis kararlara yol acar.

Fix (Oneri):
Uretimde altyapiniza uygun sekilde `app.set('trust proxy', 1)` veya spesifik proxy listesi tanimlayin.

Mitigation:
Proxy katmaninda `X-Forwarded-*` basliklarinin dogru sekilde set edildigini dogrulayin.

---

### SEC-EXPRESS-003 (Low) ? 404 handler eksik
Location: `server/src/app.ts:137-184` (t?m route?lar tanimli, 404 handler yok)

Evidence:
Route?lar tanimlandiktan sonra yalnizca global error handler var; 404 icin ayri handler yok.

Impact:
Istemci hatalari icin tutarsiz yanitlar ve zayif gozlemlenebilirlik (observability) olusur.

Fix (Oneri):
Route?lardan sonra bir 404 handler ekleyin:
```ts
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
```

---

### SEC-EXPRESS-004 (Low) ? CSP?de `style-src 'unsafe-inline'`
Location: `server/src/app.ts:31-49`

Evidence:
`styleSrc: ["'self'", "'unsafe-inline'", "https:"]`

Impact:
Inline style izinleri XSS sonrasi saldirganin kalicilik/etki alanini artirabilir.

Fix (Oneri):
M?mk?nse inline style?lari kaldirip nonce/hash bazli CSP uygulayin.

Mitigation:
Kisa vadede CSP raporlama modunu acarak inline ihtiyacini olcebilirsiniz.

---

### SEC-EXPRESS-005 (Low) ? Prod?da `morgan('dev')` logging
Location: `server/src/app.ts:132`

Evidence:
`app.use(morgan('dev'));`

Impact:
Uretimde gereksiz detay loglanabilir. Loglar PII icerebilir veya saldirganin davranisini kolaylastirabilir.

Fix (Oneri):
Prod?da daha sade log format? (or. `combined` + PII mask) veya conditional log kullanin.

---

## Notes / Assumptions
- Infrastructure (CDN/WAF/TLS) gorunmuyor; uygulama kodu disindaki katmanlarin dogrulanmasi gerekir.
- Frontend tarafinda `dangerouslySetInnerHTML` kullan?m?na rastlanmadi.

## Recommended Next Steps
1. `createCustomer`, `createSale` ve diger write endpoint?lerde schema dogrulama ekleyin.
2. `trust proxy` ve 404 handler?i production icin tanimlayin.
3. CSP?yi inline style olmadan calisacak sekilde kademeli sikilastirin.
4. Prod logging politikasini gozden gecirin (PII mask/rotation).


## Status (Uygulandi)
- Input dogrulama: customer ve sale create/update icin schema validation eklendi.
- trust proxy + 404 handler eklendi.
- CSP inline style varsayilan kapali (ALLOW_INLINE_STYLES ile acilabilir).
- Prod logging morgan('combined') olarak guncellendi.
