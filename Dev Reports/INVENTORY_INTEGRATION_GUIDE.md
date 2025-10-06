# 🔗 دليل تكامل المخزون مع المعاملات المالية

**التاريخ**: 2025-10-01  
**الحالة**: ✅ مفعّل ويعمل

---

## 📊 نظرة عامة

تم تفعيل التكامل الكامل بين نظام المخزون والمعاملات المالية. الآن عند إنشاء معاملة شراء أو بيع، يتم تلقائياً:
1. تحديث مستويات المخزون
2. إنشاء حركة مخزون
3. إنشاء القيود المحاسبية المناسبة (COGS للمبيعات)

---

## 🔌 كيفية الاستخدام

### 1. إنشاء معاملة شراء مع مخزون

```typescript
POST /api/transactions

{
  "date": "2025-01-15",
  "description": "شراء أجهزة كمبيوتر",
  "reference": "PO-001",
  "type": "expense",
  "vendorId": "vendor-uuid",
  "lines": [
    {
      "accountId": "inventory-account-id",  // حساب المخزون (1300)
      "debit": 5000,
      "credit": 0,
      "description": "10 أجهزة كمبيوتر @ $500"
    },
    {
      "accountId": "cash-account-id",  // حساب النقدية (1100)
      "debit": 0,
      "credit": 5000,
      "description": "دفع نقدي"
    }
  ],
  
  // ⭐ الجزء الجديد: بيانات المخزون
  "inventoryItems": [
    {
      "productId": "product-uuid",
      "warehouseId": "warehouse-uuid",
      "quantity": 10,
      "unitCost": 500
    }
  ]
}
```

**ما يحدث تلقائياً:**
1. ✅ تُنشأ المعاملة المالية
2. ✅ تُنشأ حركة مخزون (type: purchase)
3. ✅ يُحدّث مستوى المخزون (+10 units)
4. ✅ يُحسب متوسط التكلفة الجديد

---

### 2. إنشاء معاملة بيع مع مخزون

```typescript
POST /api/transactions

{
  "date": "2025-01-20",
  "description": "بيع أجهزة كمبيوتر",
  "reference": "INV-001",
  "type": "invoice",
  "customerId": "customer-uuid",
  "lines": [
    {
      "accountId": "accounts-receivable-id",  // حساب المدينون (1200)
      "debit": 2400,
      "credit": 0,
      "description": "3 أجهزة كمبيوتر @ $800"
    },
    {
      "accountId": "sales-revenue-id",  // حساب الإيرادات (4000)
      "debit": 0,
      "credit": 2400,
      "description": "إيراد المبيعات"
    }
  ],
  
  // ⭐ بيانات المخزون
  "inventoryItems": [
    {
      "productId": "product-uuid",
      "warehouseId": "warehouse-uuid",
      "quantity": 3,
      "unitCost": 0  // سيتم حسابه تلقائياً من متوسط التكلفة
    }
  ]
}
```

**ما يحدث تلقائياً:**
1. ✅ تُنشأ المعاملة المالية (الإيراد)
2. ✅ تُنشأ حركة مخزون (type: sale)
3. ✅ يُحدّث مستوى المخزون (-3 units)
4. ✅ **تُنشأ قيود COGS تلقائياً:**
   ```
   Debit:  COGS (Expense)        $1,500
   Credit: Inventory (Asset)     $1,500
   ```

---

## 📋 أمثلة عملية

### مثال 1: شراء بضائع

```json
{
  "date": "2025-02-01",
  "description": "شراء قطع غيار",
  "type": "expense",
  "vendorId": "vendor-123",
  "lines": [
    {
      "accountId": "1300",  // Inventory
      "debit": 10000,
      "credit": 0
    },
    {
      "accountId": "2100",  // Accounts Payable
      "debit": 0,
      "credit": 10000
    }
  ],
  "inventoryItems": [
    {
      "productId": "prod-001",
      "warehouseId": "wh-main",
      "quantity": 100,
      "unitCost": 100
    }
  ]
}
```

**النتيجة:**
```
المخزون:
  قبل: 0 units
  بعد: 100 units @ $100 = $10,000

القيود:
  Debit:  Inventory (1300)           $10,000
  Credit: Accounts Payable (2100)    $10,000
```

---

### مثال 2: بيع بضائع

```json
{
  "date": "2025-02-15",
  "description": "بيع قطع غيار",
  "type": "invoice",
  "customerId": "cust-456",
  "lines": [
    {
      "accountId": "1200",  // Accounts Receivable
      "debit": 6000,
      "credit": 0
    },
    {
      "accountId": "4000",  // Sales Revenue
      "debit": 0,
      "credit": 6000
    }
  ],
  "inventoryItems": [
    {
      "productId": "prod-001",
      "warehouseId": "wh-main",
      "quantity": 40,
      "unitCost": 0  // يُحسب تلقائياً
    }
  ]
}
```

**النتيجة:**
```
المخزون:
  قبل: 100 units @ $100 = $10,000
  بعد: 60 units @ $100 = $6,000

القيود (تلقائياً):
  1. قيد الإيراد:
     Debit:  Accounts Receivable (1200)  $6,000
     Credit: Sales Revenue (4000)         $6,000
  
  2. قيد التكلفة (تلقائي):
     Debit:  COGS (5100)                  $4,000
     Credit: Inventory (1300)             $4,000

الربح الإجمالي:
  Revenue: $6,000
  COGS: $4,000
  Gross Profit: $2,000 (33.3%)
```

---

## 🎯 حالات الاستخدام

### حالة 1: شركة تجارية

```javascript
// شراء بضائع
await fetch('/api/transactions', {
  method: 'POST',
  body: JSON.stringify({
    type: 'expense',
    description: 'شراء بضائع للبيع',
    lines: [...],
    inventoryItems: [
      { productId: 'prod-1', warehouseId: 'wh-1', quantity: 50, unitCost: 20 }
    ]
  })
});

// بيع بضائع
await fetch('/api/transactions', {
  method: 'POST',
  body: JSON.stringify({
    type: 'invoice',
    description: 'بيع بضائع',
    lines: [...],
    inventoryItems: [
      { productId: 'prod-1', warehouseId: 'wh-1', quantity: 30, unitCost: 0 }
    ]
  })
});
```

---

### حالة 2: مخازن متعددة

```javascript
// شراء وتوزيع على مخازن
// المخزن الرئيسي
await createPurchase({
  inventoryItems: [
    { productId: 'prod-1', warehouseId: 'wh-main', quantity: 100, unitCost: 50 }
  ]
});

// تحويل إلى فرع
await createTransfer({
  from: 'wh-main',
  to: 'wh-branch1',
  productId: 'prod-1',
  quantity: 30
});

// بيع من الفرع
await createSale({
  inventoryItems: [
    { productId: 'prod-1', warehouseId: 'wh-branch1', quantity: 20, unitCost: 0 }
  ]
});
```

---

## ⚠️ معالجة الأخطاء

### خطأ: مخزون غير كافٍ

```json
Response (400):
{
  "error": "Insufficient stock. Available: 10, Required: 15"
}
```

**الحل:**
- تحقق من مستوى المخزون قبل البيع
- أو قم بشراء المزيد أولاً

---

### خطأ: منتج غير موجود

```json
Response (400):
{
  "error": "Product not found"
}
```

**الحل:**
- تأكد من وجود المنتج في قاعدة البيانات
- استخدم `/api/products` للتحقق

---

### تحذير: فشل تحديث المخزون

```json
Response (201):
{
  "transaction": {...},
  "lines": [...],
  "warning": "Transaction created but inventory update failed",
  "inventoryError": "No stock found for product..."
}
```

**ما يحدث:**
- المعاملة المالية تم إنشاؤها ✅
- لكن المخزون لم يُحدّث ❌
- يجب تصحيح المخزون يدوياً

---

## 🔍 التحقق من التكامل

### 1. التحقق من حركات المخزون

```sql
SELECT * FROM inventory_transactions 
WHERE transaction_id = 'your-transaction-id';
```

### 2. التحقق من مستويات المخزون

```sql
SELECT * FROM stock_levels 
WHERE product_id = 'your-product-id';
```

### 3. التحقق من القيود المحاسبية

```sql
SELECT * FROM transaction_lines 
WHERE transaction_id = 'your-transaction-id';
```

---

## 📊 التأثير على التقارير

### Balance Sheet

```
Assets:
  Current Assets:
    Cash: $50,000
    Accounts Receivable: $30,000
    Inventory: $15,000  ← يتحدث تلقائياً
    
Total Assets: $95,000
```

### Income Statement

```
Revenue:
  Sales Revenue: $100,000

Cost of Goods Sold:  ← يُحسب تلقائياً
  COGS: $60,000

Gross Profit: $40,000  (40%)

Operating Expenses:
  Salaries: $15,000
  Rent: $5,000
  
Net Income: $20,000
```

---

## 🎓 أفضل الممارسات

### 1. دائماً أرسل بيانات المخزون مع المعاملات

```javascript
// ✅ صحيح
{
  type: 'invoice',
  lines: [...],
  inventoryItems: [...]  // موجود
}

// ❌ خطأ (لن يتحدث المخزون)
{
  type: 'invoice',
  lines: [...]  // inventoryItems مفقود
}
```

### 2. تحقق من المخزون قبل البيع

```javascript
// التحقق من المخزون
const stock = await checkStockAvailability(productId, warehouseId, quantity);
if (!stock.available) {
  alert(`مخزون غير كافٍ. المتاح: ${stock.currentStock}`);
  return;
}

// ثم أنشئ المعاملة
await createSaleTransaction({...});
```

### 3. استخدم reference للربط

```javascript
{
  reference: 'PO-2025-001',  // رقم أمر الشراء
  inventoryItems: [...]
}
```

---

## 🚀 الخطوات التالية

### Phase 1: واجهة المستخدم
- [ ] نموذج شراء مع اختيار منتجات
- [ ] نموذج بيع مع اختيار منتجات
- [ ] عرض مستوى المخزون عند الاختيار
- [ ] تنبيه عند نقص المخزون

### Phase 2: تقارير
- [ ] تقرير حركات المخزون
- [ ] تقرير COGS التفصيلي
- [ ] تقرير الربحية بالمنتج
- [ ] تقرير المخزون البطيء

### Phase 3: ميزات متقدمة
- [ ] Barcode scanning
- [ ] Serial number tracking
- [ ] Batch/Lot tracking
- [ ] Expiry date management

---

## ✅ الخلاصة

**التكامل مفعّل ويعمل!** 🎉

- ✅ المشتريات تحدث المخزون تلقائياً
- ✅ المبيعات تحدث المخزون وتنشئ COGS
- ✅ متوسط التكلفة يُحسب تلقائياً
- ✅ القيود المحاسبية تُنشأ تلقائياً
- ✅ التقارير تتأثر فوراً

**كل ما تحتاجه:** إرسال `inventoryItems` مع المعاملة!

---

**تاريخ التفعيل**: 2025-10-01  
**الحالة**: ✅ Production Ready  
**التوثيق**: كامل
