"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Package, TrendingUp, FileText, Users, DollarSign, 
  BarChart3, ShoppingCart, Warehouse, Receipt, PieChart
} from "lucide-react";

export default function ReportsCenterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">📊 Reports Center</h1>
        <p className="text-muted-foreground">
          مركز التقارير الشامل - جميع التقارير في مكان واحد
        </p>
      </div>

      {/* Inventory Reports */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">📦 Inventory Reports</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/reports-center/inventory/current">
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader>
                <Package className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Current Inventory</CardTitle>
                <CardDescription>
                  المخزون الحالي - عرض حالة المخزون في جميع المخازن
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/reports-center/inventory/low-stock">
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-orange-600 mb-2" />
                <CardTitle>Low Stock Report</CardTitle>
                <CardDescription>
                  المخزون منخفض - الأصناف التي وصلت لمستوى إعادة الطلب
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/reports-center/inventory/valuation">
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader>
                <DollarSign className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>Inventory Valuation</CardTitle>
                <CardDescription>
                  تقييم المخزون - القيمة المالية للمخزون
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>

      {/* Movement Reports */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">🔄 Movement Reports</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/reports-center/movements/product">
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>Product Movement</CardTitle>
                <CardDescription>
                  حركة الصنف - تتبع حركة صنف معين
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/reports-center/movements/daily">
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader>
                <FileText className="h-8 w-8 text-indigo-600 mb-2" />
                <CardTitle>Daily Movements</CardTitle>
                <CardDescription>
                  الحركات اليومية - جميع حركات المخزون
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/reports-center/movements/transfers">
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader>
                <Warehouse className="h-8 w-8 text-cyan-600 mb-2" />
                <CardTitle>Transfers Report</CardTitle>
                <CardDescription>
                  التحويلات - حركات التحويل بين المخازن
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>

      {/* Operations Reports */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">📈 Operations Reports</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/reports-center/operations/sales">
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader>
                <ShoppingCart className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>Sales Report</CardTitle>
                <CardDescription>
                  تقرير المبيعات - تفاصيل عمليات البيع
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/reports-center/operations/purchases">
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader>
                <Receipt className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Purchases Report</CardTitle>
                <CardDescription>
                  تقرير المشتريات - تفاصيل عمليات الشراء
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/reports-center/operations/profitability">
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader>
                <PieChart className="h-8 w-8 text-emerald-600 mb-2" />
                <CardTitle>Profitability Report</CardTitle>
                <CardDescription>
                  تقرير الربحية - تحليل الأرباح والهوامش
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>

      {/* Statement Reports */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">📋 Account Statements</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/reports-center/statements/account">
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader>
                <FileText className="h-8 w-8 text-gray-600 mb-2" />
                <CardTitle>Account Statement</CardTitle>
                <CardDescription>
                  كشف حساب عام - حركة حساب معين
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/reports-center/statements/customer">
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader>
                <Users className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Customer Statement</CardTitle>
                <CardDescription>
                  كشف حساب العميل - معاملات عميل معين
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/reports-center/statements/vendor">
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader>
                <Users className="h-8 w-8 text-orange-600 mb-2" />
                <CardTitle>Vendor Statement</CardTitle>
                <CardDescription>
                  كشف حساب المورد - معاملات مورد معين
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>

      {/* Financial Reports */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">💰 Financial Reports</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/reports">
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader>
                <DollarSign className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>Financial Statements</CardTitle>
                <CardDescription>
                  القوائم المالية - الميزانية وقائمة الدخل
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
