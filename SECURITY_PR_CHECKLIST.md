# PR Security Checklist (ZenithCRM)

Bu checklist her PR oncesi gozden gecirilir ve gerekli maddeler isaretlenir.

## Kimlik & Yetkilendirme
- [ ] Auth middleware tum korumali route'larda aktif.
- [ ] Role kontrolu gerekli endpoint'lerde (ADMIN/MANAGER/EMPLOYEE) var.
- [ ] Tenant filtreleri tum list/detail sorgularinda var (tenantId).
- [ ] Branch filtreleri gerekli endpoint'lerde var.

## Veri Dogrulama
- [ ] Zorunlu alanlar sunucu tarafinda validate ediliyor.
- [ ] Inputlar trim/normalize ediliyor (email, slug vb).
- [ ] Rate limit kritik endpoint'lerde aktif.

## Web Guvenligi
- [ ] CORS sadece izinli origin'lere acik.
- [ ] CSRF korumasi aktif (cookie auth icin).
- [ ] Cookie flag'leri dogru (Secure + SameSite + httpOnly).
- [ ] Helmet/CSP aktif ve genis `unsafe-*` yok.

## Dosya & I/O
- [ ] Dosya upload icin MIME/size limit var.
- [ ] Dosya indirme yetki kontrolu var.

## Gozlem & Log
- [ ] Loglarda PII/token/password yok.
- [ ] Sentry/Platform error monitoring aktif ve test edildi.
- [ ] Kritik aksiyonlar icin audit log yaziliyor.

## Operasyon
- [ ] Migration/rollback plan notu eklendi (gerekliyse).
- [ ] Security review notu / linki eklendi (gerekliyse).
