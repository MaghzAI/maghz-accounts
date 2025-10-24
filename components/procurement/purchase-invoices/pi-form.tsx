"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PIFormProps {
  vendors: Array<{ id: string; name: string }>;
  purchaseOrders: Array<{ id: string; poNumber: string }>;
  goodsReceipts: Array<{ id: string; grNumber: string }>;
  products: Array<{ id: string; name: string }>;
  initialData?: any;
}

export function PIForm({
  vendors,
  purchaseOrders,
  goodsReceipts,
  products,
  initialData,
}: PIFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    vendorId: initialData?.vendorId || "",
    poId: initialData?.poId || "",
    grId: initialData?.grId || "",
    invoiceDate: initialData?.invoiceDate || new Date().toISOString().split("T")[0],
    dueDate: initialData?.dueDate || "",
    vendorInvoiceNumber: initialData?.vendorInvoiceNumber || "",
    subtotal: initialData?.subtotal || 0,
    taxAmount: initialData?.taxAmount || 0,
    discountAmount: initialData?.discountAmount || 0,
    notes: initialData?.notes || "",
  });

  const [items, setItems] = useState(
    initialData?.items || [
      { productId: "", quantity: 0, unitPrice: 0 },
    ]
  );

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { productId: "", quantity: 0, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const totalAmount = parseFloat(formData.subtotal) + parseFloat(formData.taxAmount) - parseFloat(formData.discountAmount);

      const response = await fetch("/api/procurement/purchase-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          totalAmount,
          items,
        }),
      });

      if (!response.ok) throw new Error("Failed to create invoice");

      toast({
        title: "نجاح",
        description: "تم إنشاء الفاتورة بنجاح",
      });

      router.push("/procurement/purchase-invoices");
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل إنشاء الفاتورة",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const totalAmount = subtotal + parseFloat(formData.taxAmount) - parseFloat(formData.discountAmount);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">فاتورة جديدة</h2>
        <p className="text-muted-foreground">إنشاء فاتورة موردين جديدة</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>المعلومات الأساسية</CardTitle>
            <CardDescription>معلومات الفاتورة الأساسية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">الموردين</label>
                <select
                  name="vendorId"
                  value={formData.vendorId}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="">اختر موردين</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">طلب الشراء</label>
                <select
                  name="poId"
                  value={formData.poId}
                  onChange={handleFormChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="">اختر طلب شراء</option>
                  {purchaseOrders.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.poNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">استقبال البضائع</label>
                <select
                  name="grId"
                  value={formData.grId}
                  onChange={handleFormChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="">اختر استقبال</option>
                  {goodsReceipts.map((gr) => (
                    <option key={gr.id} value={gr.id}>
                      {gr.grNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">رقم فاتورة الموردين</label>
                <Input
                  name="vendorInvoiceNumber"
                  value={formData.vendorInvoiceNumber}
                  onChange={handleFormChange}
                  placeholder="رقم الفاتورة من الموردين"
                />
              </div>

              <div>
                <label className="text-sm font-medium">تاريخ الفاتورة</label>
                <Input
                  type="date"
                  name="invoiceDate"
                  value={formData.invoiceDate}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">تاريخ الاستحقاق</label>
                <Input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleFormChange}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">ملاحظات</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle>خطوط الفاتورة</CardTitle>
            <CardDescription>أضف بنود الفاتورة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-3 text-left font-medium">المنتج</th>
                    <th className="p-3 text-left font-medium">الكمية</th>
                    <th className="p-3 text-left font-medium">السعر</th>
                    <th className="p-3 text-left font-medium">الإجمالي</th>
                    <th className="p-3 text-left font-medium">الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-3">
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(index, "productId", e.target.value)}
                          className="w-full rounded-md border border-input bg-background px-2 py-1"
                        >
                          <option value="">اختر منتج</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", parseFloat(e.target.value))}
                          className="w-full"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, "unitPrice", parseFloat(e.target.value))}
                          className="w-full"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="p-3 font-semibold">
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                      </td>
                      <td className="p-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          حذف
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button type="button" variant="outline" onClick={addItem}>
              إضافة سطر
            </Button>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle>الملخص المالي</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">الإجمالي الفرعي</label>
                <Input
                  type="number"
                  value={subtotal}
                  disabled
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium">الضريبة</label>
                <Input
                  type="number"
                  name="taxAmount"
                  value={formData.taxAmount}
                  onChange={handleFormChange}
                  className="w-full"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="text-sm font-medium">الخصم</label>
                <Input
                  type="number"
                  name="discountAmount"
                  value={formData.discountAmount}
                  onChange={handleFormChange}
                  className="w-full"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="text-sm font-medium">الإجمالي</label>
                <Input
                  type="number"
                  value={totalAmount}
                  disabled
                  className="w-full font-bold"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            إنشاء الفاتورة
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            إلغاء
          </Button>
        </div>
      </form>
    </div>
  );
}
