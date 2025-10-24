"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Eye, Edit2, Trash2 } from "lucide-react";
import Link from "next/link";

interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  warehouseId: string;
  poDate: Date;
  status: string;
  totalAmount: number;
  grandTotal: number;
  createdAt: Date;
}

export function POList() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/procurement/purchase-orders?${params}`);
      if (!response.ok) throw new Error("Failed to load orders");

      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) =>
    order.poNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">طلبات الشراء</h2>
          <p className="text-muted-foreground">إدارة جميع طلبات الشراء</p>
        </div>
        <Link href="/procurement/purchase-orders/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            طلب جديد
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الطلبات</CardTitle>
          <CardDescription>عرض وإدارة جميع طلبات الشراء</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <Input
              placeholder="ابحث عن رقم الطلب..."
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
              <option value="submitted">مرسل</option>
              <option value="approved">موافق</option>
              <option value="received">مستلم</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">لا توجد طلبات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-3 text-left font-medium">رقم الطلب</th>
                    <th className="p-3 text-left font-medium">التاريخ</th>
                    <th className="p-3 text-left font-medium">الحالة</th>
                    <th className="p-3 text-left font-medium">المبلغ</th>
                    <th className="p-3 text-left font-medium">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-t hover:bg-muted/50">
                      <td className="p-3 font-semibold">{order.poNumber}</td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {format(new Date(order.poDate), "dd MMM yyyy")}
                      </td>
                      <td className="p-3">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="p-3 font-semibold">
                        ${order.grandTotal?.toFixed(2) || "0.00"}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Link href={`/procurement/purchase-orders/${order.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/procurement/purchase-orders/${order.id}/edit`}>
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
