"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GRFormProps {
  purchaseOrders: Array<{ id: string; poNumber: string }>;
  vendors: Array<{ id: string; name: string }>;
  warehouses: Array<{ id: string; name: string }>;
  products: Array<{ id: string; name: string }>;
  initialData?: any;
}

export function GRForm({
  purchaseOrders,
  vendors,
  warehouses,
  products,
  initialData,
}: GRFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    poId: initialData?.poId || "",
    vendorId: initialData?.vendorId || "",
    warehouseId: initialData?.warehouseId || "",
    grDate: initialData?.grDate || new Date().toISOString().split("T")[0],
    notes: initialData?.notes || "",
  });

  const [items, setItems] = useState(
    initialData?.items || [
      { poLineId: "", productId: "", orderedQuantity: 0, receivedQuantity: 0, unitPrice: 0 },
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
    setItems([
      ...items,
      { poLineId: "", productId: "", orderedQuantity: 0, receivedQuantity: 0, unitPrice: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/procurement/goods-receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          items,
        }),
      });

      if (!response.ok) throw new Error("Failed to create goods receipt");

      toast({
        title: "نجاح",
        description: "تم إنشاء استقبال البضائع بنجاح",
      });

      router.push("/procurement/goods-receipts");
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل إنشاء استقبال البضائع",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.receivedQuantity * item.unitPrice), 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">استقبال بضائع جديد</h2>
        <p className="text-muted-foreground">إنشاء استقبال بضائع جديد</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>المعلومات الأساسية</CardTitle>
            <CardDescription>معلومات استقبال البضائع الأساسية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">طلب الشراء</label>
                <select
                  name="poId"
                  value={formData.poId}
                  onChange={handleFormChange}
                  required
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
                <label className="text-sm font-medium">المستودع</label>
                <select
                  name="warehouseId"
                  value={formData.warehouseId}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="">اختر مستودع</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">تاريخ الاستقبال</label>
                <Input
                  type="date"
                  name="grDate"
                  value={formData.grDate}
                  onChange={handleFormChange}
                  required
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
            <CardTitle>خطوط الاستقبال</CardTitle>
            <CardDescription>أضف البضائع المستقبلة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-3 text-left font-medium">المنتج</th>
                    <th className="p-3 text-left font-medium">المطلوب</th>
                    <th className="p-3 text-left font-medium">المستقبل</th>
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
                          value={item.orderedQuantity}
                          onChange={(e) => handleItemChange(index, "orderedQuantity", parseFloat(e.target.value))}
                          className="w-full"
                          min="0"
                          step="0.01"
                          disabled
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          value={item.receivedQuantity}
                          onChange={(e) => handleItemChange(index, "receivedQuantity", parseFloat(e.target.value))}
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
                        ${(item.receivedQuantity * item.unitPrice).toFixed(2)}
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

            <div className="flex justify-between items-center">
              <Button type="button" variant="outline" onClick={addItem}>
                إضافة سطر
              </Button>
              <div className="text-lg font-semibold">
                الإجمالي: ${totalAmount.toFixed(2)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            إنشاء الاستقبال
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
