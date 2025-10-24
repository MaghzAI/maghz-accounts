"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

interface PurchaseOrderDetail {
  id: string;
  poNumber: string;
  vendorId: string;
  warehouseId: string;
  poDate: Date;
  requiredDate?: Date;
  status: string;
  paymentTerms?: string;
  shippingMethod?: string;
  notes?: string;
  totalAmount: number;
  taxAmount: number;
  grandTotal: number;
  lines: any[];
}

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const [po, setPO] = useState<PurchaseOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    loadPO();
  }, [params.id]);

  const loadPO = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/procurement/purchase-orders/${params.id}`);
      if (!response.ok) throw new Error("Failed to load PO");

      const data = await response.json();
      setPO(data);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل تحميل طلب الشراء",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      const response = await fetch(`/api/procurement/purchase-orders/${params.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });

      if (!response.ok) throw new Error("Failed to approve PO");

      toast({
        title: "نجاح",
        description: "تم الموافقة على طلب الشراء",
      });

      loadPO();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل الموافقة على طلب الشراء",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "submitted":
        return "bg-blue-100 text-blue-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "received":
        return "bg-purple-100 text-purple-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!po) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">لم يتم العثور على طلب الشراء</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/procurement/purchase-orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{po.poNumber}</h2>
            <p className="text-muted-foreground">تفاصيل طلب الشراء</p>
          </div>
        </div>
        <Badge className={getStatusColor(po.status)}>
          {po.status}
        </Badge>
      </div>

      {/* Main Info */}
      <Card>
        <CardHeader>
          <CardTitle>المعلومات الأساسية</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">تاريخ الطلب</p>
            <p className="font-semibold">{format(new Date(po.poDate), "dd MMM yyyy")}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">التاريخ المطلوب</p>
            <p className="font-semibold">
              {po.requiredDate ? format(new Date(po.requiredDate), "dd MMM yyyy") : "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">شروط الدفع</p>
            <p className="font-semibold">{po.paymentTerms || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">طريقة الشحن</p>
            <p className="font-semibold">{po.shippingMethod || "—"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>خطوط الطلب</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left font-medium">المنتج</th>
                  <th className="p-3 text-left font-medium">الكمية</th>
                  <th className="p-3 text-left font-medium">السعر</th>
                  <th className="p-3 text-left font-medium">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {po.lines?.map((line: any) => (
                  <tr key={line.id} className="border-t">
                    <td className="p-3">{line.productId}</td>
                    <td className="p-3">{line.quantity}</td>
                    <td className="p-3">${line.unitPrice.toFixed(2)}</td>
                    <td className="p-3 font-semibold">${line.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>الملخص المالي</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>الإجمالي الفرعي:</span>
            <span className="font-semibold">${po.totalAmount?.toFixed(2) || "0.00"}</span>
          </div>
          <div className="flex justify-between">
            <span>الضريبة:</span>
            <span className="font-semibold">${po.taxAmount?.toFixed(2) || "0.00"}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-lg">
            <span>الإجمالي:</span>
            <span className="font-bold">${po.grandTotal?.toFixed(2) || "0.00"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {po.status === "submitted" && (
        <div className="flex gap-4">
          <Button onClick={handleApprove} disabled={isApproving}>
            {isApproving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            الموافقة على الطلب
          </Button>
        </div>
      )}
    </div>
  );
}
