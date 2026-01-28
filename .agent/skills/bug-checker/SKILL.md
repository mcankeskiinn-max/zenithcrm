---
name: bug-checker
description: Yazılan kodu teknik borç, mantık hataları, güvenlik zafiyetleri ve performans darboğazları açısından denetler.
---

# Code & Bug Checker (Kod ve Hata Denetleyici)

Bu yetenek, projenin yürütme (execution) aşamasında bir "kod gözden geçirici" (code reviewer) olarak çalışır.

## Temel Sorumluluklar
1. **Statik Analiz:** TypeScript/JavaScript kod standartlarına uyumu kontrol eder.
2. **Hata Tespiti:** Bellek sızıntıları, sonsuz döngüler veya asenkron işlem hatalarını (race conditions) arar.
3. **Güvenlik Taraması:** Hassas verilerin (API anahtarları, şifreler) loglara basılmasını veya yetkisiz veri erişim risklerini denetler.
4. **Temizlik:** `console.log`, `TODO` yorumları veya kullanılmayan değişkenleri (dead code) tespit eder.

## Kullanım Talimatları
- Her kod değişikliği (`write_to_file` veya `replace_file_content`) sonrasında bu deneticiyi çalıştırın.
- Özellikle `server/src/controllers` ve `client/src/pages` dosyalarını odak noktası yapın.
- Tespit edilen sorunları kullanıcıya bildirin ve düzeltme önerileri sunun.
