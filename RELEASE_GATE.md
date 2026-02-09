# Release Gate

Bu dosya, `PRODUCTION_READINESS.md` ile birlikte uretime cikis icin zorunlu kosullari ozetler.

## Zorunlu Kosullar (Release Gate)
- [ ] PR Security Checklist (SECURITY_PR_CHECKLIST.md) tamamlandi
- [ ] Security audit (npm audit high+) sonucu gozden gecirildi
- [ ] CI: `server-tests` ve `client-tests` basarili (server-tests secrets yoksa skipped olabilir)
- [ ] UI akislari (Playwright) basarili (secrets yoksa skipped olabilir)
  UI flow artifacts CI'da kaydedilir (summary + screenshots).
- [ ] Manuel kritik akis kontrolu (giris, satis, musteri, komisyon) tamamlandi
- [ ] Veritabani migration plani hazir
- [ ] Rollback plani hazir
- [ ] Saglik/observability kontrolleri (log, alarm) hazir
- [ ] Guvenlik kontrol listesi (SECURITY_HARDENING_CHECKLIST.md) gozden gecirildi
- [ ] Threat model one-pager (THREAT_MODEL_ONE_PAGER.md) gozden gecirildi
- [ ] SECURITY_REVIEW_TEMPLATE.md dolduruldu ve onaylandi

## Notlar
- Release gate gecilmeden uretime cikis yapilmamalidir.
- CI'de `release-gate` job'i test basarisizliginda build'i durdurur; `server-tests` secrets yoksa uyari verir.
