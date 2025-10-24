"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Eye, Edit2, Trash2 } from "lucide-react";
import Link from "next/link";

interface GoodsReceipt {
  id: string;
  grNumber: string;
  poId: string;
  vendorId: string;
  warehouseId: string;
  grDate: Date;
  status: string;
  totalQuantity: number;
  totalAmount: number;
  createdAt: Date;
}

export function GRList() {
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadReceipts();
  }, [statusFilter]);

  const loadReceipts = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/procurement/goods-receipts?${params}`);
      if (!response.ok) throw new Error("Failed to load receipts");

      const data = await response.json();
      setReceipts(data);
    } catch (error) {
      console.error("Error loading receipts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReceipts = receipts.filter((receipt) =>
    receipt.grNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "received":
        return "bg-blue-100 text-blue-800";
      case "inspected":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">استقبالات البضائع</h2>
          <p className="text-muted-foreground">إدارة جميع استقبالات البضائع</p>
        </div>
        <Link href="/procurement/goods-receipts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            استقبال جديد
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الاستقبالات</CardTitle>
          <CardDescription>عرض وإدارة جميع استقبالات البضائع</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <Input
              placeholder="ابحث عن رقم الاستقبال..."
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
              <option value="received">مستلم</option>
              <option value="inspected">مفتش</option>
              <option value="accepted">مقبول</option>
              <option value="rejected">مرفوض</option>
            </select>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredReceipts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">لا توجد استقبالات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-3 text-left font-medium">رقم الاستقبال</th>
                    <th className="p-3 text-left font-medium">التاريخ</th>
                    <th className="p-3 text-left font-medium">الحالة</th>
                    <th className="p-3 text-left font-medium">الكمية</th>
                    <th className="p-3 text-left font-medium">المبلغ</th>
                    <th className="p-3 text-left font-medium">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReceipts.map((receipt) => (
                    <tr key={receipt.id} className="border-t hover:bg-muted/50">
                      <td className="p-3 font-semibold">{receipt.grNumber}</td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {format(new Date(receipt.grDate), "dd MMM yyyy")}
                      </td>
                      <td className="p-3">
                        <Badge className={getStatusColor(receipt.status)}>
                          {receipt.status}
                        </Badge>
                      </td>
                      <td className="p-3">{receipt.totalQuantity}</td>
                      <td className="p-3 font-semibold">
                        ${receipt.totalAmount?.toFixed(2) || "0.00"}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Link href={`/procurement/goods-receipts/${receipt.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/procurement/goods-receipts/${receipt.id}/edit`}>
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
