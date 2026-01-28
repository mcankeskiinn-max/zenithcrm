---
name: plan-reviewer
description: Stratejik planları ve uygulama dökümanlarını (implementation_plan.md) mantıksal tutarlılık, güvenlik ve eksiksiz olma açısından denetler.
---

# Plan Reviewer (Plan Denetleyici)

Bu yetenek, projenin planlama aşamasında bir "denetçi" olarak çalışır.

## Temel Sorumluluklar
1. **`implementation_plan.md` Denetimi:** Yazılan planın, kullanıcı gereksinimleriyle tam örtüşüp örtüşmediğini kontrol eder.
2. **Kenar Durum (Edge Case) Analizi:** Planda unutulmuş olabilecek hata senaryolarını (bağlantı kopması, geçersiz veri girişi vb.) tespit eder.
3. **Güvenlik Kontrolü:** Önerilen değişikliklerin güvenlik açıklarına yol açıp açmadığını sorgular (örn. yetki kontrolü eksikliği).
4. **Bağımlılık Analizi:** Değişikliklerin sistemin diğer parçalarını (yan etkiler) bozup bozmayacağını değerlendirir.

## Kullanım Talimatları
- Her yeni plan oluşturulduğunda veya mevcut plan güncellendiğinde bu deneticiyi "çağırın".
- Planın `## Proposed Changes` bölümünü dosya bazlı olarak inceleyin.
- Eksik görülen kısımlar için plana `> [!CAUTION]` veya `> [!WARNING]` uyarıları ekleyin.
