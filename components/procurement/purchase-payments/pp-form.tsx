"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PPFormProps {
  invoices: Array<{ id: string; invoiceNumber: string; totalAmount: number }>;
  vendors: Array<{ id: string; name: string }>;
  initialData?: Record<string, unknown>;
}

export function PPForm({ invoices, vendors, initialData }: PPFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    invoiceId: initialData?.invoiceId || "",
    vendorId: initialData?.vendorId || "",
    paymentDate: initialData?.paymentDate || new Date().toISOString().split("T")[0],
    paymentMethod: initialData?.paymentMethod || "bank_transfer",
    amount: initialData?.amount || 0,
    reference: initialData?.reference || "",
    notes: initialData?.notes || "",
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/procurement/purchase-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to create payment");

      toast({
        title: "نجاح",
        description: "تم إنشاء المدفوعة بنجاح",
      });

      router.push("/procurement/purchase-payments");
    } catch {
      toast({
        title: "خطأ",
        description: "فشل إنشاء المدفوعة",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedInvoice = invoices.find((inv) => inv.id === formData.invoiceId);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">مدفوعة جديدة</h2>
        <p className="text-muted-foreground">إنشاء مدفوعة جديدة للموردين</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات المدفوعة</CardTitle>
            <CardDescription>معلومات المدفوعة الأساسية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">الفاتورة</label>
                <select
                  name="invoiceId"
                  value={formData.invoiceId}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="">اختر فاتورة</option>
                  {invoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      {invoice.invoiceNumber} - ${invoice.totalAmount.toFixed(2)}
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
                <label className="text-sm font-medium">تاريخ الدفع</label>
                <Input
                  type="date"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">طريقة الدفع</label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="cash">نقدي</option>
                  <option value="check">شيك</option>
                  <option value="bank_transfer">تحويل بنكي</option>
                  <option value="credit_card">بطاقة ائتمان</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">المبلغ</label>
                <Input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleFormChange}
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="text-sm font-medium">المرجع</label>
                <Input
                  name="reference"
                  value={formData.reference}
                  onChange={handleFormChange}
                  placeholder="رقم الشيك أو رقم التحويل"
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

        {/* Summary */}
        {selectedInvoice && (
          <Card>
            <CardHeader>
              <CardTitle>ملخص الفاتورة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>رقم الفاتورة:</span>
                <span className="font-semibold">{selectedInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>المبلغ الكلي:</span>
                <span className="font-semibold">${selectedInvoice.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>المبلغ المدفوع:</span>
                <span className="font-bold">${formData.amount}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            إنشاء المدفوعة
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
