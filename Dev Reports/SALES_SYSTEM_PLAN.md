# 📋 خطة تطوير نظام المبيعات الكامل

## 🎯 المتطلبات

1. ✅ جلب الحقول الافتراضية
2. ✅ خيار نقدي/آجل
3. ✅ حالة الفاتورة (مسودة، معتمدة، ملغاة)
4. ✅ طباعة وتصدير الفاتورة
5. ✅ تعديل/حذف للمسودات فقط

---

## 📊 التصميم المقترح

### 1️⃣ Schema - جدول المبيعات

```typescript
export const sales = sqliteTable("sales", {
  id: text("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  date: integer("date", { mode: "timestamp" }).notNull(),
  customerId: text("customer_id").references(() => customers.id),
  
  // نوع الدفع
  paymentType: text("payment_type").notNull().default("cash"), // cash, credit
  dueDate: integer("due_date", { mode: "timestamp" }), // للآجل فقط
  
  // الحالة
  status: text("status").notNull().default("draft"), // draft, confirmed, cancelled
  
  // المبالغ
  subtotal: real("subtotal").notNull().default(0),
  taxAmount: real("tax_amount").notNull().default(0),
  discountAmount: real("discount_amount").notNull().default(0),
  totalAmount: real("total_amount").notNull().default(0),
  
  // الحسابات
  accountsReceivableId: text("accounts_receivable_id").references(() => accounts.id),
  salesRevenueId: text("sales_revenue_id").references(() => accounts.id),
  cashAccountId: text("cash_account_id").references(() => accounts.id),
  
  // القيد المحاسبي
  transactionId: text("transaction_id").references(() => transactions.id),
  
  // ملاحظات
  notes: text("notes"),
  
  // التتبع
  createdBy: text("created_by"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

export const saleItems = sqliteTable("sale_items", {
  id: text("id").primaryKey(),
  saleId: text("sale_id").notNull().references(() => sales.id),
  productId: text("product_id").notNull().references(() => products.id),
  warehouseId: text("warehouse_id").notNull().references(() => warehouses.id),
  
  quantity: real("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  discount: real("discount").notNull().default(0),
  tax: real("tax").notNull().default(0),
  total: real("total").notNull(),
  
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});
```

---

### 2️⃣ واجهة المبيعات المحدثة

#### الحقول الجديدة:
```typescript
const [saleForm, setSaleForm] = useState({
  date: new Date().toISOString().split('T')[0],
  invoiceNumber: "",
  customerId: "",
  
  // جديد
  paymentType: "cash", // cash | credit
  dueDate: "", // للآجل فقط
  status: "draft", // draft | confirmed | cancelled
  
  // الحسابات
  accountsReceivableId: "",
  salesRevenueId: "",
  cashAccountId: "",
  
  // المبالغ
  discountAmount: 0,
  taxAmount: 0,
  notes: "",
});
```

#### الحقول الافتراضية:
```typescript
async function loadSalesDefaults() {
  const response = await fetch("/api/default-settings?module=sales");
  if (response.ok) {
    const settings = await response.json();
    // تطبيق الإعدادات الافتراضية
    setSaleForm(prev => ({
      ...prev,
      accountsReceivableId: settings.default_ar_account,
      salesRevenueId: settings.default_sales_account,
      cashAccountId: settings.default_cash_account,
    }));
  }
}
```

---

### 3️⃣ حالات الفاتورة

```typescript
enum InvoiceStatus {
  DRAFT = "draft",       // مسودة - يمكن التعديل/الحذف
  CONFIRMED = "confirmed", // معتمدة - لا يمكن التعديل
  CANCELLED = "cancelled"  // ملغاة - soft delete
}

// الألوان
const statusColors = {
  draft: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

// الأيقونات
const statusIcons = {
  draft: <FileEdit />,
  confirmed: <CheckCircle />,
  cancelled: <XCircle />,
};
```

---

### 4️⃣ نوع الدفع

```typescript
// في النموذج
<div className="grid gap-2">
  <Label>Payment Type *</Label>
  <select
    value={saleForm.paymentType}
    onChange={(e) => {
      setSaleForm({ 
        ...saleForm, 
        paymentType: e.target.value,
        dueDate: e.target.value === "credit" ? "" : null
      });
    }}
  >
    <option value="cash">💵 Cash (نقدي)</option>
    <option value="credit">📅 Credit (آجل)</option>
  </select>
</div>

{/* إظهار تاريخ الاستحقاق للآجل فقط */}
{saleForm.paymentType === "credit" && (
  <div className="grid gap-2">
    <Label>Due Date *</Label>
    <Input
      type="date"
      value={saleForm.dueDate}
      onChange={(e) => setSaleForm({ ...saleForm, dueDate: e.target.value })}
      required
    />
  </div>
)}
```

---

### 5️⃣ الطباعة والتصدير

#### مكون الطباعة:
```typescript
// components/InvoicePrint.tsx
export function InvoicePrint({ sale, items }) {
  return (
    <div className="print:block hidden" id="invoice-print">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">SALES INVOICE</h1>
          <p className="text-gray-600">فاتورة مبيعات</p>
        </div>
        
        {/* Invoice Info */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div>
            <p><strong>Invoice #:</strong> {sale.invoiceNumber}</p>
            <p><strong>Date:</strong> {formatDate(sale.date)}</p>
            <p><strong>Customer:</strong> {sale.customerName}</p>
          </div>
          <div className="text-right">
            <p><strong>Payment:</strong> {sale.paymentType}</p>
            {sale.dueDate && (
              <p><strong>Due Date:</strong> {formatDate(sale.dueDate)}</p>
            )}
            <p><strong>Status:</strong> {sale.status}</p>
          </div>
        </div>
        
        {/* Items Table */}
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2">
              <th>Product</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td>{item.productName}</td>
                <td>{item.quantity}</td>
                <td>{formatCurrency(item.unitPrice)}</td>
                <td>{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Totals */}
        <div className="text-right">
          <p>Subtotal: {formatCurrency(sale.subtotal)}</p>
          <p>Tax: {formatCurrency(sale.taxAmount)}</p>
          <p>Discount: {formatCurrency(sale.discountAmount)}</p>
          <p className="text-xl font-bold">
            Total: {formatCurrency(sale.totalAmount)}
          </p>
        </div>
      </div>
    </div>
  );
}

// دالة الطباعة
function handlePrint(saleId: string) {
  window.print();
}

// دالة التصدير PDF
async function handleExportPDF(saleId: string) {
  // استخدام html2pdf أو jsPDF
  const element = document.getElementById('invoice-print');
  const opt = {
    margin: 1,
    filename: `invoice-${saleId}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };
  
  html2pdf().set(opt).from(element).save();
}
```

---

### 6️⃣ التعديل والحذف

```typescript
// في جدول المبيعات
{sales.map((sale) => (
  <tr key={sale.id}>
    <td>{sale.invoiceNumber}</td>
    <td>{formatDate(sale.date)}</td>
    <td>{sale.customerName}</td>
    <td>
      <span className={statusColors[sale.status]}>
        {sale.status}
      </span>
    </td>
    <td>{formatCurrency(sale.totalAmount)}</td>
    <td>
      <div className="flex gap-2">
        {/* عرض */}
        <Button size="sm" onClick={() => viewSale(sale.id)}>
          <Eye className="h-4 w-4" />
        </Button>
        
        {/* طباعة */}
        <Button size="sm" onClick={() => handlePrint(sale.id)}>
          <Printer className="h-4 w-4" />
        </Button>
        
        {/* تصدير */}
        <Button size="sm" onClick={() => handleExportPDF(sale.id)}>
          <Download className="h-4 w-4" />
        </Button>
        
        {/* تعديل - فقط للمسودات */}
        {sale.status === "draft" && (
          <Button size="sm" onClick={() => editSale(sale.id)}>
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        
        {/* حذف - فقط للمسودات */}
        {sale.status === "draft" && (
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => deleteSale(sale.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </td>
  </tr>
))}
```

---

## 🔄 سير العمل (Workflow)

### إنشاء فاتورة جديدة:
```
1. اضغط "New Sale"
2. املأ البيانات:
   - العميل
   - نوع الدفع (نقدي/آجل)
   - تاريخ الاستحقاق (إذا آجل)
   - المنتجات
3. احفظ كـ "Draft"
4. راجع الفاتورة
5. اعتمد "Confirm" ← يُنشئ قيد محاسبي
```

### تعديل مسودة:
```
1. ابحث عن فاتورة بحالة "Draft"
2. اضغط ✏️ Edit
3. عدّل البيانات
4. احفظ
```

### حذف مسودة:
```
1. ابحث عن فاتورة بحالة "Draft"
2. اضغط 🗑️ Delete
3. تأكيد الحذف
4. Soft delete (deletedAt)
```

### طباعة:
```
1. اضغط 🖨️ Print
2. معاينة الطباعة
3. طباعة أو حفظ PDF
```

---

## 📁 الملفات المطلوبة

### Schema:
- ✅ `lib/db/schema.ts` - إضافة جداول sales و saleItems

### API:
- ✅ `app/api/sales/route.ts` - GET, POST
- ✅ `app/api/sales/[id]/route.ts` - GET, PATCH, DELETE
- ✅ `app/api/sales/[id]/confirm/route.ts` - تأكيد الفاتورة
- ✅ `app/api/sales/[id]/cancel/route.ts` - إلغاء الفاتورة

### Components:
- ✅ `components/InvoicePrint.tsx` - مكون الطباعة
- ✅ `app/(dashboard)/sales/page.tsx` - الواجهة الرئيسية

### Utilities:
- ✅ `lib/pdf-export.ts` - تصدير PDF

---

## 🎨 التصميم المرئي

### بطاقات الإحصائيات:
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Total Sales  │ Cash Sales   │ Credit Sales │ Pending      │
│ $50,000      │ $30,000      │ $20,000      │ 5 invoices   │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

### جدول المبيعات:
```
┌────────┬────────┬──────────┬────────┬────────┬─────────────────┐
│ Invoice│ Date   │ Customer │ Type   │ Amount │ Actions         │
├────────┼────────┼──────────┼────────┼────────┼─────────────────┤
│ INV-001│ Jan 01 │ John Doe │ 💵 Cash│ $1,000 │ 👁️ 🖨️ 📥 ✏️ 🗑️│
│ INV-002│ Jan 02 │ Jane S.  │ 📅 Cred│ $2,000 │ 👁️ 🖨️ 📥       │
└────────┴────────┴──────────┴────────┴────────┴─────────────────┘
```

---

## ⏱️ التقدير الزمني

| المهمة | الوقت المقدر |
|--------|--------------|
| Schema + Migration | 30 دقيقة |
| API Endpoints | 1 ساعة |
| واجهة المبيعات | 1.5 ساعة |
| مكون الطباعة | 45 دقيقة |
| التصدير PDF | 30 دقيقة |
| الاختبار | 30 دقيقة |
| **المجموع** | **~4.5 ساعة** |

---

## 🚀 الخطوات التالية

1. ✅ إنشاء Schema
2. ✅ إنشاء Migration
3. ✅ إنشاء API Endpoints
4. ✅ تحديث واجهة المبيعات
5. ✅ إضافة مكون الطباعة
6. ✅ إضافة التصدير
7. ✅ الاختبار

---

**هل تريد أن أبدأ التنفيذ الآن؟**
