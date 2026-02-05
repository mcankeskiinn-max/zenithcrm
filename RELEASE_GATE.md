# Release Gate

Bu dosya, `PRODUCTION_READINESS.md` ile birlikte uretime cikis icin zorunlu kosullari ozetler.

## Zorunlu Kosullar (Release Gate)
- [ ] CI: `server-tests` ve `client-tests` basarili (server-tests secrets yoksa skipped olabilir)
- [ ] UI akislari (Playwright) basarili (secrets yoksa skipped olabilir)
- [ ] Manuel kritik akis kontrolu (giris, satis, musteri, komisyon) tamamlandi
- [ ] Veritabani migration plani hazir
- [ ] Rollback plani hazir
- [ ] Saglik/observability kontrolleri (log, alarm) hazir
- [ ] Guvenlik kontrol listesi (SECURITY_HARDENING_CHECKLIST.md) gozden gecirildi

## Notlar
- Release gate gecilmeden uretime cikis yapilmamalidir.
- CI'de `release-gate` job'i test basarisizliginda build'i durdurur; `server-tests` secrets yoksa uyari verir.
