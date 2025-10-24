"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShoppingCart, Package, FileText, CreditCard } from "lucide-react";

interface DashboardStats {
  pendingPOs: number;
  pendingGRs: number;
  pendingInvoices: number;
  pendingPayments: number;
  totalPOAmount: number;
  totalInvoiceAmount: number;
}

export function ProcurementDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    pendingPOs: 0,
    pendingGRs: 0,
    pendingInvoices: 0,
    pendingPayments: 0,
    totalPOAmount: 0,
    totalInvoiceAmount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);

      // Load purchase orders
      const posRes = await fetch("/api/procurement/purchase-orders?status=submitted");
      const pos = posRes.ok ? await posRes.json() : [];

      // Load goods receipts
      const grsRes = await fetch("/api/procurement/goods-receipts?status=received");
      const grs = grsRes.ok ? await grsRes.json() : [];

      // Load invoices
      const invoicesRes = await fetch("/api/procurement/purchase-invoices?status=received");
      const invoices = invoicesRes.ok ? await invoicesRes.json() : [];

      // Load payments
      const paymentsRes = await fetch("/api/procurement/purchase-payments?status=draft");
      const payments = paymentsRes.ok ? await paymentsRes.json() : [];

      setStats({
        pendingPOs: pos.length,
        pendingGRs: grs.length,
        pendingInvoices: invoices.length,
        pendingPayments: payments.length,
        totalPOAmount: pos.reduce((sum: number, po: any) => sum + (po.grandTotal || 0), 0),
        totalInvoiceAmount: invoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0),
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">لوحة تحكم المشتريات</h2>
        <p className="text-muted-foreground">ملخص أنشطة المشتريات</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending POs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">طلبات قيد الانتظار</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPOs}</div>
            <p className="text-xs text-muted-foreground">
              ${stats.totalPOAmount.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        {/* Pending GRs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">استقبالات معلقة</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingGRs}</div>
            <p className="text-xs text-muted-foreground">
              بانتظار الفحص
            </p>
          </CardContent>
        </Card>

        {/* Pending Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">فواتير معلقة</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingInvoices}</div>
            <p className="text-xs text-muted-foreground">
              ${stats.totalInvoiceAmount.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مدفوعات معلقة</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">
              بانتظار الموافقة
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>النشاط الأخير</CardTitle>
          <CardDescription>آخر العمليات في نظام المشتريات</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">طلب شراء جديد</p>
                <p className="text-sm text-muted-foreground">تم إنشاء طلب شراء جديد</p>
              </div>
              <Badge>جديد</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">استقبال بضائع</p>
                <p className="text-sm text-muted-foreground">تم استقبال بضائع من الموردين</p>
              </div>
              <Badge variant="outline">قيد المعالجة</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">فاتورة جديدة</p>
                <p className="text-sm text-muted-foreground">تم استقبال فاتورة من الموردين</p>
              </div>
              <Badge variant="outline">جديد</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
