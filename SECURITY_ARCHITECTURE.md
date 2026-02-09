# Security Architecture (ZenithCRM)

Bu dokuman, ZenithCRM'in katmanli guvenlik yaklasimini ve ana savunma duvarlarini ozetler.

## 1) Kimlik Dogrulama ve Yetkilendirme Duvari
- JWT dogrulamasi ile kullanici/tenant baglami kuruluyor.
- Role tabanli yetkilendirme (ADMIN/MANAGER/EMPLOYEE) kritik endpoint'lerde zorunlu.
- Amaç: Kim girer ve neye erisir sorusunu kapatmak.

## 2) Tenant/Branch Izolasyon Duvari
- Her sorguda `tenantId` (ve gerekiyorsa `branchId`) filtreleri zorunlu.
- Prisma middleware tenant izolasyonunu sistemsel hale getiriyor.
- Amaç: Cross-tenant veri sizintisini engellemek.

## 3) CSRF ve Cookie Guvenligi Duvari
- Cookie tabanli auth'ta CSRF token dogrulamasi yapiliyor.
- Cookie flag'leri: `Secure`, `SameSite`, `httpOnly`.
- Amaç: Tarayici kaynakli sahte istekleri engellemek.

## 4) CORS Duvari
- API yalnizca izin verilen origin'lerden cagrilara acik.
- Amaç: Yetkisiz cross-origin erisimi kesmek.

## 5) Rate Limit / Abuse Duvari
- `/api/*` ve `/api/auth/login` gibi kritik endpoint'lerde limit var.
- Amaç: Brute force ve abuse girisimlerini yavaslatmak.

## 6) Guvenli Basliklar ve CSP Duvari
- `helmet` ve CSP aktif.
- Amac: XSS ve icerik enjeksiyonu risklerini azaltmak.

## 7) Dosya Yukleme Duvari
- MIME ve boyut limitleri uygulanir.
- Amaç: Zararlı veya büyük dosya yuklemelerini engellemek.

## 8) Gozlem ve Alarm Duvari
- Sentry error monitoring aktif.
- Email alert: new issue + issue spike.
- Amaç: Kritik hatalara hizli teshis.

## 9) Operasyonel Kapi (Release Gate)
- Guvenlik checklist, CI kontrolleri ve threat model review zorunlu.
- Amaç: Uretime cikista guvenlik disiplini saglamak.
