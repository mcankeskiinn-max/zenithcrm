# ROLLBACK_PLAN

## TL;DR
- Kritik izolasyon sorunu varsa flag ile kapat, eski versiyona don.
- Bypass problemi varsa strict mode kapat.
- Performans sorunu varsa cache/pool ayarlarini gecici arttir.

## Senaryo 1: Middleware Sorunu (Tenant Filtering Calismiyor)
**Belirtiler:** Kullanici baska tenant verisini goruyor

**Hizli Cozum:**
1. Middleware kapat
```bash
kubectl set env deployment/api TENANT_MIDDLEWARE_ENABLED=false
```
2. Rollback
```bash
kubectl rollout undo deployment/api
```
3. Hotfix ac

**ETA:** < 5 dakika

## Senaryo 2: Bypass Mekanizmasi Sistemleri Blokluyor
**Belirtiler:** SUPER_ADMIN bile cross-tenant islem yapamiyor

**Hizli Cozum:**
1. Strict mode kapat
```bash
kubectl set env deployment/api BYPASS_STRICT_MODE=false
```
2. Audit log kontrol et

**ETA:** < 2 dakika

## Senaryo 3: Performans Dususu
**Belirtiler:** Response time %50+ artis

**Hizli Cozum:**
1. Cache ac
```bash
kubectl set env deployment/api TENANT_CACHE_ENABLED=true
```
2. DB pool artir

**ETA:** < 10 dakika
