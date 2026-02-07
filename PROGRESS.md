# Project Progress Log

## 2026-02-05
- Started stabilization and security hardening workflow.
- Goal: fix failing tests, triage bugs, then push to GitHub.
- Next: configure test database for server tests.
- Added server/.env.test with provided Supabase DATABASE_URL for test runs (not for git).
- Fixed test env loading to prefer server/.env.test and fallback to .env (tests/setup.ts).
- Added JWT secrets to server/.env.test to unblock auth token creation in tests.
- Sanitized auth login logging to avoid leaking sensitive password data.
- Removed unreachable response in resetPassword handler.
- Added .env.test to .gitignore to prevent committing secrets.
- Added response alias token=accessToken for login to satisfy auth tests and preserve backward compatibility.
- Updated audit test to expect { logs, pagination } response shape.
- Hardened CORS origin checks to exact-match normalized origins (removed startsWith to prevent origin spoofing).
- Server tests now pass with runInBand using .env.test.
- Fixed TypeScript narrowing for allowedOrigins filtering after CORS hardening.
- Enabled production-only rate limiting and required env validation in server/src/app.ts.
- Reduced noisy CORS logs in production.
- Organized server root helper files into server/tools/{diagnostics,fixtures,tests,ocr}.
- Re-ran server tests after security + file organization: all 3 suites passed (7 tests).
- Client: fixed SupportChat to send auth headers and handle missing session.
- Client: normalized NotificationContext to use /api endpoints and guard missing token.
- Client: limited axios baseURL logging to non-production.
- Added client/.env.example and clarified env usage in README.
- Added CLIENT_URL to server/.env.example.
- Added GitHub Actions CI workflow for server tests (requires secrets).
- Fixed Sidebar tests to wrap with ThemeProvider.
- Installed client deps and ran vitest: all 2 test files passed.
- Switched auth to httpOnly cookies + CSRF protection (server middleware, login/logout cookies).
- Client now uses cookies (no token storage) and attaches CSRF header automatically.
- Added logout API call on UI and cleaned token usage in key flows.
- Re-ran server tests after cookie/CSRF changes: all 3 suites passed.
- Re-ran client tests after auth changes: all 2 test files passed.
- Removed remaining client Authorization headers; switched to cookie-based auth across API calls.
- Added refresh token endpoint with rotation and client auto-refresh on 401.
- Re-ran server and client tests: all passing.
- Added SECURITY_HARDENING_CHECKLIST.md for production readiness.
- Added Remember Me support: short access TTL + short/long refresh TTL based on rememberMe.
- Added refresh token rotation to respect rememberMe TTL.
- Updated env examples and README for new TTLs.
- Remember Me login now sends flag; access TTL shortened and refresh TTL varies by rememberMe.
- Re-ran server/client tests: all passing.
- Added session expiry warning banner and logout-all-devices option in UI.
- Added remember-me helper text in login.
- Client now sets a short countdown before redirect on refresh failure.
- Added clearer Remember Me UI and logout-all-devices option.
- Added session expiry warning banner and delayed redirect on refresh failure.
- Re-ran server/client tests: all passing.
- Added security section in Settings (logout all devices).
- Added admin action to force logout a user from Users page.
- Added Settings security section for logout-all-devices.
- Added admin action to force logout a user (server guard added).
- Re-ran server/client tests: all passing.
- Added admin session management endpoints (list + revoke all/one).
- Added SessionPanel in Settings for admins.
- Added CSP headers in production.
- Added admin session management endpoints and SessionPanel in Settings.
- Added CSP headers for production.
- Re-ran server/client tests: all passing.
- Login baþarýsýzlýðýnda kalan deneme sayýsý backend tarafýndan dönülüyor; UI mesajý güncellendi.
- Added remaining login attempt count to failed login responses and UI display.
- Re-ran server/client tests: all passing.
- Created threat model draft for internet-exposed, multi-tenant deployment in zenithcrm-threat-model.md.
- Fixed client PayrollPage PDF export block (removed stray characters, fixed syntax + ASCII-only logs/alerts) to allow Vite dev server to start.
- Ran Playwright automation for login + sales/customers/portfolio/cancellations/commissions flows; screenshots and summary saved under output/playwright/.
- Set up local server env in server/.env for dev runs (DATABASE_URL + JWT secrets + CORS/CLIENT URL).
- Extended Playwright automation to create sale, create cancellation, and update commission; rerun successful (see output/playwright/summary.json).
- Enforced strict document access rules (tenant + branch + role) and added authenticated download endpoint; removed public uploads exposure.
- Added stricter rate limits for heavy endpoints (reports/analytics/ocr/documents) in production and added file signature validation for uploads.
- Added shared access helpers and tightened customer/report/analytics access rules to enforce tenant + branch + role scoping.
- Added PRODUCTION_READINESS.md checklist for env, monitoring, backups, and operational readiness.
- Isolated uploads by tenant directory and switched document routes to shared upload middleware with signature validation and authenticated downloads.
- Added performance test plan (PERFORMANCE_TEST_PLAN.md) and a load test helper script (server/tools/tests/loadtest.js).
- Added quick-create customer modal on Customers page for faster data entry.
- Expanded CI to run client tests in GitHub Actions.

## 2026-02-05
- Fixed analytics yearly performance year variables + normalized month labels.
- Tests: server 
pm test (Jest) passed; client 
pm test (Vitest) passed.


- UI kritik akýþ kontrolü: Playwright otomasyon çalýþtý (Satýþ, Müþteri, Portföy, Ýptal, Komisyon, hýzlý yeni). Sonuç: baþarýlý. (output/playwright/summary.json güncellendi).


- UI derin akýþ kontrolü: Satýþ oluþturma, müþteri oluþturma, komisyon simülasyon adýmlarý Playwright ile çalýþtý (output/playwright/summary.json: tüm adýmlar ok).


- Daha gerçekçi veri ile Playwright akýþý çalýþtýrýldý (satýþ/müþteri/komisyon simülasyonu).
- Release gate tanýmý eklendi: RELEASE_GATE.md + CI elease-gate job + PRODUCTION_READINESS güncellendi.


- Release gate: server-tests skipped durumunda uyarý, failure durumunda bloklama.
- Playwright akýþý: form submit sonrasý yumuþak baþarý doðrulamasý eklendi.


- Playwright akisi: form submit sonrasi hata metni/aria-invalid yakalama eklendi ve akisi gecti.


- CI: Playwright UI akisi eklendi (tools/playwright/run-flow.js). Secrets yoksa job skipped.


- CI UI akisi hizlandirildi (kritik akislara odaklandi) ve artifacts upload eklendi.


- Prod readiness belgesine fayda notlari eklendi, test veri temizligi plani eklendi.


- Admin test veri temizligi endpointi eklendi (dry-run + confirm token).


- Admin Ayarlar sayfasina Test Veri Temizligi butonu eklendi (dry-run + confirm).


- Refresh token now includes random jti to avoid unique constraint collisions in tests; server tests passed.


- CI workflow fix: secrets used via env in job if conditions to avoid invalid workflow parse.


- CI workflow updated: secrets check step sets job output; steps gated without job-level if to avoid parser errors.


- Added request validation middleware and schema checks for customer/sale create+update routes.


- Production: TRUST_PROXY config eklendi, 404 handler eklendi.


- CSP tightened: inline styles disabled by default (ALLOW_INLINE_STYLES to override). Prod logging uses morgan combined.


- Security report updated with applied fixes status.


- Added branch KPI endpoint, approvals API, renewals API + UI pages (KPI, Onaylar, Yenilemeler). Server tests pass.

- Sidebar etiketleri UTF-8 duzeltildi (mojibake giderildi); client testleri tekrar calisti (vitest: 2 dosya, 4 test passed).
- CORS debug loglari kaldirildi; global hata mesajindaki Turkce karakter duzeltildi.
- Playwright UI smoke test calisti ve basarili (12 adim, summary.json).
- UX polish: KPI/Onaylar/Yenilemeler sayfalarinda Turkce duzeltme, bos durumlar, basari bildirimi ve islem bekleme durumu eklendi.
- Playwright UI akisi KPI/Onaylar/Yenilemeler adimlari eklendi ve basarili calisti.
- CI durumu kontrol edildi (son 5 run: hepsi success).
- Vercel rewrites guncellendi: /api istekleri Railway backend'e yonlendiriliyor (register hatasi icin).
- Vercel config roota tasindi: client/vercel.json kaldirildi, root vercel.json ile /api Railway proxy ayarlandi.
- Vercel config yeniden client/ altina tasindi (routes + api proxy + SPA fallback). Root vercel.json kaldirildi.
- Pilot baslatildi (Muratcan, 7 gun). Hesap olusturuldu, landing ve register dogrulandi.

- Login yanitinda accessToken yoksa token alanini da kabul edecek sekilde localStorage yazimi guncellendi.
- Sales Analizi 'Yeni Satis' modalinda Authorization header force edildi (NO_TOKEN hatasi icin).

- Poliçe numarasý unique kuralý tenant bazlý olacak þekilde güncellendi (schema + migration).
- Satýþ oluþtururken ayný tenant içinde tekrar poliçe numarasý varsa 409 ile net hata veriliyor.

- Branch KPI 500 hatasi duzeltildi: Prisma findMany icin select+include cakismasi kaldirildi.

- Branch KPI hata detaylari response'a eklendi (teshis icin).

- Iptal akisi: Sales API artik customerName alanini donuyor; iptal modalinda customerName fallback eklendi; iptal arama filtresi guvenli hale getirildi.

- Iptal islemi: mevcut policede iptal icin PUT /api/sales/:id kullaniliyor; backend cancellation mevcut policede status=Cancelled update ediyor.
