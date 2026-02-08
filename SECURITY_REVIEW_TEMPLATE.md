# Security Review Template

Release: 2026-02-08 / v2.7-fixes
Reviewer: mcank (sahip incelemesi)
Date: 2026-02-08

## Scope
- Backend endpointleri: approvals, cancellations, dashboard stats, notifications unread-count, maintenance test endpoint
- Frontend sayfa/bilesenler: cancellations, approvals, sales flow, dashboard, notifications
- Veri modeli degisiklikleri: policy number tenant bazli unique; performans indexleri

## Checklist (Must Pass)
- [x] Auth: gerekli endpointler kimlik dogrulama istiyor
- [x] AuthZ: rol/tenant/sube kontrolleri sunucu tarafinda (user list endpointi rol bazli sinirlandi)
- [ ] Validation: zorunlu alanlar sunucu tarafinda dogrulaniyor (kismen var, kapsamli degil)
- [x] CSRF: state-changing isteklerde token zorunlu
- [x] CORS: allowlist, wildcard yok + credentials ile güvenli
- [x] File upload: allowlist, boyut limitleri, guvenli saklama
- [ ] Logs: loglarda gizli veri/PII yok (spot-check yapildi, PII log var)
- [x] Rate limit: auth + agir endpointlerde aktif
- [x] Migrations: incelendi ve uygulandi

## Findings
Bekleyen/tespit edilenler:
- AuthZ: birkac kritik endpointte (customer/sale/approval) tenant filtreleri var; ancak `user` listesi tum authenticated kullanicilara acik (yetki politikasini netlestirmek lazim).
- Validation: controller bazinda kismi kontroller var; ortak schema validation yok.
- Logs: auth akislari ve email servisi loglari e-posta gibi PII yaziyor.

Notlar:
- Auth controller loglari e-posta gibi PII icerebilir; prod log politikasinda maskeleme dusunulmeli.

## Sign-off
- [ ] Approved for release
