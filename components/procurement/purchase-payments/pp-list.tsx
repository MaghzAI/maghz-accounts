"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Eye, Edit2, Trash2 } from "lucide-react";
import Link from "next/link";

interface PurchasePayment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  vendorId: string;
  paymentDate: Date;
  paymentMethod: string;
  amount: number;
  status: string;
  createdAt: Date;
}

export function PPList() {
  const [payments, setPayments] = useState<PurchasePayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const loadPayments = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/procurement/purchase-payments?${params}`);
      if (!response.ok) throw new Error("Failed to load payments");

      const data = await response.json();
      setPayments(data);
    } catch (error) {
      console.error("Error loading payments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPayments = payments.filter((payment) =>
    payment.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "processed":
        return "bg-blue-100 text-blue-800";
      case "cleared":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "cash":
        return "bg-green-50 text-green-700";
      case "check":
        return "bg-blue-50 text-blue-700";
      case "bank_transfer":
        return "bg-purple-50 text-purple-700";
      case "credit_card":
        return "bg-yellow-50 text-yellow-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">المدفوعات</h2>
          <p className="text-muted-foreground">إدارة جميع مدفوعات الموردين</p>
        </div>
        <Link href="/procurement/purchase-payments/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            مدفوعة جديدة
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة المدفوعات</CardTitle>
          <CardDescription>عرض وإدارة جميع مدفوعات الموردين</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <Input
              placeholder="ابحث عن رقم المدفوعة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="all">جميع الحالات</option>
              <option value="draft">مسودة</option>
              <option value="processed">معالجة</option>
              <option value="cleared">مسحوبة</option>
              <option value="cancelled">ملغاة</option>
            </select>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">لا توجد مدفوعات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-3 text-left font-medium">رقم المدفوعة</th>
                    <th className="p-3 text-left font-medium">التاريخ</th>
                    <th className="p-3 text-left font-medium">الطريقة</th>
                    <th className="p-3 text-left font-medium">المبلغ</th>
                    <th className="p-3 text-left font-medium">الحالة</th>
                    <th className="p-3 text-left font-medium">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-t hover:bg-muted/50">
                      <td className="p-3 font-semibold">{payment.paymentNumber}</td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {format(new Date(payment.paymentDate), "dd MMM yyyy")}
                      </td>
                      <td className="p-3">
                        <Badge className={getMethodColor(payment.paymentMethod)}>
                          {payment.paymentMethod}
                        </Badge>
                      </td>
                      <td className="p-3 font-semibold">
                        ${payment.amount?.toFixed(2) || "0.00"}
                      </td>
                      <td className="p-3">
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Link href={`/procurement/purchase-payments/${payment.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/procurement/purchase-payments/${payment.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
