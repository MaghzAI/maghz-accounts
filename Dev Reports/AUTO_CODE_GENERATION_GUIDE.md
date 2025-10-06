# 🔢 نظام توليد الأكواد التلقائية

## ✅ المميزات المكتملة

تم إنشاء نظام شامل لتوليد الأكواد التلقائية لجميع المستندات في النظام مع إمكانية تخصيص كامل للتنسيق.

---

## 📋 المكونات الرئيسية

### 1. قاعدة البيانات

#### جدول `code_settings`
```sql
CREATE TABLE code_settings (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL UNIQUE,  -- نوع المستند
  prefix TEXT NOT NULL,               -- البادئة (مثل: PROD, INV)
  separator TEXT NOT NULL DEFAULT '-', -- الفاصل (-, _, أو فارغ)
  digit_length INTEGER NOT NULL DEFAULT 4, -- عدد الأرقام
  current_number INTEGER NOT NULL DEFAULT 0, -- آخر رقم مستخدم
  suffix TEXT,                        -- لاحقة اختيارية
  example TEXT NOT NULL,              -- مثال على الكود
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 2. الإعدادات الافتراضية

تم تهيئة 8 أنواع من المستندات:

| نوع المستند | البادئة | الفاصل | الأرقام | مثال |
|------------|---------|--------|---------|-------|
| Product | PROD | - | 4 | PROD-0001 |
| Warehouse | WH | - | 3 | WH-001 |
| Transaction | TRX | - | 5 | TRX-00001 |
| Customer | CUST | - | 4 | CUST-0001 |
| Vendor | VEND | - | 4 | VEND-0001 |
| Invoice | INV | - | 5 | INV-00001 |
| Journal | JE | - | 5 | JE-00001 |
| Reconciliation | REC | - | 4 | REC-0001 |

---

## 🔧 الملفات المضافة

### 1. Schema
- **`lib/db/schema.ts`** - إضافة جدول `codeSettings`

### 2. دوال التوليد
- **`lib/code-generator.ts`** - دوال توليد الأكواد:
  - `generateCode(entityType)` - توليد كود جديد
  - `generateExample()` - توليد مثال للعرض
  - `getCodeSettings()` - جلب إعدادات نوع معين
  - `initializeDefaultCodeSettings()` - تهيئة الإعدادات الافتراضية

### 3. API Endpoints
- **`app/api/code-settings/route.ts`**
  - `GET /api/code-settings` - جلب جميع الإعدادات
  - `POST /api/code-settings` - إنشاء/تحديث إعدادات

- **`app/api/generate-code/route.ts`**
  - `GET /api/generate-code?type=product` - توليد كود جديد

### 4. Scripts
- **`scripts/init-code-settings.ts`** - سكريبت تهيئة الإعدادات

### 5. واجهة الإعدادات
- **`app/(dashboard)/settings/page.tsx`** - تبويب "Code Settings"

---

## 🎯 كيفية الاستخدام

### 1. عرض وتعديل الإعدادات

1. اذهب إلى `/settings`
2. اضغط على تبويب **"Code Settings"**
3. ستجد جدول بجميع أنواع المستندات
4. اضغط **"Edit"** لتعديل أي إعداد

### 2. تعديل تنسيق الكود

عند الضغط على Edit، يمكنك تعديل:

- **Prefix** (البادئة): النص في البداية (مثل: PROD, INV)
- **Separator** (الفاصل): 
  - `-` (Dash)
  - `_` (Underscore)
  - فارغ (بدون فاصل)
- **Digit Length** (عدد الأرقام): من 1 إلى 10
- **Suffix** (اللاحقة): نص اختياري في النهاية (مثل: -2025)

**معاينة فورية:** يظهر مثال على الكود أثناء التعديل

### 3. استخدام الكود التلقائي في النماذج

#### مثال: نموذج المنتج

```typescript
// عند فتح النموذج
async function generateProductCode() {
  const response = await fetch("/api/generate-code?type=product");
  const { code } = await response.json();
  setProductForm(prev => ({ ...prev, code }));
}

// حقل الكود (للقراءة فقط)
<Input
  value={productForm.code}
  readOnly
  className="bg-muted"
  placeholder="Auto-generated"
/>
```

---

## 📊 آلية العمل

### 1. توليد الكود

```
1. جلب إعدادات نوع المستند من قاعدة البيانات
2. زيادة currentNumber بمقدار 1
3. تحديث currentNumber في قاعدة البيانات
4. تكوين الكود: prefix + separator + paddedNumber + suffix
5. إرجاع الكود
```

### 2. مثال على التوليد

إعدادات المنتج:
- Prefix: `PROD`
- Separator: `-`
- Digit Length: `4`
- Current Number: `5`
- Suffix: (فارغ)

**الكود المولد:** `PROD-0006`

---

## 🔄 التطبيق على جميع النماذج

### ✅ تم التطبيق على:
1. **Products** (المنتجات) - `/inventory`

### 🔜 يمكن تطبيقه بسهولة على:
2. **Warehouses** (المخازن)
3. **Customers** (العملاء)
4. **Vendors** (الموردين)
5. **Transactions** (المعاملات)
6. **Invoices** (الفواتير)
7. **Journal Entries** (القيود اليومية)
8. **Reconciliations** (التسويات)

---

## 💡 نموذج التطبيق على نماذج أخرى

### مثال: تطبيق على Warehouses

```typescript
// 1. إضافة دالة التوليد
async function generateWarehouseCode() {
  const response = await fetch("/api/generate-code?type=warehouse");
  const { code } = await response.json();
  setWarehouseForm(prev => ({ ...prev, code }));
}

// 2. استدعاء الدالة عند فتح النموذج
useEffect(() => {
  generateWarehouseCode();
}, []);

// 3. جعل حقل الكود للقراءة فقط
<Input
  value={warehouseForm.code}
  readOnly
  className="bg-muted"
/>

// 4. توليد كود جديد بعد الحفظ الناجح
if (response.ok) {
  generateWarehouseCode();
}
```

---

## 🎨 واجهة الإعدادات

### الجدول الرئيسي
يعرض:
- نوع المستند
- التنسيق (Format)
- مثال على الكود
- آخر رقم مستخدم
- الحالة (Active/Inactive)
- زر التعديل

### نموذج التعديل
- حقول التعديل (Prefix, Separator, Digit Length, Suffix)
- معاينة فورية للكود
- أزرار الحفظ والإلغاء

### شرح توضيحي
صندوق أزرق يشرح:
- ما هي البادئة
- ما هو الفاصل
- ما هو عدد الأرقام
- ما هي اللاحقة
- كيف يعمل الترقيم التلقائي

---

## 🔒 الأمان

- ✅ جميع API endpoints محمية بـ Authentication
- ✅ التحقق من صلاحيات المستخدم
- ✅ Validation للبيانات المدخلة
- ✅ معالجة الأخطاء بشكل آمن

---

## 📈 المزايا

1. **توحيد التنسيق**: جميع الأكواد بنفس النمط
2. **عدم التكرار**: كل كود فريد تلقائياً
3. **قابل للتخصيص**: يمكن تغيير التنسيق بسهولة
4. **سهل الاستخدام**: لا حاجة لإدخال الكود يدوياً
5. **احترافي**: أكواد منظمة ومرتبة
6. **مرن**: يدعم أي نوع من المستندات

---

## 🚀 الاستخدام السريع

### تهيئة الإعدادات (مرة واحدة فقط)
```bash
npx tsx scripts/init-code-settings.ts
```

### تشغيل التطبيق
```bash
npm run dev
```

### تعديل الإعدادات
1. افتح `http://localhost:3000/settings`
2. اذهب إلى تبويب "Code Settings"
3. عدّل الإعدادات كما تريد
4. احفظ التغييرات

### إضافة منتج جديد
1. اذهب إلى `/inventory`
2. اضغط "Add Product"
3. **الكود سيكون موجوداً تلقائياً!**
4. املأ باقي الحقول
5. احفظ

---

## ✨ النتيجة

الآن جميع المستندات في النظام تحصل على أكواد تلقائية منظمة وقابلة للتخصيص بالكامل من صفحة الإعدادات! 🎉
