---
description: Proje kaldığı yerden devam ettirmek için kullanılan ana orkestrasyon akışı.
---

Bu akış, kullanıcı "başlat" veya "nerede kalmıştık?" dediğinde otomatik olarak tetiklenir.

1. **Durum Analizi:**
   - [project_state.json](file:///C:/Users/mcank/.gemini/antigravity/brain/4dcf13e3-7f08-46d0-ad10-f8b9f2ab2b6e/project_state.json) dosyasını oku.
   - Son tamamlanan görevi ve aktif fazı belirle.

2. **Raporlama:**
   - Kullanıcıya mevcut durumu ve bir sonraki planlanan adımı `notify_user` ile bildir.

3. **Planlama Geçişi:**
   - [plan-reviewer](file:///C:/Users/mcank/.gemini/antigravity/scratch/sigorta-crm/.agent/skills/plan-reviewer/SKILL.md) yeteneğini devreye al.
   - [task.md](file:///C:/Users/mcank/.gemini/antigravity/brain/4dcf13e3-7f08-46d0-ad10-f8b9f2ab2b6e/task.md) içindeki bir sonraki boş görevi incele ve yeni bir `implementation_plan.md` taslağı oluştur.

4. **GitHub Senkronizasyonu:**
   - Uzak depodaki son durumu kontrol et ve yerel değişiklikleri doğrula.
