# 🛒 خارطة طريق وحدة المشتريات - Procurement Module Roadmap

**التاريخ**: 2025-10-24
**الإصدار**: v1.0
**الحالة**: 📋 قيد التخطيط

---

## 📊 نظرة عامة

وحدة المشتريات (Procurement Module) تدير كامل دورة حياة الشراء من طلب الشراء إلى استقبال البضائع والدفع للموردين، مع التكامل الكامل مع:
- **الحسابات**: تسجيل الفواتير والمدفوعات
- **المخازن**: تحديث مستويات المخزون
- **الموردين**: إدارة بيانات الموردين والعلاقات

---

## 🎯 الأهداف الرئيسية

### 1. إدارة طلبات الشراء
- ✅ إنشاء وتعديل طلبات شراء
- ✅ تتبع حالة الطلبات
- ✅ إدارة خطوط الطلب
- ✅ الموافقات والتصاريح

### 2. استقبال البضائع
- ✅ تسجيل استقبال البضائع
- ✅ فحص الكميات والجودة
- ✅ تحديث مستويات المخزون
- ✅ معالجة الفروقات

### 3. إدارة الفواتير
- ✅ استقبال فواتير الموردين
- ✅ مطابقة الفواتير مع الطلبات والاستقبالات
- ✅ تسجيل المصروفات
- ✅ معالجة الخصومات والضرائب

### 4. إدارة المدفوعات
- ✅ تسجيل المدفوعات للموردين
- ✅ تتبع الديون المستحقة
- ✅ إدارة شروط الدفع
- ✅ التسويات والمردودات

---

## 📁 البنية المقترحة

### جداول قاعدة البيانات الجديدة

```
procurement/
├── purchase_orders          # طلبات الشراء
├── purchase_order_lines     # خطوط طلبات الشراء
├── goods_receipts           # استقبالات البضائع
├── goods_receipt_lines      # خطوط الاستقبالات
├── purchase_invoices        # فواتير الموردين
├── purchase_invoice_lines   # خطوط الفواتير
├── purchase_payments        # المدفوعات
├── purchase_returns         # المردودات
└── procurement_settings     # إعدادات المشتريات
```

### مكونات الواجهة

```
components/procurement/
├── purchase-orders/
│   ├── po-list.tsx
│   ├── po-form.tsx
│   ├── po-detail.tsx
│   └── po-actions.tsx
├── goods-receipts/
│   ├── gr-list.tsx
│   ├── gr-form.tsx
│   ├── gr-detail.tsx
│   └── gr-actions.tsx
├── purchase-invoices/
│   ├── pi-list.tsx
│   ├── pi-form.tsx
│   ├── pi-detail.tsx
│   └── pi-actions.tsx
├── purchase-payments/
│   ├── pp-list.tsx
│   ├── pp-form.tsx
│   ├── pp-detail.tsx
│   └── pp-actions.tsx
└── shared/
    ├── vendor-selector.tsx
    ├── product-selector.tsx
    ├── po-status-badge.tsx
    └── procurement-dashboard.tsx
```

### API Endpoints

```
/api/procurement/
├── purchase-orders/
│   ├── GET    /                 # قائمة الطلبات
│   ├── POST   /                 # إنشاء طلب
│   ├── GET    /:id              # تفاصيل الطلب
│   ├── PATCH  /:id              # تحديث الطلب
│   ├── DELETE /:id              # حذف الطلب
│   ├── PATCH  /:id/status       # تغيير الحالة
│   └── POST   /:id/approve      # الموافقة
├── goods-receipts/
│   ├── GET    /                 # قائمة الاستقبالات
│   ├── POST   /                 # إنشاء استقبال
│   ├── GET    /:id              # تفاصيل الاستقبال
│   ├── PATCH  /:id              # تحديث الاستقبال
│   └── DELETE /:id              # حذف الاستقبال
├── purchase-invoices/
│   ├── GET    /                 # قائمة الفواتير
│   ├── POST   /                 # إنشاء فاتورة
│   ├── GET    /:id              # تفاصيل الفاتورة
│   ├── PATCH  /:id              # تحديث الفاتورة
│   ├── DELETE /:id              # حذف الفاتورة
│   └── POST   /:id/match        # مطابقة الفاتورة
└── purchase-payments/
    ├── GET    /                 # قائمة المدفوعات
    ├── POST   /                 # إنشاء مدفوعة
    ├── GET    /:id              # تفاصيل المدفوعة
    ├── PATCH  /:id              # تحديث المدفوعة
    └── DELETE /:id              # حذف المدفوعة
```

---

## 🗄️ تصميم قاعدة البيانات

### 1. جدول طلبات الشراء (purchase_orders)

```sql
CREATE TABLE purchase_orders (
  id TEXT PRIMARY KEY,
  poNumber TEXT UNIQUE NOT NULL,           -- رقم الطلب (PO-001)
  vendorId TEXT NOT NULL REFERENCES vendors(id),
  warehouseId TEXT NOT NULL REFERENCES warehouses(id),
  poDate DATE NOT NULL,                    -- تاريخ الطلب
  requiredDate DATE,                       -- التاريخ المطلوب
  deliveryDate DATE,                       -- تاريخ التسليم الفعلي
  status TEXT DEFAULT 'draft',             -- draft, submitted, approved, received, cancelled
  paymentTerms TEXT,                       -- Net 30, COD, etc.
  shippingMethod TEXT,                     -- FOB, CIF, etc.
  notes TEXT,
  totalAmount DECIMAL(12,2),
  taxAmount DECIMAL(12,2),
  grandTotal DECIMAL(12,2),
  approvedBy TEXT REFERENCES users(id),
  approvedAt TIMESTAMP,
  createdBy TEXT NOT NULL REFERENCES users(id),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP,
  deletedAt TIMESTAMP
);
```

### 2. جدول خطوط طلبات الشراء (purchase_order_lines)

```sql
CREATE TABLE purchase_order_lines (
  id TEXT PRIMARY KEY,
  poId TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  lineNumber INTEGER NOT NULL,
  productId TEXT NOT NULL REFERENCES products(id),
  quantity DECIMAL(10,2) NOT NULL,
  unitPrice DECIMAL(10,2) NOT NULL,
  totalPrice DECIMAL(12,2) NOT NULL,
  receivedQuantity DECIMAL(10,2) DEFAULT 0,
  invoicedQuantity DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP
);
```

### 3. جدول استقبالات البضائع (goods_receipts)

```sql
CREATE TABLE goods_receipts (
  id TEXT PRIMARY KEY,
  grNumber TEXT UNIQUE NOT NULL,           -- رقم الاستقبال (GR-001)
  poId TEXT NOT NULL REFERENCES purchase_orders(id),
  vendorId TEXT NOT NULL REFERENCES vendors(id),
  warehouseId TEXT NOT NULL REFERENCES warehouses(id),
  grDate DATE NOT NULL,
  status TEXT DEFAULT 'draft',             -- draft, received, inspected, accepted, rejected
  totalQuantity DECIMAL(10,2),
  totalAmount DECIMAL(12,2),
  notes TEXT,
  inspectedBy TEXT REFERENCES users(id),
  inspectedAt TIMESTAMP,
  acceptedBy TEXT REFERENCES users(id),
  acceptedAt TIMESTAMP,
  createdBy TEXT NOT NULL REFERENCES users(id),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP,
  deletedAt TIMESTAMP
);
```

### 4. جدول خطوط الاستقبالات (goods_receipt_lines)

```sql
CREATE TABLE goods_receipt_lines (
  id TEXT PRIMARY KEY,
  grId TEXT NOT NULL REFERENCES goods_receipts(id) ON DELETE CASCADE,
  poLineId TEXT NOT NULL REFERENCES purchase_order_lines(id),
  productId TEXT NOT NULL REFERENCES products(id),
  lineNumber INTEGER NOT NULL,
  orderedQuantity DECIMAL(10,2) NOT NULL,
  receivedQuantity DECIMAL(10,2) NOT NULL,
  acceptedQuantity DECIMAL(10,2) DEFAULT 0,
  rejectedQuantity DECIMAL(10,2) DEFAULT 0,
  unitPrice DECIMAL(10,2) NOT NULL,
  totalPrice DECIMAL(12,2),
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP
);
```

### 5. جدول فواتير الموردين (purchase_invoices)

```sql
CREATE TABLE purchase_invoices (
  id TEXT PRIMARY KEY,
  invoiceNumber TEXT UNIQUE NOT NULL,      -- رقم الفاتورة
  vendorInvoiceNumber TEXT,                -- رقم فاتورة الموردين
  poId TEXT REFERENCES purchase_orders(id),
  grId TEXT REFERENCES goods_receipts(id),
  vendorId TEXT NOT NULL REFERENCES vendors(id),
  invoiceDate DATE NOT NULL,
  dueDate DATE,
  status TEXT DEFAULT 'draft',             -- draft, received, matched, approved, paid, cancelled
  matchingStatus TEXT DEFAULT 'unmatched', -- unmatched, partial, matched
  subtotal DECIMAL(12,2),
  taxAmount DECIMAL(12,2),
  discountAmount DECIMAL(12,2),
  totalAmount DECIMAL(12,2),
  paidAmount DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  approvedBy TEXT REFERENCES users(id),
  approvedAt TIMESTAMP,
  createdBy TEXT NOT NULL REFERENCES users(id),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP,
  deletedAt TIMESTAMP
);
```

### 6. جدول خطوط الفواتير (purchase_invoice_lines)

```sql
CREATE TABLE purchase_invoice_lines (
  id TEXT PRIMARY KEY,
  invoiceId TEXT NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
  poLineId TEXT REFERENCES purchase_order_lines(id),
  grLineId TEXT REFERENCES goods_receipt_lines(id),
  productId TEXT NOT NULL REFERENCES products(id),
  lineNumber INTEGER NOT NULL,
  description TEXT,
  quantity DECIMAL(10,2) NOT NULL,
  unitPrice DECIMAL(10,2) NOT NULL,
  totalPrice DECIMAL(12,2) NOT NULL,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP
);
```

### 7. جدول المدفوعات (purchase_payments)

```sql
CREATE TABLE purchase_payments (
  id TEXT PRIMARY KEY,
  paymentNumber TEXT UNIQUE NOT NULL,      -- رقم المدفوعة
  invoiceId TEXT NOT NULL REFERENCES purchase_invoices(id),
  vendorId TEXT NOT NULL REFERENCES vendors(id),
  paymentDate DATE NOT NULL,
  paymentMethod TEXT NOT NULL,             -- cash, check, bank_transfer, credit_card
  amount DECIMAL(12,2) NOT NULL,
  reference TEXT,                          -- رقم الشيك أو رقم التحويل
  status TEXT DEFAULT 'draft',             -- draft, processed, cleared, cancelled
  notes TEXT,
  approvedBy TEXT REFERENCES users(id),
  approvedAt TIMESTAMP,
  createdBy TEXT NOT NULL REFERENCES users(id),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP,
  deletedAt TIMESTAMP
);
```

### 8. جدول المردودات (purchase_returns)

```sql
CREATE TABLE purchase_returns (
  id TEXT PRIMARY KEY,
  returnNumber TEXT UNIQUE NOT NULL,       -- رقم المردود
  invoiceId TEXT NOT NULL REFERENCES purchase_invoices(id),
  grId TEXT REFERENCES goods_receipts(id),
  vendorId TEXT NOT NULL REFERENCES vendors(id),
  returnDate DATE NOT NULL,
  reason TEXT NOT NULL,                    -- defective, wrong_item, damaged, etc.
  status TEXT DEFAULT 'draft',             -- draft, submitted, approved, received, credited
  totalAmount DECIMAL(12,2),
  creditAmount DECIMAL(12,2),
  notes TEXT,
  approvedBy TEXT REFERENCES users(id),
  approvedAt TIMESTAMP,
  createdBy TEXT NOT NULL REFERENCES users(id),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP,
  deletedAt TIMESTAMP
);
```

---

## 🔗 التكامل مع الأنظمة الأخرى

### 1. التكامل مع الحسابات (Accounting Integration)

#### عند إنشاء طلب شراء (PO)
```
لا يوجد تأثير محاسبي (تسجيل مذكر فقط)
```

#### عند استقبال البضائع (GR)
```
تسجيل إدخال مخزون:
  Dr. Inventory Account (Asset)
  Cr. Accounts Payable (Liability)
```

#### عند استقبال الفاتورة (PI)
```
تحديث الالتزام:
  Dr. Accounts Payable (Liability)
  Cr. Accounts Payable - Invoiced
```

#### عند الدفع (Payment)
```
تسجيل الدفع:
  Dr. Accounts Payable (Liability)
  Cr. Cash/Bank Account (Asset)
```

### 2. التكامل مع المخازن (Inventory Integration)

#### عند استقبال البضائع
```
- تحديث مستويات المخزون
- تسجيل حركة مخزون (purchase)
- تحديث تكلفة الوحدة
- حساب متوسط التكلفة
```

#### عند المردود
```
- تقليل مستويات المخزون
- تسجيل حركة مخزون (return)
- تحديث التكاليف
```

### 3. التكامل مع الموردين (Vendor Integration)

#### تحديث بيانات الموردين
```
- إجمالي المشتريات
- الفترة الزمنية للدفع
- متوسط أسعار الشراء
- تقييم الأداء
```

---

## 📊 تدفق العمليات

### 1. دورة طلب الشراء الكاملة

```
┌─────────────────────────────────────────────────────────────┐
│                    دورة طلب الشراء                          │
└─────────────────────────────────────────────────────────────┘

1. إنشاء طلب شراء (Draft)
   ↓
2. إضافة خطوط الطلب
   ↓
3. تقديم الطلب (Submitted)
   ↓
4. الموافقة على الطلب (Approved)
   ↓
5. استقبال البضائع (Goods Receipt)
   ↓
6. فحص وقبول البضائع (Accepted)
   ↓
7. استقبال الفاتورة (Purchase Invoice)
   ↓
8. مطابقة الفاتورة (Matched)
   ↓
9. الموافقة على الفاتورة (Approved)
   ↓
10. الدفع للمورد (Payment)
   ↓
11. إغلاق الطلب (Closed)
```

### 2. مطابقة ثلاثية الاتجاهات (3-Way Matching)

```
┌──────────────┐
│ طلب الشراء   │
│   (PO)       │
└──────────────┘
       │
       ├─────────────────────────┐
       │                         │
       ↓                         ↓
┌──────────────┐         ┌──────────────┐
│ استقبال      │         │ فاتورة       │
│ البضائع      │         │ الموردين     │
│   (GR)       │         │   (PI)       │
└──────────────┘         └──────────────┘
       │                         │
       └─────────────────────────┘
              │
              ↓
       ┌──────────────┐
       │ مطابقة       │
       │ الكميات      │
       │ والأسعار     │
       └──────────────┘
              │
              ↓
       ┌──────────────┐
       │ الموافقة     │
       │ والدفع       │
       └──────────────┘
```

---

## 🎨 واجهة المستخدم

### 1. لوحة تحكم المشتريات (Procurement Dashboard)

```
┌─────────────────────────────────────────────────────────────┐
│                  لوحة تحكم المشتريات                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ طلبات قيد    │  │ استقبالات    │  │ فواتير       │    │
│  │ الانتظار     │  │ معلقة        │  │ غير مدفوعة   │    │
│  │    15       │  │     8        │  │     12       │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ الطلبات الأخيرة                                      │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ PO-001 | Vendor A | $5,000 | Approved | 2025-10-24 │  │
│  │ PO-002 | Vendor B | $3,500 | Draft    | 2025-10-23 │  │
│  │ PO-003 | Vendor C | $2,100 | Received | 2025-10-22 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ الفواتير المستحقة                                    │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ INV-001 | Vendor A | $5,000 | Due: 2025-11-05      │  │
│  │ INV-002 | Vendor B | $3,500 | Due: 2025-11-02      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. قائمة طلبات الشراء

```
┌─────────────────────────────────────────────────────────────┐
│ طلبات الشراء                                    [+ جديد]    │
├─────────────────────────────────────────────────────────────┤
│ البحث: ________  الحالة: [جميع ▼]  الموردين: [جميع ▼]    │
├─────────────────────────────────────────────────────────────┤
│ # │ الرقم  │ الموردين  │ التاريخ │ الحالة │ المبلغ │ الإجراء │
├─────────────────────────────────────────────────────────────┤
│ 1 │ PO-001 │ Vendor A  │ 24/10  │ موافق │ $5000 │ [تفاصيل]│
│ 2 │ PO-002 │ Vendor B  │ 23/10  │ مسودة │ $3500 │ [تعديل] │
│ 3 │ PO-003 │ Vendor C  │ 22/10  │ مستلم │ $2100 │ [عرض]   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📈 المرحلة الأولى (Phase 1)

### المدة: 2-3 أسابيع

#### المهام:
1. ✅ إنشاء جداول قاعدة البيانات
2. ✅ إنشاء API endpoints الأساسية
3. ✅ إنشاء مكونات الواجهة الأساسية
4. ✅ التكامل مع الموردين
5. ✅ التكامل مع المخازن

#### الملفات المطلوبة:
```
lib/db/schema.ts                    # إضافة جداول جديدة
lib/procurement/repository.ts       # دوال الوصول للبيانات
app/api/procurement/                # API endpoints
components/procurement/             # مكونات الواجهة
app/(dashboard)/procurement/        # صفحات المشتريات
```

---

## 📈 المرحلة الثانية (Phase 2)

### المدة: 2-3 أسابيع

#### المهام:
1. ✅ مطابقة ثلاثية الاتجاهات (3-Way Matching)
2. ✅ إدارة المدفوعات
3. ✅ إدارة المردودات
4. ✅ التقارير والتحليلات
5. ✅ الموافقات والتصاريح

---

## 📈 المرحلة الثالثة (Phase 3)

### المدة: 1-2 أسبوع

#### المهام:
1. ✅ الأتمتة والجدولة
2. ✅ الإشعارات والتنبيهات
3. ✅ التكامل مع البنك
4. ✅ الاستيراد من الملفات
5. ✅ التحسينات والتحسينات

---

## 🔐 الأمان والصلاحيات

### الأدوار المطلوبة:
```
1. Procurement Manager
   - إنشاء وتعديل طلبات الشراء
   - الموافقة على الطلبات
   - إدارة الموردين

2. Warehouse Manager
   - استقبال البضائع
   - فحص وقبول البضائع
   - إدارة المخزون

3. Accounts Manager
   - استقبال الفواتير
   - مطابقة الفواتير
   - تسجيل المدفوعات

4. Admin
   - جميع الصلاحيات
   - إدارة الإعدادات
```

---

## 📊 المقاييس والمؤشرات

### KPIs المطلوبة:
```
1. متوسط وقت الشراء (PO Cycle Time)
2. دقة المطابقة (Matching Accuracy)
3. معدل الفواتير المتأخرة (Late Invoice Rate)
4. متوسط تكلفة الشراء (Average Purchase Cost)
5. معدل المردودات (Return Rate)
6. أداء الموردين (Vendor Performance)
```

---

## 🚀 الخطوات التالية

### الأسبوع الأول:
1. ✅ إنشاء جداول قاعدة البيانات
2. ✅ إنشاء API endpoints الأساسية
3. ✅ إنشاء مكونات الواجهة الأساسية

### الأسبوع الثاني:
1. ✅ التكامل مع الحسابات
2. ✅ التكامل مع المخازن
3. ✅ اختبار شامل

### الأسبوع الثالث:
1. ✅ المرحلة الثانية من الميزات
2. ✅ التقارير والتحليلات
3. ✅ الإطلاق الأولي

---

## 📝 الملاحظات المهمة

### التحديات المتوقعة:
1. **مطابقة ثلاثية الاتجاهات**: تتطلب منطق معقد
2. **التكامل المحاسبي**: يتطلب فهم عميق للمحاسبة
3. **إدارة الأخطاء**: معالجة الحالات الاستثنائية
4. **الأداء**: التعامل مع كميات كبيرة من البيانات

### الحلول المقترحة:
1. استخدام transactions للعمليات المعقدة
2. إنشاء audit trail لكل عملية
3. استخدام queues للعمليات الطويلة
4. تحسين الفهارس في قاعدة البيانات

---

## 📞 الدعم والمساعدة

للأسئلة أو الاستفسارات، يرجى التواصل مع فريق التطوير.

---

**آخر تحديث**: 2025-10-24 21:50 UTC+3
**الإصدار**: v1.0
**الحالة**: 📋 قيد التخطيط
