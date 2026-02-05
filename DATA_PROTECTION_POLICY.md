# VERİ KORUMA POLİTİKASI 🛡️

## Temel İlke

> **ASLA VERİ SİLME:** Sistem güncellemeleri, migration'lar veya kod değişiklikleri **hiçbir koşulda** mevcut verileri silmemeli veya erişilemez hale getirmemelidir.

---

## 1. Prisma Migration Güvenlik Kuralları

### ❌ YASAK İŞLEMLER

```prisma
// ❌ ASLA YAPILMAMALI
model Sale {
  // customerId alanını silmek
  // customerId String  // SILINMIŞ - VERİ KAYBI!
}

// ❌ CASCADE DELETE
model Customer {
  id    String @id
  sales Sale[] @relation(onDelete: Cascade) // TEHLIKELI!
}

// ❌ ZORUNLU ALAN EKLEME (mevcut veriler null olabilir)
model Sale {
  newField String // Eski kayıtlar için null olacak, hata verir!
}
```

### ✅ GÜVENLİ İŞLEMLER

```prisma
// ✅ Yeni alan ekleme (opsiyonel)
model Sale {
  newField String? // Nullable, eski veriler etkilenmez
}

// ✅ Yeni alan ekleme (default değerle)
model Sale {
  status String @default("ACTIVE") // Eski kayıtlar ACTIVE olur
}

// ✅ Soft Delete (veri silinmez, işaretlenir)
model Customer {
  id        String   @id
  deletedAt DateTime? // null = aktif, dolu = silinmiş
}

// ✅ Güvenli ilişki
model Customer {
  id    String @id
  sales Sale[] @relation(onDelete: Restrict) // Silme engellenir
}
```

---

## 2. Migration Öncesi Kontrol Listesi

### Adım 1: Yedekleme (ZORUNLU)

```bash
# Veritabanı yedeği al
# Supabase Dashboard → Database → Backups → Create Backup

# Veya SQL dump
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Adım 2: Migration Önizleme

```bash
# Migration'ı önce development'ta test et
npx prisma migrate dev --name test_migration --create-only

# Oluşturulan SQL dosyasını incele
# server/prisma/migrations/XXXXXXX_test_migration/migration.sql
```

**Kontrol Et:**
- ❌ `DROP TABLE` var mı?
- ❌ `DROP COLUMN` var mı?
- ❌ `DELETE FROM` var mı?
- ❌ `TRUNCATE` var mı?
- ✅ Sadece `ALTER TABLE ADD COLUMN` var mı?
- ✅ `CREATE TABLE` var mı?

### Adım 3: Test Veritabanında Dene

```bash
# Test DB'de migration'ı uygula
DATABASE_URL="postgresql://test_db_url" npx prisma migrate deploy

# Veri kaybı kontrolü
psql $TEST_DATABASE_URL -c "SELECT COUNT(*) FROM sales;"
psql $TEST_DATABASE_URL -c "SELECT COUNT(*) FROM customers;"
```

### Adım 4: Production'a Uygula

```bash
# Sadece test başarılıysa
npx prisma migrate deploy
```

---

## 3. Kod Değişikliklerinde Veri Güvenliği

### Controller Değişiklikleri

```typescript
// ❌ YANLIŞ: Tüm verileri silen kod
export const cleanupOldSales = async (req: Request, res: Response) => {
    await prisma.sale.deleteMany({}); // TEHLIKELI!
    res.json({ message: 'Deleted' });
};

// ✅ DOĞRU: Soft delete veya tarih filtresi
export const archiveOldSales = async (req: Request, res: Response) => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    await prisma.sale.updateMany({
        where: {
            createdAt: { lt: sixMonthsAgo },
            status: 'CANCELLED'
        },
        data: {
            archivedAt: new Date() // Soft delete
        }
    });
    
    res.json({ message: 'Archived old cancelled sales' });
};
```

### Filtreleme Değişiklikleri

```typescript
// ❌ YANLIŞ: Çok katı filtre (veriler görünmez olur)
const sales = await prisma.sale.findMany({
    where: {
        status: 'ACTIVE',
        saleDate: { gte: startDate } // saleDate null olanlar kaybolur!
    }
});

// ✅ DOĞRU: Esnek filtre (tüm veriler erişilebilir)
const sales = await prisma.sale.findMany({
    where: {
        status: 'ACTIVE',
        OR: [
            { saleDate: { gte: startDate } },
            { saleDate: null, createdAt: { gte: startDate } }
        ]
    }
});
```

---

## 4. Otomatik Güvenlik Kontrolleri

### Pre-Migration Hook (Önerilen)

**Dosya:** `server/scripts/pre-migration-check.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function preMigrationCheck() {
    console.log('🔍 Pre-migration safety check...');
    
    // Tablo sayılarını kaydet
    const counts = {
        sales: await prisma.sale.count(),
        customers: await prisma.customer.count(),
        users: await prisma.user.count(),
        branches: await prisma.branch.count(),
        policyTypes: await prisma.policyType.count()
    };
    
    console.log('📊 Current data counts:', counts);
    
    // Dosyaya kaydet
    const fs = require('fs');
    fs.writeFileSync(
        'pre-migration-snapshot.json',
        JSON.stringify({ timestamp: new Date(), counts }, null, 2)
    );
    
    console.log('✅ Snapshot saved to pre-migration-snapshot.json');
}

preMigrationCheck()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
```

**Kullanım:**
```bash
# Migration öncesi
npm run pre-migration-check

# Migration sonrası
npm run post-migration-check
```

### Post-Migration Validation

**Dosya:** `server/scripts/post-migration-check.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function postMigrationCheck() {
    console.log('🔍 Post-migration validation...');
    
    // Önceki snapshot'ı oku
    const snapshot = JSON.parse(
        fs.readFileSync('pre-migration-snapshot.json', 'utf-8')
    );
    
    // Yeni sayıları al
    const newCounts = {
        sales: await prisma.sale.count(),
        customers: await prisma.customer.count(),
        users: await prisma.user.count(),
        branches: await prisma.branch.count(),
        policyTypes: await prisma.policyType.count()
    };
    
    console.log('📊 Post-migration counts:', newCounts);
    
    // Karşılaştır
    let dataLoss = false;
    for (const [table, oldCount] of Object.entries(snapshot.counts)) {
        const newCount = newCounts[table as keyof typeof newCounts];
        if (newCount < oldCount) {
            console.error(`❌ DATA LOSS DETECTED in ${table}!`);
            console.error(`   Before: ${oldCount}, After: ${newCount}`);
            dataLoss = true;
        } else if (newCount === oldCount) {
            console.log(`✅ ${table}: No change (${newCount})`);
        } else {
            console.log(`✅ ${table}: Increased (${oldCount} → ${newCount})`);
        }
    }
    
    if (dataLoss) {
        console.error('🚨 ROLLBACK REQUIRED!');
        process.exit(1);
    } else {
        console.log('✅ Migration successful, no data loss');
    }
}

postMigrationCheck()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
```

---

## 5. Rollback Stratejisi

### Hızlı Rollback

```bash
# 1. Son migration'ı geri al
npx prisma migrate resolve --rolled-back MIGRATION_NAME

# 2. Önceki migration'a dön
npx prisma migrate deploy

# 3. Yedeği geri yükle (eğer veri kaybı olduysa)
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

### Supabase Rollback

1. Supabase Dashboard → Database → Backups
2. Son yedek noktasını seç
3. "Restore" butonuna tıkla
4. Onay ver

---

## 6. Güvenli Güncelleme Prosedürü

### Checklist (Her Güncelleme İçin)

- [ ] **Yedek alındı mı?** (Supabase veya pg_dump)
- [ ] **Migration SQL incelendi mi?** (DROP/DELETE yok mu?)
- [ ] **Test DB'de denendi mi?** (Veri kaybı yok mu?)
- [ ] **Pre-migration snapshot alındı mı?**
- [ ] **Migration uygulandı mı?**
- [ ] **Post-migration check yapıldı mı?**
- [ ] **Uygulama test edildi mi?** (Veriler görünüyor mu?)
- [ ] **Rollback planı hazır mı?**

### Örnek Güvenli Güncelleme

```bash
# 1. Yedek
npm run backup

# 2. Pre-check
npm run pre-migration-check

# 3. Migration önizleme
npx prisma migrate dev --create-only --name add_new_field

# 4. SQL inceleme
cat prisma/migrations/*/migration.sql

# 5. Test DB'de dene
DATABASE_URL=$TEST_DB npx prisma migrate deploy

# 6. Production'a uygula
npx prisma migrate deploy

# 7. Post-check
npm run post-migration-check

# 8. Uygulama testi
curl http://localhost:3000/api/sales
```

---

## 7. Acil Durum Protokolü

### Veri Kaybı Tespit Edilirse

1. **HEMEN DURDUR**
   ```bash
   # Sunucuyu kapat
   pm2 stop all  # veya Ctrl+C
   ```

2. **Rollback Yap**
   ```bash
   # Migration geri al
   npx prisma migrate resolve --rolled-back LAST_MIGRATION
   
   # Veya yedekten geri yükle
   psql $DATABASE_URL < backup_latest.sql
   ```

3. **Doğrula**
   ```bash
   # Veri sayılarını kontrol et
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM sales;"
   ```

4. **Rapor Et**
   - Ne oldu?
   - Hangi migration?
   - Kaç kayıt etkilendi?
   - Rollback başarılı mı?

---

## 8. Geliştirici Kuralları

### Kod Review Kriterleri

**Merge edilmeden önce kontrol et:**

- [ ] Prisma schema değişikliği var mı?
  - [ ] DROP/DELETE yok mu?
  - [ ] Yeni alanlar nullable veya default'lu mu?
  - [ ] Cascade delete yok mu?

- [ ] Controller değişikliği var mı?
  - [ ] `deleteMany({})` kullanılmıyor mu?
  - [ ] Filtreler çok katı değil mi?
  - [ ] Soft delete kullanılıyor mu?

- [ ] Migration test edildi mi?
  - [ ] Test DB'de çalıştırıldı mı?
  - [ ] Veri kaybı kontrolü yapıldı mı?

### Git Commit Mesajları

```bash
# ✅ İYİ
git commit -m "feat: Add optional archivedAt field to Sale model (safe migration)"

# ❌ KÖTÜ
git commit -m "fix: cleanup old data"  # Belirsiz, tehlikeli olabilir
```

---

## 9. Monitoring ve Alerting

### Günlük Veri Kontrolü

```bash
# Cron job (her gün 02:00)
0 2 * * * /path/to/daily-data-check.sh
```

**Script:** `daily-data-check.sh`
```bash
#!/bin/bash
COUNTS=$(psql $DATABASE_URL -t -c "
  SELECT 
    (SELECT COUNT(*) FROM sales) as sales,
    (SELECT COUNT(*) FROM customers) as customers,
    (SELECT COUNT(*) FROM users) as users
")

echo "$(date): $COUNTS" >> data-counts.log

# Eğer sayı düşerse alert
# (Slack, email, vb.)
```

---

## 10. Eğitim ve Dokümantasyon

### Yeni Geliştiriciler İçin

1. **Oku:** Bu dosyayı tamamen oku
2. **Test Et:** Test DB'de migration dene
3. **Gözlemle:** Deneyimli geliştiricinin migration'ını izle
4. **Uygula:** İlk migration'ını mentor eşliğinde yap

### Referans Dökümanlar

- [Prisma Migration Best Practices](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)
- [PostgreSQL Backup & Restore](https://www.postgresql.org/docs/current/backup.html)
- [Supabase Backup Guide](https://supabase.com/docs/guides/platform/backups)

---

## Özet

### Altın Kurallar

1. **Asla veri silme** - Soft delete kullan
2. **Her zaman yedekle** - Migration öncesi zorunlu
3. **Test et, sonra uygula** - Test DB → Production
4. **Kontrol et** - Pre/post migration checks
5. **Rollback planı** - Her zaman hazır olsun

### Acil Durum İletişim

**Veri kaybı tespit edilirse:**
1. Sunucuyu durdur
2. Rollback yap
3. Ekip liderini bilgilendir
4. Incident raporu yaz

> [!CAUTION]
> Bu politikaya uyulmaması **kritik veri kaybına** yol açabilir. Şüphe durumunda **SORMAKTAN ÇEKİNME**.
