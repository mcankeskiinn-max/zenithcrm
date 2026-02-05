# Test Veri Temizligi Plani

Bu plan, UI akisi testlerinin olusturdugu veri birikimini kontrol altinda tutmak icindir.

## Hedef
- Test calismalari gercek veriyi kirletmesin.
- Uretim ortaminda test verisi birikmesin.

## Kural Seti (Onerilen)
- Test kayitlari **etiketli** olmali (ornek: adlarda `Test` prefiksi, policede `POL-TEST`).
- Testler **musteri/satis/komisyon** olusturuyorsa, bu kayitlar kolay filtrelenebilir olmali.
- Gunluk veya haftalik otomatik temizlik isleri uygulanmali.

## Temizlik Yaklasimi
1. **Soft kural**: Test kayitlari, isim/police alanina gore listelenip manuel silinir.
2. **Otomatik kural**: Cron job ile `Test` prefiksli kayitlar periyodik silinir.
3. **Ortam ayrimi**: Mümkünse staging ortaminda test, production sadece zorunlu smoke test.

## Admin Endpoint (Onerilen)
- Endpoint: `POST /api/maintenance/cleanup-test-data`
- Yalnizca ADMIN kullanabilir.
- Varsayilan olarak **dry-run** calisir.
- Gercek silme icin body icinde `confirm: "DELETE_TEST_DATA"` gonderilmelidir.

## Ornek Filtre
- Musteri adi `Test` ile baslayanlar
- Police no `POL-TEST` ile baslayanlar

## Notlar
- Bu plan CI testleri icin yeterli bir guvenlik katmani saglar.
- Uretimde otomatik temizlik uygulanacaksa once yedek alinmalidir.
