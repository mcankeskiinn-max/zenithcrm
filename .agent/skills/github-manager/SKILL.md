---
name: github-manager
description: Kod değişikliklerini otomatik commitlemek ve proje durumunu (state) güncellemek için kullanılır.
---

# GitHub Manager (GitHub Yöneticisi)

Bu yetenek, projenin "yürütme sonrası" (post-execution) aşamasında çalışır ve değişikliklerin kalıcılığını sağlar.

## Temel Sorumluluklar
1. **Otomatik Commit:** `bug-checker` ajanı kodun teknik olarak doğru olduğunu onayladığında, değişiklikleri GitHub'a aktarır.
2. **Commit Mesajları:** Yapılan değişiklikleri özetleyen (Örn: "feat: implemented audit logging", "fix: resolved sidebar navigation issue") anlamlı mesajlar üretir.
3. **Durum Güncelleme:** Her başarılı committen sonra `brain/<conversation-id>/project_state.json` dosyasını güncelleyerek projenin o anki aşamasını kaydeder.

## Kullanım Talimatları
- Bir kod bloğu hem kullanıcı hem de `bug-checker` tarafından onaylandığında devreye girer.
- `github-mcp-server` araçlarını (özellikle `push_files`) kullanır.
- İşlem tamamlandığında `project_state.json` dosyasını şu formatta günceller:
```json
{
  "current_phase": 12,
  "last_completed_task": "Audit Logging",
  "next_step_summary": "Implementing session management and final optimizations",
  "timestamp": "2026-01-28T..."
}
```
