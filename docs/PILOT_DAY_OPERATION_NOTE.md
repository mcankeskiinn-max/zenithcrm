# Pilot Gunu Operasyon Notu

## Amaç
Pilot kullanicinin ilk gununu sorunsuz ve kontrollu sekilde yonetmek.

## Sorumlular
- Urun Sahibi: `<isim>`
- Teknik Sorumlu: `<isim>`
- Destek Sorumlusu: `<isim>`

## T-1 Gun Kontrolu
- [ ] Pilot tenant olusturuldu
- [ ] Pilot admin kullanici olusturuldu
- [ ] Login bilgileri test edildi
- [ ] Sentry alarmlari acik
- [ ] Railway/Vercel canli sistem saglikli

## Pilot Gunu Saatlik Akis
1. 09:00 - Son sistem kontrolu (`healthcheck`, `login`, `dashboard`)
2. 09:30 - Pilot kullaniciya giris bilgileri gonderimi
3. 10:00 - Ilk canli baglanti (15-20 dk onboarding)
4. 11:00 - Ilk kullanim kontrolu (login, satis, musteri kaydi)
5. 14:00 - Ara durum kontrolu (hata, performans, geri bildirim)
6. 17:00 - Gun sonu ozet ve aksiyon listesi

## Hizli Dogrulama Senaryosu
- [ ] Kullanici login olabiliyor
- [ ] Musteri kaydi olusturulabiliyor
- [ ] Satis kaydi olusturulabiliyor
- [ ] Dashboard verisi yukleniyor
- [ ] Logout calisiyor

## Olay Yonetimi (Incident)
- Seviye 1: Kucuk hata, kullanima engel degil -> 30 dk icinde cozum
- Seviye 2: Kritik fonksiyon bozuk -> 15 dk icinde gecici cozum
- Seviye 3: Sistem erisimi yok -> rollback veya hotfix

## Rollback Karari
Asagidaki durumlardan biri olursa rollback degerlendirilir:
- 15 dakikadan uzun servis kesintisi
- Login veya satis akisinin calismamasi
- Veri gorunurlugu/izolasyonunda supheli durum

## Iletisim Mesaji (Hazir Sablon)
Merhaba `<ad>`, pilot kullaniminiz aktif. Herhangi bir sorun oldugunda bu kanaldan aninda ulasabilirsiniz: `<kanal>`. Ilk gun boyunca teknik ekip aktif takipte olacak.

## Gun Sonu Raporu
- Toplam sorun sayisi:
- Kritik sorun:
- Cozulen sorun:
- Ertesi gun aksiyonlari:

