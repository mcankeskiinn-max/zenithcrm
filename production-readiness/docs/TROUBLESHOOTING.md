# Tenant Isolation Troubleshooting Guide

## TL;DR
- 404 goruyorsan tenant mismatch olabilir.
- JWT ve header tenantId uyusmuyor olabilir.
- Bypass izinleri eksik olabilir.

## Problem 1: Record not found ama kayit var
**Cozum:** tenantId kontrol et, token yenile.

## Problem 2: Foreign key hatasi
**Cozum:** iliskili kaydin tenantId'si ayni mi kontrol et.

## Problem 3: Bypass calismiyor
**Cozum:** rol + BYPASS config kontrol et.
