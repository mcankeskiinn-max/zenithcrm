# Yaşanan Sorunlar ve Çözümleri 🔧

Bu dosya, ZenithCRM projesinde yaşanan teknik sorunları ve kalıcı çözümlerini dokümante eder.

---

## 1. Veri Görünmezlik Sorunu (Kritik)

### Semptomlar
- Frontend'de satışlar, şubeler, branşlar görünmüyor
- Tüm dashboard metrikleri 0 gösteriyor
- Kullanıcı logout/login yapınca düzeliyor

### Kök Neden
JWT token'larında `tenantId` alanı eksik olduğunda, auth middleware kullanıcının `tenantId`'sini `undefined` olarak set ediyordu. Bu da tüm veritabanı sorgularının boş sonuç döndürmesine neden oluyordu.

### Uygulanan Çözüm
**Dosya:** `server/src/middleware/auth.middleware.ts`

```typescript
// Fallback mekanizması eklendi
req.user = {
    id: user.id,
    email: user.email,
    role: user.role as Role,
    branchId: user.branchId || undefined,
    tenantId: decoded.tenantId || user.tenantId  // ✅ DB'den fallback
};
```

**Ek İyileştirmeler:**
- Frontend error handling (API hatalarını gösterme)
- Axios interceptor (otomatik logout geçersiz tokenlarda)
- Token validation endpoint (`/api/auth/validate`)

**Detaylar:** `implementation_plan_permanent_visibility_fix.md`

---

## 2. Bordro ve Finans Sayfası Veri Eksikliği

### Semptomlar
- Bordro sayfasında satışlar görünmüyor
- PDF indirme başarısız
- Finansal grafikler boş

### Kök Neden
1. **Hardcoded API URL:** `PayrollPage.tsx` içinde `localhost:5000` kullanılıyordu (backend 3000'de çalışıyor)
2. **Katı Tarih Filtresi:** `saleDate` null olan satışlar filtrelerde göz ardı ediliyordu

### Uygulanan Çözüm

**Frontend:**
```typescript
// Önceki (hatalı)
const API_URL = 'http://localhost:5000/api';

// Yeni (doğru)
const API_URL = '/api';  // Vite proxy kullan
```

**Backend:**
```typescript
// Esnek tarih filtresi
const where: Prisma.SaleWhereInput = {
    OR: [
        { saleDate: { gte: startDate, lte: endDate } },
        { saleDate: null, createdAt: { gte: startDate, lte: endDate } }
    ],
    status: 'ACTIVE',
    tenantId: currentUser.tenantId
};
```

**Vite Proxy:**
```typescript
// vite.config.ts
proxy: {
    '/api': { target: 'http://localhost:3000', changeOrigin: true },
    '/uploads': { target: 'http://localhost:3000', changeOrigin: true }
}
```

**Detaylar:** `walkthrough_payroll_visibility_fix.md`

---

## 3. Satış Görünürlüğü ve PDF İndirme

### Semptomlar
- Yeni oluşturulan satışlar listede görünmüyor
- PDF indirme "No sales found" hatası veriyor

### Kök Neden
1. **Status Filtresi:** Frontend varsayılan olarak `status: 'ACTIVE'` filtresi uyguluyor, yeni satışlar `OFFER` statüsünde
2. **OCR Branch Assignment:** OCR ile oluşturulan satışlarda `branchId` eksik kalıyordu

### Uygulanan Çözüm

**Frontend:**
```typescript
// Status seçimi modal'a eklendi
<select value={formStatus} onChange={(e) => setFormStatus(e.target.value)}>
    <option value="OFFER">Teklif</option>
    <option value="ACTIVE">Aktif</option>
    <option value="CANCELLED">İptal</option>
</select>
```

**Backend (OCR):**
```typescript
// Otomatik branch assignment
const branchId = user.branchId || (await getDefaultBranch(user.tenantId));
```

**Detaylar:** `walkthrough_sales_visibility_fix.md`

---

## 4. Analytics Sayfası Crash

### Semptomlar
- Analytics sayfası beyaz ekran gösteriyor
- Console'da "Cannot read property 'firstName' of null" hatası

### Kök Neden
Customer verileri silinmiş ama sale kayıtları hala mevcut. Frontend `sale.customer.firstName` erişmeye çalışınca crash oluyor.

### Uygulanan Çözüm

**Backend:**
```typescript
// Güvenli customer mapping
const mappedSales = sales.map(sale => ({
    ...sale,
    customer: sale.customer ? {
        ...sale.customer,
        name: `${sale.customer.firstName} ${sale.customer.lastName}`.trim()
    } : { name: 'Bilinmeyen Müşteri' }  // ✅ Fallback
}));
```

**Frontend:**
```typescript
// Null check
{sale.customer?.name || 'Bilinmeyen Müşteri'}
```

**Detaylar:** `walkthrough_profile_analytics_fix.md`

---

## 5. Dashboard Stats Crash

### Semptomlar
- Dashboard yüklenirken crash
- "Cannot read property 'name' of undefined" hatası

### Kök Neden
Dashboard controller'da `customer.firstName` yerine `customer.name` kullanılıyordu (bu alan yok).

### Uygulanan Çözüm

**Backend:**
```typescript
// Doğru alan kullanımı
topCustomers: topCustomers.map(c => ({
    name: `${c.customer.firstName} ${c.customer.lastName}`.trim(),  // ✅
    totalSpent: c._sum.amount || 0
}))
```

**Detaylar:** `walkthrough_stability_fixes.md`

---

## 6. Customer Profile Page White Screen

### Semptomlar
- Müşteri profil sayfası açılmıyor
- Beyaz ekran

### Kök Neden
`CustomerProfilePage.tsx` içinde `customer.name` kullanılıyordu ama backend `firstName` ve `lastName` dönüyordu.

### Uygulanan Çözüm

**Frontend:**
```typescript
// Composite name oluşturma
const customerName = customer 
    ? `${customer.firstName} ${customer.lastName}`.trim()
    : 'Yükleniyor...';
```

**Detaylar:** `implementation_plan_profile_analytics_fix.md`

---

## 7. User Deletion Constraint Error

### Semptomlar
- Kullanıcı silinemiyor
- "Foreign key constraint violation" hatası

### Kök Neden
Prisma schema'da `AuditLog` ve `Sale` modelleri `userId` ile ilişkili ama `onDelete` davranışı tanımlı değildi.

### Uygulanan Çözüm

**Prisma Schema:**
```prisma
model AuditLog {
  userId String?
  user   User?   @relation(fields: [userId], references: [id], onDelete: SetNull)
}

model Sale {
  employeeId String?
  employee   User?   @relation(fields: [employeeId], references: [id], onDelete: SetNull)
}
```

**Migration:**
```bash
npx prisma migrate dev --name fix_user_deletion_constraints
```

---

## 8. Registration 500 Error

### Semptomlar
- Yeni tenant kaydı 500 hatası veriyor
- "Connection refused" hatası

### Kök Neden
Frontend server kapanmıştı, backend çalışıyordu ama frontend istekleri alamıyordu.

### Uygulanan Çözüm
```bash
# Frontend'i yeniden başlat
cd client
npm run dev
```

**Önleme:** Process manager kullan (PM2) veya Docker Compose.

---

## 9. Database Schema Drift

### Semptomlar
- Prisma migrate hatası: "Column 'identityNumber' does not exist"

### Kök Neden
Veritabanı schema'sı Prisma schema ile senkronize değil.

### Uygulanan Çözüm
```bash
# Schema'yı sıfırla ve yeniden oluştur
npx prisma migrate reset
npx prisma migrate deploy
npm run seed
```

---

## 10. Single Branch Constraint Bypass

### Semptomlar
- Tek şubeli işletmeler birden fazla şube oluşturabiliyor

### Kök Neden
Frontend kontrolü var ama backend validation eksik.

### Uygulanan Çözüm

**Backend:**
```typescript
// Branch creation validation
if (tenant.isSingleBranch) {
    const existingBranches = await prisma.branch.count({
        where: { tenantId: currentUser.tenantId }
    });
    
    if (existingBranches >= 1) {
        return res.status(400).json({
            error: 'Tek şubeli işletmeler sadece 1 şube oluşturabilir.'
        });
    }
}
```

---

## 11. PDF Bordro İndirme Hatası

### Semptomlar
- Satışlar bordro sayfasında görünüyor
- "PDF Bordro İndir" butonuna tıklanınca hiçbir şey olmuyor
- Console'da hata yok veya sessiz hata
- PDF dosyası indirilmiyor

### Kök Neden
Frontend'de hata yönetimi eksikti. API hatası olsa bile kullanıcıya bilgi verilmiyordu. Ayrıca:
1. **Sessiz Hata Yakalama:** `catch` bloğunda sadece `console.error` vardı, kullanıcı bilgilendirilmiyordu
2. **Blob Validation Eksik:** Boş PDF kontrolü yapılmıyordu
3. **Timeout Yok:** Uzun süren istekler takılıyordu
4. **Backend Logging Yetersiz:** Hangi aşamada hata olduğu belli değildi

### Uygulanan Çözüm

**Frontend (PayrollPage.tsx):**
```typescript
const handleExportPDF = async () => {
    setExporting(true);
    try {
        const token = localStorage.getItem('token');
        
        if (!token) {
            alert('Oturum bulunamadı. Lütfen giriş yapın.');
            return;
        }
        
        console.log('📄 PDF export başlatılıyor...', { startDate, endDate });
        
        const response = await axios.get(`${API_URL}/payroll/export`, {
            params: { startDate, endDate },
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob',
            timeout: 30000  // ✅ 30 saniye timeout
        });
        
        console.log('✅ PDF response alındı:', {
            status: response.status,
            contentType: response.headers['content-type'],
            size: response.data.size
        });
        
        // ✅ Boş PDF kontrolü
        if (response.data.size === 0) {
            alert('PDF boş döndü. Seçilen tarih aralığında satış bulunamadı.');
            return;
        }
        
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Bordro_${startDate}_${endDate}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        alert('PDF başarıyla indirildi!');  // ✅ Başarı mesajı
        
    } catch (error: any) {
        console.error('❌ Export PDF error:', error);
        
        // ✅ Detaylı hata yönetimi
        if (error.response) {
            if (error.response.status === 404) {
                alert('Seçilen tarih aralığında satış bulunamadı.');
            } else if (error.response.status === 401) {
                alert('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.');
                localStorage.clear();
                window.location.href = '/login';
            } else {
                alert(`Sunucu hatası: ${error.response.data?.error || 'Bilinmeyen hata'}`);
            }
        } else if (error.request) {
            alert('Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.');
        } else {
            alert(`Beklenmeyen hata: ${error.message}`);
        }
    } finally {
        setExporting(false);
    }
};
```

**Backend (payroll.controller.ts):**
```typescript
export const exportPayrollPDF = async (req: Request, res: Response) => {
    try {
        console.log('📄 PDF export request:', req.query);  // ✅ Request logging
        
        const { startDate, endDate, branchId, userId } = req.query;
        const currentUser = req.user!;

        const sDate = startDate ? new Date(startDate as string) : startOfMonth(new Date());
        const eDate = endDate ? new Date(endDate as string) : endOfMonth(new Date());
        
        console.log('📅 Date range:', { sDate, eDate, tenantId: currentUser.tenantId });

        // ... where clause ...

        const sales = await prisma.sale.findMany({ /* ... */ });
        
        console.log(`📊 Found ${sales.length} sales for PDF`);  // ✅ Data logging

        // ✅ Veri yoksa 404 dön
        if (sales.length === 0) {
            console.warn('⚠️ No sales found for PDF export');
            return res.status(404).json({ 
                error: 'Seçilen tarih aralığında aktif satış bulunamadı.' 
            });
        }

        // ... PDF generation ...
        
        console.log('✅ PDF generated successfully');  // ✅ Success logging

    } catch (error) {
        console.error('❌ Payroll PDF error:', error);
        res.status(500).json({ 
            error: 'PDF oluşturulurken hata oluştu: ' + (error as Error).message  // ✅ Detaylı hata
        });
    }
};
```

**İyileştirmeler:**
1. ✅ Kullanıcı dostu hata mesajları (alert)
2. ✅ Detaylı console logging (emoji ile kategorize)
3. ✅ Boş PDF kontrolü
4. ✅ Timeout koruması (30 saniye)
5. ✅ Null-safe veri işleme (`employee?.name || 'Bilinmeyen'`)
6. ✅ Başarı bildirimi

**Detaylar:** `implementation_plan_pdf_export_debug.md`

---

## Genel Önleme Stratejileri

### 1. Veri Koruma
- **Asla veri silme:** Soft delete kullan (`deletedAt` field)
- **Migration öncesi yedek:** Her zaman backup al
- **Test DB kullan:** Production'a geçmeden önce test et

**Detaylar:** `DATA_PROTECTION_POLICY.md`

### 2. Hata Yönetimi
- **Frontend:** API hatalarını kullanıcıya göster (toast notifications)
- **Backend:** Detaylı error logging (console.error)
- **Monitoring:** Sentry veya benzer tool kullan

### 3. Type Safety
- **Prisma:** Generated types kullan
- **Frontend:** TypeScript strict mode
- **Validation:** Zod veya Yup ile input validation

### 4. Testing
- **Unit Tests:** Critical fonksiyonlar için
- **Integration Tests:** API endpoints için
- **E2E Tests:** Kritik user flows için

---

## Hızlı Troubleshooting

### Veri Görünmüyor
1. Tarayıcı console'u kontrol et (F12)
2. Network tab'da API isteklerini incele (401/403/500?)
3. `localStorage.getItem('token')` kontrol et
4. Logout/Login dene

### API Hatası
1. Backend terminal loglarını kontrol et
2. Prisma query'leri incele
3. Database'de veri var mı kontrol et (`psql` veya Supabase dashboard)

### Migration Hatası
1. `npx prisma migrate status` çalıştır
2. Pending migration varsa `npx prisma migrate deploy`
3. Hala hata varsa `npx prisma migrate reset` (DİKKAT: Veri kaybı!)

---

## İletişim

Yeni bir sorun tespit edildiğinde:
1. Bu dosyaya ekle
2. Çözümü dokümante et
3. Önleme stratejisi belirt
4. İlgili artifact'lara link ver

**Sorumlular:**
- Backend: [İsim]
- Frontend: [İsim]
- Database: [İsim]

---

## 12. Login Failed - Backend Still Pointing to Supabase

### Symptom
- Login shows 'Login failed' and response mentions Supabase host (db.vdbcoxahsgmvwubuwnqp.supabase.co:5432).

### Cause
- Backend was still using Supabase DATABASE_URL instead of local Postgres.

### Fix (Short)
1. Ensure local Postgres is running (docker compose).
2. Update env files to local DB (port 5433):
   - server/.env and ai_system/.env -> postgresql://sigorta_admin:sigorta_2024_secure_pass@localhost:5433/sigorta_crm?schema=public
3. Restart backend.
4. Seed database: npm run seed

### Notes
- If port 5432 is already used, map container to 5433 in docker-compose.
- If Prisma reports EPERM on generate, rerun or restart backend after db push.
