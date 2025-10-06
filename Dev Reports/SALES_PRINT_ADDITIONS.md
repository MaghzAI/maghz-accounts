# إضافات الطباعة والتصدير لصفحة المبيعات

## 1. إضافة Imports في أعلى الملف

```typescript
// أضف هذا السطر بعد الـ imports الموجودة
import { InvoicePrint } from "@/components/InvoicePrint";
```

## 2. إضافة State للطباعة

```typescript
// أضف هذه الـ states بعد const [editingSale, setEditingSale]
const [viewingSale, setViewingSale] = useState<any>(null);
const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
const [isPrinting, setIsPrinting] = useState(false);
```

## 3. إضافة دالة جلب تفاصيل الفاتورة

```typescript
// أضف هذه الدالة بعد fetchData()
async function fetchSaleDetails(id: string) {
  try {
    const response = await fetch(`/api/sales/${id}`);
    if (response.ok) {
      const data = await response.json();
      return data;
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch sale details:", error);
    return null;
  }
}
```

## 4. إضافة دالة العرض

```typescript
// أضف هذه الدالة بعد handleDeleteSale
async function handleViewSale(id: string) {
  const saleDetails = await fetchSaleDetails(id);
  if (saleDetails) {
    setViewingSale(saleDetails);
    setIsViewDialogOpen(true);
  } else {
    toast({
      title: "Error",
      description: "Failed to load sale details",
      variant: "destructive",
    });
  }
}
```

## 5. إضافة دالة الطباعة

```typescript
// أضف هذه الدالة بعد handleViewSale
async function handlePrint(id: string) {
  setIsPrinting(true);
  const saleDetails = await fetchSaleDetails(id);
  
  if (saleDetails) {
    setViewingSale(saleDetails);
    
    // انتظر قليلاً حتى يتم تحميل المكون
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  } else {
    setIsPrinting(false);
    toast({
      title: "Error",
      description: "Failed to load invoice for printing",
      variant: "destructive",
    });
  }
}
```

## 6. إضافة دالة التصدير PDF

```typescript
// أضف هذه الدالة بعد handlePrint
async function handleExportPDF(id: string) {
  const saleDetails = await fetchSaleDetails(id);
  
  if (!saleDetails) {
    toast({
      title: "Error",
      description: "Failed to load invoice",
      variant: "destructive",
    });
    return;
  }

  try {
    // استخدام html2canvas و jsPDF
    const element = document.getElementById('invoice-print');
    if (!element) return;

    // عرض العنصر مؤقتاً
    setViewingSale(saleDetails);
    element.style.display = 'block';

    // استخدام html2pdf إذا كان متاحاً
    if (typeof window !== 'undefined' && (window as any).html2pdf) {
      const opt = {
        margin: 10,
        filename: `invoice-${saleDetails.invoiceNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await (window as any).html2pdf().set(opt).from(element).save();
      
      toast({
        title: "Success",
        description: "Invoice exported successfully",
      });
    } else {
      // Fallback: فتح نافذة الطباعة
      window.print();
    }

    // إخفاء العنصر
    element.style.display = 'none';
  } catch (error) {
    console.error("Export failed:", error);
    toast({
      title: "Error",
      description: "Failed to export PDF",
      variant: "destructive",
    });
  }
}
```

## 7. تحديث أزرار Actions في الجدول

استبدل الأزرار الموجودة بهذا:

```typescript
<td className="p-3 text-center">
  <div className="flex items-center justify-center gap-1">
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={() => handleViewSale(sale.id)}
      title="View"
    >
      <Eye className="h-4 w-4" />
    </Button>
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={() => handlePrint(sale.id)}
      disabled={isPrinting}
      title="Print"
    >
      <Printer className="h-4 w-4" />
    </Button>
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={() => handleExportPDF(sale.id)}
      title="Export PDF"
    >
      <Download className="h-4 w-4" />
    </Button>
    {sale.status === "draft" && (
      <>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => handleConfirmSale(sale.id)}
          title="Confirm"
        >
          <CheckCircle className="h-4 w-4 text-green-600" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => handleDeleteSale(sale.id)}
          title="Delete"
        >
          <Trash2 className="h-4 w-4 text-red-600" />
        </Button>
      </>
    )}
  </div>
</td>
```

## 8. إضافة Dialog العرض

أضف هذا قبل `</div>` الأخير في الـ return:

```typescript
{/* View Sale Dialog */}
<Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Invoice Details</DialogTitle>
      <DialogDescription>
        {viewingSale?.invoiceNumber} - {viewingSale?.customerName || "Walk-in"}
      </DialogDescription>
    </DialogHeader>
    {viewingSale && (
      <div className="space-y-4">
        {/* Invoice Info */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Invoice Number</p>
            <p className="font-mono font-semibold">{viewingSale.invoiceNumber}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Date</p>
            <p className="font-semibold">{formatDate(viewingSale.date)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Payment Type</p>
            <p className="font-semibold">
              {viewingSale.paymentType === "cash" ? "💵 Cash" : "📅 Credit"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusColors[viewingSale.status]}`}>
              {viewingSale.status}
            </span>
          </div>
        </div>

        {/* Items */}
        <div>
          <h3 className="font-semibold mb-2">Items</h3>
          <div className="border rounded-md">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-2 text-left text-sm">Product</th>
                  <th className="p-2 text-right text-sm">Qty</th>
                  <th className="p-2 text-right text-sm">Price</th>
                  <th className="p-2 text-right text-sm">Total</th>
                </tr>
              </thead>
              <tbody>
                {viewingSale.items?.map((item: any, index: number) => (
                  <tr key={index} className="border-b">
                    <td className="p-2 text-sm">{item.productName}</td>
                    <td className="p-2 text-right text-sm">{item.quantity}</td>
                    <td className="p-2 text-right text-sm">{formatCurrency(item.unitPrice)}</td>
                    <td className="p-2 text-right text-sm font-medium">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span className="font-medium">{formatCurrency(viewingSale.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Discount:</span>
              <span className="font-medium">-{formatCurrency(viewingSale.discountAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax:</span>
              <span className="font-medium">{formatCurrency(viewingSale.taxAmount)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>{formatCurrency(viewingSale.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => handlePrint(viewingSale.id)}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleExportPDF(viewingSale.id)}
          >
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button onClick={() => setIsViewDialogOpen(false)}>
            Close
          </Button>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>

{/* Invoice Print Component */}
{viewingSale && (
  <InvoicePrint
    sale={viewingSale}
    items={viewingSale.items || []}
  />
)}
```

## 9. (اختياري) إضافة مكتبة html2pdf

أضف في `app/layout.tsx` أو في `<head>`:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
```

أو استخدم npm:

```bash
npm install html2pdf.js
```

---

## ملخص التغييرات:

1. ✅ إضافة مكون InvoicePrint
2. ✅ دالة handleViewSale - عرض التفاصيل
3. ✅ دالة handlePrint - الطباعة
4. ✅ دالة handleExportPDF - التصدير
5. ✅ Dialog العرض
6. ✅ تحديث الأزرار

---

**بعد تطبيق هذه التغييرات، ستكون جميع الميزات جاهزة!** 🎉
