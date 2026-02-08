# Tenant Izolasyonu Guvenlik PRD

## Ozet
Bu dokuman, ZenithCRM icin tenant izolasyonu (multi-tenant veri guvenligi) gelistirmelerinin hedefini, kapsamini, yapilanlari ve kalan riskleri tanimlar. Amac: bir tenantin baska tenant verilerine erisimini uygulama seviyesinde imkansiz hale getirmek ve yanlislikla veri sizintisini onlemek.

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
   - findMany/findFirst/count/aggregate/groupBy/updateMany/deleteMany:
     otomatik `tenantId` filtresi ekleniyor.
   - create/createMany:
     tenantId yoksa ekleniyor, farkli ise hata.

3. Yazma Islemlerinde TenantId Zorunlulugu
   - branch, customer, policyType, user, task, sale, document,
     commissionRule, salesTarget update/delete islemlerinde
     `tenantId` scoping uygulandi.

4. Servis Katmani Sertlestirme
   - NotificationService ve SupportService artık ortak prisma kullaniyor.
   - Message endpoints tenantId ile filtrelendi.
   - SupportMessage artik tenantId ile kayit altinda ve filtreleniyor.
   - Notification cron job'lari tenantId bazli calisiyor.

## Kalan Riskler / Eksikler
1. Auth/Token bazli findUnique kullanimi
   - Login/refresh akislari tenantId kullanmiyor (email global unique).
   - Bu akislarda risk dusuk ama yine de tenant match kontrolu opsiyonel.

2. Cron/Job sorgulari tenant bazli calisiyor (tamamlandi)
   - Tüm job sorgulari aktif tenant listesi ile tenantId scoping yapar.

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
1. SupportMessage modeline tenantId ekleme (migrasyon).
2. Row-level security (RLS) degerlendirmesi.
3. Audit log ile tenantId tutarlilik kontrol raporlari.

## Notlar
Bu PRD, tenant izolasyonu icin uygulama seviyesinde yapilan ve planlanan degisiklikleri kapsar. KVKK, MFA, encryption gibi basliklar ayri PRD'lerde ele alinacaktir.
