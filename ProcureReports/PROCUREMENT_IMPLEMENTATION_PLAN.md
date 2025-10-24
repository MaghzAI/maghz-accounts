# 🛠️ خطة التنفيذ التفصيلية - Procurement Implementation Plan

**التاريخ**: 2025-10-24
**الإصدار**: v1.0
**المرحلة**: Phase 1 - الأساسيات

---

## 📋 جدول المحتويات

1. [البنية الأساسية](#البنية-الأساسية)
2. [جداول قاعدة البيانات](#جداول-قاعدة-البيانات)
3. [API Endpoints](#api-endpoints)
4. [مكونات الواجهة](#مكونات-الواجهة)
5. [التكامل مع الأنظمة](#التكامل-مع-الأنظمة)
6. [الاختبار](#الاختبار)

---

## البنية الأساسية

### 1. تحديث schema.ts

سيتم إضافة الجداول التالية:

```typescript
// Procurement Tables
export const purchaseOrders = sqliteTable("purchase_orders", {
  id: text("id").primaryKey(),
  poNumber: text("po_number").notNull().unique(),
  vendorId: text("vendor_id").notNull().references(() => vendors.id),
  warehouseId: text("warehouse_id").notNull().references(() => warehouses.id),
  poDate: integer("po_date", { mode: "timestamp" }).notNull(),
  requiredDate: integer("required_date", { mode: "timestamp" }),
  deliveryDate: integer("delivery_date", { mode: "timestamp" }),
  status: text("status", {
    enum: ["draft", "submitted", "approved", "received", "cancelled"]
  }).notNull().default("draft"),
  paymentTerms: text("payment_terms"),
  shippingMethod: text("shipping_method"),
  notes: text("notes"),
  totalAmount: real("total_amount"),
  taxAmount: real("tax_amount"),
  grandTotal: real("grand_total"),
  approvedBy: text("approved_by").references(() => users.id),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

export const purchaseOrderLines = sqliteTable("purchase_order_lines", {
  id: text("id").primaryKey(),
  poId: text("po_id").notNull().references(() => purchaseOrders.id, { onDelete: "cascade" }),
  lineNumber: integer("line_number").notNull(),
  productId: text("product_id").notNull().references(() => products.id),
  quantity: real("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  totalPrice: real("total_price").notNull(),
  receivedQuantity: real("received_quantity").notNull().default(0),
  invoicedQuantity: real("invoiced_quantity").notNull().default(0),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const goodsReceipts = sqliteTable("goods_receipts", {
  id: text("id").primaryKey(),
  grNumber: text("gr_number").notNull().unique(),
  poId: text("po_id").notNull().references(() => purchaseOrders.id),
  vendorId: text("vendor_id").notNull().references(() => vendors.id),
  warehouseId: text("warehouse_id").notNull().references(() => warehouses.id),
  grDate: integer("gr_date", { mode: "timestamp" }).notNull(),
  status: text("status", {
    enum: ["draft", "received", "inspected", "accepted", "rejected"]
  }).notNull().default("draft"),
  totalQuantity: real("total_quantity"),
  totalAmount: real("total_amount"),
  notes: text("notes"),
  inspectedBy: text("inspected_by").references(() => users.id),
  inspectedAt: integer("inspected_at", { mode: "timestamp" }),
  acceptedBy: text("accepted_by").references(() => users.id),
  acceptedAt: integer("accepted_at", { mode: "timestamp" }),
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

export const goodsReceiptLines = sqliteTable("goods_receipt_lines", {
  id: text("id").primaryKey(),
  grId: text("gr_id").notNull().references(() => goodsReceipts.id, { onDelete: "cascade" }),
  poLineId: text("po_line_id").notNull().references(() => purchaseOrderLines.id),
  productId: text("product_id").notNull().references(() => products.id),
  lineNumber: integer("line_number").notNull(),
  orderedQuantity: real("ordered_quantity").notNull(),
  receivedQuantity: real("received_quantity").notNull(),
  acceptedQuantity: real("accepted_quantity").notNull().default(0),
  rejectedQuantity: real("rejected_quantity").notNull().default(0),
  unitPrice: real("unit_price").notNull(),
  totalPrice: real("total_price"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const purchaseInvoices = sqliteTable("purchase_invoices", {
  id: text("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  vendorInvoiceNumber: text("vendor_invoice_number"),
  poId: text("po_id").references(() => purchaseOrders.id),
  grId: text("gr_id").references(() => goodsReceipts.id),
  vendorId: text("vendor_id").notNull().references(() => vendors.id),
  invoiceDate: integer("invoice_date", { mode: "timestamp" }).notNull(),
  dueDate: integer("due_date", { mode: "timestamp" }),
  status: text("status", {
    enum: ["draft", "received", "matched", "approved", "paid", "cancelled"]
  }).notNull().default("draft"),
  matchingStatus: text("matching_status", {
    enum: ["unmatched", "partial", "matched"]
  }).notNull().default("unmatched"),
  subtotal: real("subtotal"),
  taxAmount: real("tax_amount"),
  discountAmount: real("discount_amount"),
  totalAmount: real("total_amount"),
  paidAmount: real("paid_amount").notNull().default(0),
  notes: text("notes"),
  approvedBy: text("approved_by").references(() => users.id),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

export const purchaseInvoiceLines = sqliteTable("purchase_invoice_lines", {
  id: text("id").primaryKey(),
  invoiceId: text("invoice_id").notNull().references(() => purchaseInvoices.id, { onDelete: "cascade" }),
  poLineId: text("po_line_id").references(() => purchaseOrderLines.id),
  grLineId: text("gr_line_id").references(() => goodsReceiptLines.id),
  productId: text("product_id").notNull().references(() => products.id),
  lineNumber: integer("line_number").notNull(),
  description: text("description"),
  quantity: real("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  totalPrice: real("total_price").notNull(),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const purchasePayments = sqliteTable("purchase_payments", {
  id: text("id").primaryKey(),
  paymentNumber: text("payment_number").notNull().unique(),
  invoiceId: text("invoice_id").notNull().references(() => purchaseInvoices.id),
  vendorId: text("vendor_id").notNull().references(() => vendors.id),
  paymentDate: integer("payment_date", { mode: "timestamp" }).notNull(),
  paymentMethod: text("payment_method", {
    enum: ["cash", "check", "bank_transfer", "credit_card"]
  }).notNull(),
  amount: real("amount").notNull(),
  reference: text("reference"),
  status: text("status", {
    enum: ["draft", "processed", "cleared", "cancelled"]
  }).notNull().default("draft"),
  notes: text("notes"),
  approvedBy: text("approved_by").references(() => users.id),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});
```

---

## جداول قاعدة البيانات

### ملف التحديث: `lib/db/schema.ts`

**الموقع**: بعد جدول `stockLevels`

**الخطوات**:
1. إضافة 7 جداول جديدة
2. إضافة الفهارس المطلوبة
3. إضافة العلاقات بين الجداول

---

## API Endpoints

### 1. طلبات الشراء (Purchase Orders)

**الملف**: `app/api/procurement/purchase-orders/route.ts`

```typescript
// GET /api/procurement/purchase-orders
// - قائمة جميع طلبات الشراء
// - معاملات: status, vendorId, warehouseId, search, page, limit

// POST /api/procurement/purchase-orders
// - إنشاء طلب شراء جديد
// - البيانات: vendorId, warehouseId, poDate, requiredDate, items[]

// GET /api/procurement/purchase-orders/:id
// - تفاصيل طلب شراء محدد

// PATCH /api/procurement/purchase-orders/:id
// - تحديث طلب شراء

// DELETE /api/procurement/purchase-orders/:id
// - حذف طلب شراء

// PATCH /api/procurement/purchase-orders/:id/status
// - تغيير حالة الطلب

// POST /api/procurement/purchase-orders/:id/approve
// - الموافقة على الطلب
```

### 2. استقبالات البضائع (Goods Receipts)

**الملف**: `app/api/procurement/goods-receipts/route.ts`

```typescript
// GET /api/procurement/goods-receipts
// - قائمة جميع الاستقبالات

// POST /api/procurement/goods-receipts
// - إنشاء استقبال جديد

// GET /api/procurement/goods-receipts/:id
// - تفاصيل الاستقبال

// PATCH /api/procurement/goods-receipts/:id
// - تحديث الاستقبال

// DELETE /api/procurement/goods-receipts/:id
// - حذف الاستقبال

// PATCH /api/procurement/goods-receipts/:id/status
// - تغيير حالة الاستقبال
```

### 3. فواتير الموردين (Purchase Invoices)

**الملف**: `app/api/procurement/purchase-invoices/route.ts`

```typescript
// GET /api/procurement/purchase-invoices
// - قائمة جميع الفواتير

// POST /api/procurement/purchase-invoices
// - إنشاء فاتورة جديدة

// GET /api/procurement/purchase-invoices/:id
// - تفاصيل الفاتورة

// PATCH /api/procurement/purchase-invoices/:id
// - تحديث الفاتورة

// DELETE /api/procurement/purchase-invoices/:id
// - حذف الفاتورة

// POST /api/procurement/purchase-invoices/:id/match
// - مطابقة الفاتورة مع PO و GR
```

### 4. المدفوعات (Purchase Payments)

**الملف**: `app/api/procurement/purchase-payments/route.ts`

```typescript
// GET /api/procurement/purchase-payments
// - قائمة جميع المدفوعات

// POST /api/procurement/purchase-payments
// - إنشاء مدفوعة جديدة

// GET /api/procurement/purchase-payments/:id
// - تفاصيل المدفوعة

// PATCH /api/procurement/purchase-payments/:id
// - تحديث المدفوعة

// DELETE /api/procurement/purchase-payments/:id
// - حذف المدفوعة
```

---

## مكونات الواجهة

### 1. لوحة تحكم المشتريات

**الملف**: `components/procurement/procurement-dashboard.tsx`

**الميزات**:
- عرض ملخص المشتريات
- عرض الطلبات المعلقة
- عرض الفواتير المستحقة
- عرض أداء الموردين

### 2. قائمة طلبات الشراء

**الملف**: `components/procurement/purchase-orders/po-list.tsx`

**الميزات**:
- عرض جميع الطلبات
- البحث والتصفية
- الترتيب
- الإجراءات السريعة

### 3. نموذج طلب الشراء

**الملف**: `components/procurement/purchase-orders/po-form.tsx`

**الميزات**:
- إنشاء طلب جديد
- تعديل طلب موجود
- إضافة خطوط الطلب
- حساب الإجمالي

### 4. قائمة الاستقبالات

**الملف**: `components/procurement/goods-receipts/gr-list.tsx`

**الميزات**:
- عرض جميع الاستقبالات
- البحث والتصفية
- الترتيب

### 5. نموذج الاستقبال

**الملف**: `components/procurement/goods-receipts/gr-form.tsx`

**الميزات**:
- إنشاء استقبال جديد
- ربط مع طلب شراء
- إضافة خطوط الاستقبال
- فحص الكميات

### 6. قائمة الفواتير

**الملف**: `components/procurement/purchase-invoices/pi-list.tsx`

**الميزات**:
- عرض جميع الفواتير
- البحث والتصفية
- عرض حالة المطابقة

### 7. نموذج الفاتورة

**الملف**: `components/procurement/purchase-invoices/pi-form.tsx`

**الميزات**:
- إنشاء فاتورة جديدة
- ربط مع طلب شراء واستقبال
- مطابقة ثلاثية الاتجاهات

### 8. قائمة المدفوعات

**الملف**: `components/procurement/purchase-payments/pp-list.tsx`

**الميزات**:
- عرض جميع المدفوعات
- البحث والتصفية

### 9. نموذج المدفوعة

**الملف**: `components/procurement/purchase-payments/pp-form.tsx`

**الميزات**:
- إنشاء مدفوعة جديدة
- ربط مع فاتورة
- تسجيل طريقة الدفع

---

## التكامل مع الأنظمة

### 1. التكامل مع الحسابات

#### عند استقبال البضائع:
```
Dr. Inventory Account (Asset)
Cr. Accounts Payable (Liability)
```

#### عند استقبال الفاتورة:
```
Dr. Accounts Payable (Liability)
Cr. Accounts Payable - Invoiced
```

#### عند الدفع:
```
Dr. Accounts Payable (Liability)
Cr. Cash/Bank Account (Asset)
```

### 2. التكامل مع المخازن

#### عند استقبال البضائع:
- تحديث مستويات المخزون
- تسجيل حركة مخزون
- تحديث تكلفة الوحدة

#### عند المردود:
- تقليل مستويات المخزون
- تسجيل حركة مخزون

---

## الاختبار

### 1. اختبار الوحدة (Unit Tests)

```typescript
// tests/procurement/purchase-orders.test.ts
- اختبار إنشاء طلب شراء
- اختبار تحديث طلب شراء
- اختبار حذف طلب شراء
- اختبار تغيير حالة الطلب
- اختبار الموافقة على الطلب
```

### 2. اختبار التكامل (Integration Tests)

```typescript
// tests/procurement/integration.test.ts
- اختبار دورة الشراء الكاملة
- اختبار مطابقة ثلاثية الاتجاهات
- اختبار التكامل مع الحسابات
- اختبار التكامل مع المخازن
```

### 3. اختبار الواجهة (UI Tests)

```typescript
// tests/procurement/ui.test.ts
- اختبار قائمة الطلبات
- اختبار نموذج الطلب
- اختبار البحث والتصفية
- اختبار الإجراءات السريعة
```

---

## جدول التنفيذ

### الأسبوع الأول

| اليوم | المهمة | الحالة |
|------|-------|--------|
| 1 | إنشاء جداول قاعدة البيانات | ⏳ |
| 2 | إنشاء API endpoints | ⏳ |
| 3 | إنشاء مكونات الواجهة الأساسية | ⏳ |
| 4 | التكامل مع الموردين | ⏳ |
| 5 | الاختبار الأولي | ⏳ |

### الأسبوع الثاني

| اليوم | المهمة | الحالة |
|------|-------|--------|
| 1 | التكامل مع الحسابات | ⏳ |
| 2 | التكامل مع المخازن | ⏳ |
| 3 | مطابقة ثلاثية الاتجاهات | ⏳ |
| 4 | الاختبار الشامل | ⏳ |
| 5 | التصحيح والتحسينات | ⏳ |

---

## الملفات المطلوبة

```
lib/
├── db/
│   └── schema.ts                    # تحديث الجداول
├── procurement/
│   ├── repository.ts                # دوال الوصول للبيانات
│   ├── types.ts                     # أنواع البيانات
│   └── utils.ts                     # دوال مساعدة

app/
├── api/
│   └── procurement/
│       ├── purchase-orders/
│       │   └── route.ts
│       ├── goods-receipts/
│       │   └── route.ts
│       ├── purchase-invoices/
│       │   └── route.ts
│       └── purchase-payments/
│           └── route.ts
└── (dashboard)/
    └── procurement/
        ├── page.tsx
        ├── purchase-orders/
        │   ├── page.tsx
        │   ├── [id]/
        │   │   └── page.tsx
        │   └── new/
        │       └── page.tsx
        ├── goods-receipts/
        │   ├── page.tsx
        │   ├── [id]/
        │   │   └── page.tsx
        │   └── new/
        │       └── page.tsx
        ├── purchase-invoices/
        │   ├── page.tsx
        │   ├── [id]/
        │   │   └── page.tsx
        │   └── new/
        │       └── page.tsx
        └── purchase-payments/
            ├── page.tsx
            ├── [id]/
            │   └── page.tsx
            └── new/
                └── page.tsx

components/
└── procurement/
    ├── procurement-dashboard.tsx
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
        └── matching-status-badge.tsx
```

---

**آخر تحديث**: 2025-10-24 21:55 UTC+3
**الإصدار**: v1.0
**الحالة**: 📋 قيد التخطيط
