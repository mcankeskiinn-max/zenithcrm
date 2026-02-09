# Tenant Isolation PRD (ZenithCRM)

## Ozet
Bu dokuman, ZenithCRM icin tenant izolasyonu (multi-tenant veri guvenligi) hedeflerini, kapsamini, mevcut durumu ve kalan riskleri tanimlar. Amac: bir tenantin baska tenant verilerine erisimini uygulama seviyesinde imkansiz hale getirmek ve yanlislikla veri sizintisini onlemek.

## Problem
Multi-tenant CRM'lerde en kritik risk, tenantlar arasi veri sizintisidir. Uygulama seviyesinde eksik tenant filtreleri, tekil `id` ile update/delete, servis katmaninda farkli ORM client kullanimi gibi durumlar bu riski arttirir.

## Hedefler
- Tenant izolasyonunun tum API okuma/yazma islemlerinde otomatik ve zorunlu hale gelmesi.
- Yanlis tenant ile veri okuma/yazma girisimlerinde sistemin fail-closed davranmasi.
- Yeni gelistirmelerde tenant filtrelerinin unutulmasini minimize eden altyapi saglamak.

## Hedef Disi (Bu Fazda)
- Database-level row-level security (RLS) etkinlestirme.
- Tenant bazli sharding / tamamen ayri DB.
- SSO / MFA / enterprise SSO politikasi.
- KVKK veri saklama, anonymization, retention kurallari.

## Kapsam
### Uygulama Seviyesi
- API endpointleri: update/delete islemlerinde tenantId scoping zorunlu.
- Prisma middleware ile tenantId otomatik scope.
- Request bazli tenant context.
- Mesajlasma ve bildirim servislerinde tenant izolasyonu.

### Dis Kapsam
- Arka planda calisan batch/cron job'larin tenant bazli veri segmantasyonu (notlar ve izleme plani mevcut).

## Guncel Durum (Yapilanlar)
1. Tenant Context
   - AsyncLocalStorage ile request boyunca tenantId tutuluyor.
   - `authenticate` middleware'i tenant context'i baslatir.

2. Prisma Tenant Scoping
   - findMany/findFirst/findUnique/count/aggregate/groupBy/updateMany/deleteMany:
     otomatik `tenantId` filtresi ekleniyor.
   - findUnique/findUniqueOrThrow cagrilari otomatik findFirst/findFirstOrThrow'a donusuyor.
   - create/createMany/upsert:
     tenantId yoksa ekleniyor, farkli ise hata.

3. Update/Delete Guvenligi
   - update/delete oncesi tenantId uyumlulugu kontrol ediliyor.
   - Yanlis tenant icin "Record not found or access denied" (404) donuyor.

4. Foreign Key Tenant Consistency
   - Iliskili kayitlar (customer, branch, user, policyType, sale, vb.) ayni tenant'a ait degilse islem reddediliyor.
   - Hem create hem update/upsert akislari icin uygulanir.

5. Servis Katmani Sertlestirme
   - NotificationService ve SupportService ortak prisma kullanir.
   - Message ve SupportMessage tenantId ile filtrelenir.
   - Notification cron job'lari tenantId bazli calisir.

6. Auth / JWT Tenant Dogrulamasi
   - JWT'deki tenantId ile DB tenantId uyusmazsa 401.
   - (Opsiyonel) x-tenant-id / x-tenant-slug header kontrolu.
   - Login'de tenantId/tenantSlug dogrulama destegi.

7. Bypass Mekanizmasi
   - Scope'lu bypass context mevcut.
   - Bypass kullanimi audit log'a yazilir.

## Kalan Riskler / Eksikler
1. Mevcut veri tutarliligi
   - Gecmisten kalan cross-tenant iliski varsa include'lar gorunebilir.
   - Bu durumda veri temizligi / migration ile duzeltme gerekir.

2. Role bazli bypass politikasinin kurum politikasina baglanmasi
   - Bypass izinleri env ile ayarlanir. Super-admin dogrulamasi ihtiyaca gore sertlestirilmeli.

3. Auth/Token gecis sureci
   - Eski token'larda tenantId eksik olabilir. Refresh sonrasinda otomatik duzelir.

## Kabul Kriterleri
- Her API yazma islemi (update/delete) tenantId ile scope edilmis olacak.
- Her API okuma islemi (findMany/findFirst) tenantId ile scope edilecek.
- Yeni yazilan kodlarda tenantId filtreleri unutulsa bile middleware devreye girecek.
- Yanlis tenantId ile create/update attempt -> hata.

## Riskler
- Middleware ile otomatik scoping, bazi internal admin/maintenance akislari icin gereksiz daralma yaratabilir. Bu tip akislarda izinli bypass mekanizmasi gerekebilir.
- findUnique/update/delete gibi tekil islemlerde tenantId otomatik eklenemez. Controller seviyesinde dikkat gerekir.

## Test Plani (Manuel)
1. Tenant A ile login -> Tenant B'nin kaydi gorunmuyor.
2. Tenant A kullanicisi, Tenant B'ye ait id ile update/delete -> 404.
3. Admin kullanici (tenant icinde) -> sadece kendi tenant verilerini goruyor.

## Devam Plani
1. Composite key / FK guclendirme (DB seviyesinde tenant consistency).
2. Row-level security (RLS) degerlendirmesi.
3. Audit log ile tenantId tutarlilik kontrol raporlari.

## Notlar
Bu PRD, tenant izolasyonu icin uygulama seviyesinde yapilan ve planlanan degisiklikleri kapsar. KVKK, MFA, encryption gibi basliklar ayri PRD'lerde ele alinacaktir.

## Son Tarama Durumu
- Tenant consistency taramasi: 2026-02-08T17:52:01.025Z
- Ihlal sayisi: 0

## Son Guncelleme Notu
- Bypass mekanizmasi sertlestirme (role-based izin, audit log, abuse detection) paketi hazirlandi.
- Otomatik test coverage icin E2E tenant izolasyon testleri ve CI pipeline taslagi eklendi.
- Gap ve risk raporlarina bu kapanis notlari islendi.
