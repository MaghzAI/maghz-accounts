# 📊 دليل تطبيق نظام التقارير الشامل

## ✅ ما تم إنجازه

### 1️⃣ الصفحة الرئيسية ✅
- ✅ `/reports-center` - مركز التقارير الشامل
- ✅ تصنيف التقارير حسب النوع
- ✅ بطاقات تفاعلية لكل تقرير

### 2️⃣ تقرير المخزون الحالي ✅
- ✅ `/reports-center/inventory/current`
- ✅ فلاتر متقدمة (Warehouse, Category, Status, Search)
- ✅ ترتيب ديناميكي
- ✅ إحصائيات شاملة
- ✅ طباعة
- ✅ تصدير (جاهز للتطبيق)

---

## 🔧 API Endpoints المطلوبة

يجب إنشاء الـ API endpoints التالية:

### 1. تقارير المخزون
```typescript
// app/api/reports/inventory/current/route.ts
GET /api/reports/inventory/current
Query params: warehouse?, category?, status?

Response:
[
  {
    id: string;
    productCode: string;
    productName: string;
    category: string | null;
    unit: string;
    warehouseName: string;
    quantity: number;
    averageCost: number;
    totalValue: number;
    reorderLevel: number;
    status: "normal" | "low" | "out";
  }
]
```

```typescript
// app/api/reports/inventory/low-stock/route.ts
GET /api/reports/inventory/low-stock

// app/api/reports/inventory/valuation/route.ts
GET /api/reports/inventory/valuation
```

### 2. تقارير الحركات
```typescript
// app/api/reports/movements/product/route.ts
GET /api/reports/movements/product?productId={id}&dateFrom={date}&dateTo={date}

// app/api/reports/movements/daily/route.ts
GET /api/reports/movements/daily?dateFrom={date}&dateTo={date}

// app/api/reports/movements/transfers/route.ts
GET /api/reports/movements/transfers?dateFrom={date}&dateTo={date}
```

### 3. تقارير العمليات
```typescript
// app/api/reports/operations/sales/route.ts
GET /api/reports/operations/sales?dateFrom={date}&dateTo={date}

// app/api/reports/operations/purchases/route.ts
GET /api/reports/operations/purchases?dateFrom={date}&dateTo={date}

// app/api/reports/operations/profitability/route.ts
GET /api/reports/operations/profitability?dateFrom={date}&dateTo={date}
```

### 4. كشوف الحساب
```typescript
// app/api/reports/statements/account/route.ts
GET /api/reports/statements/account?accountId={id}&dateFrom={date}&dateTo={date}

// app/api/reports/statements/customer/route.ts
GET /api/reports/statements/customer?customerId={id}&dateFrom={date}&dateTo={date}

// app/api/reports/statements/vendor/route.ts
GET /api/reports/statements/vendor?vendorId={id}&dateFrom={date}&dateTo={date}
```

---

## 📝 مثال API Implementation

### تقرير المخزون الحالي

```typescript
// app/api/reports/inventory/current/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { products, stockLevels, warehouses } from "@/lib/db/schema";
import { eq, sql, isNull } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const warehouse = searchParams.get("warehouse");
    const category = searchParams.get("category");
    const status = searchParams.get("status");

    // Query to get current inventory
    const inventory = await db
      .select({
        id: stockLevels.id,
        productId: products.id,
        productCode: products.code,
        productName: products.name,
        category: products.category,
        unit: products.unit,
        warehouseId: warehouses.id,
        warehouseName: warehouses.name,
        quantity: stockLevels.quantity,
        averageCost: stockLevels.averageCost,
        totalValue: stockLevels.totalValue,
        reorderLevel: products.reorderLevel,
      })
      .from(stockLevels)
      .innerJoin(products, eq(stockLevels.productId, products.id))
      .innerJoin(warehouses, eq(stockLevels.warehouseId, warehouses.id))
      .where(isNull(products.deletedAt));

    // Calculate status and format data
    const formattedData = inventory.map(item => {
      let itemStatus: "normal" | "low" | "out" = "normal";
      
      if (item.quantity === 0) {
        itemStatus = "out";
      } else if (item.quantity <= item.reorderLevel) {
        itemStatus = "low";
      }

      return {
        ...item,
        status: itemStatus,
      };
    });

    // Apply filters
    let filtered = formattedData;
    
    if (warehouse) {
      filtered = filtered.filter(item => item.warehouseName === warehouse);
    }
    
    if (category) {
      filtered = filtered.filter(item => item.category === category);
    }
    
    if (status) {
      filtered = filtered.filter(item => item.status === status);
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Error generating inventory report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
```

---

## 🎨 مكونات UI القابلة لإعادة الاستخدام

### 1. ReportHeader Component

```typescript
// components/reports/ReportHeader.tsx
import { Button } from "@/components/ui/button";
import { Printer, Download, RefreshCw } from "lucide-react";

interface ReportHeaderProps {
  title: string;
  description: string;
  onRefresh: () => void;
  onPrint: () => void;
  onExport: () => void;
  isLoading?: boolean;
}

export function ReportHeader({
  title,
  description,
  onRefresh,
  onPrint,
  onExport,
  isLoading = false,
}: ReportHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button variant="outline" onClick={onPrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button variant="outline" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
    </div>
  );
}
```

### 2. ReportFilters Component

```typescript
// components/reports/ReportFilters.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FilterField {
  id: string;
  label: string;
  type: "select" | "input" | "date";
  options?: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

interface ReportFiltersProps {
  fields: FilterField[];
  onReset: () => void;
}

export function ReportFilters({ fields, onReset }: ReportFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
        <CardDescription>Filter and search report data</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          {fields.map((field) => (
            <div key={field.id} className="grid gap-2">
              <Label htmlFor={field.id}>{field.label}</Label>
              {field.type === "select" ? (
                <select
                  id={field.id}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                >
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "date" ? (
                <Input
                  id={field.id}
                  type="date"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              ) : (
                <Input
                  id={field.id}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  placeholder={`Search ${field.label.toLowerCase()}...`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={onReset}>
            Reset Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 3. ReportTable Component

```typescript
// components/reports/ReportTable.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface Column {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  format?: (value: any) => string;
}

interface ReportTableProps {
  title: string;
  description: string;
  columns: Column[];
  data: any[];
  isLoading?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortChange?: (sortBy: string, sortOrder: "asc" | "desc") => void;
  summary?: Record<string, any>;
}

export function ReportTable({
  title,
  description,
  columns,
  data,
  isLoading = false,
  sortBy,
  sortOrder,
  onSortChange,
  summary,
}: ReportTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {onSortChange && (
            <div className="flex gap-2">
              <Label className="text-sm">Sort by:</Label>
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value, sortOrder || "asc")}
              >
                {columns.map((col) => (
                  <option key={col.key} value={col.key}>
                    {col.label}
                  </option>
                ))}
              </select>
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                value={sortOrder}
                onChange={(e) => onSortChange(sortBy || columns[0].key, e.target.value as "asc" | "desc")}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No data found</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`p-3 text-${col.align || "left"} text-sm font-medium`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`p-3 text-${col.align || "left"} text-sm`}
                      >
                        {col.format ? col.format(row[col.key]) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              {summary && (
                <tfoot>
                  <tr className="border-t-2 bg-muted/50 font-semibold">
                    {columns.map((col, idx) => (
                      <td
                        key={col.key}
                        className={`p-3 text-${col.align || "left"} text-sm`}
                      >
                        {idx === 0 ? "Total" : summary[col.key] || "-"}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## 📤 Export Functionality

### CSV Export

```typescript
// lib/export-utils.ts
export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(",")
    )
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}
```

### Excel Export (using xlsx library)

```typescript
// Install: npm install xlsx
import * as XLSX from "xlsx";

export function exportToExcel(data: any[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
```

---

## 🎯 الخطوات التالية

### للإكمال الآن:
1. ✅ إنشاء API endpoint لتقرير المخزون الحالي
2. ⏳ إنشاء باقي صفحات التقارير (نسخ من current inventory)
3. ⏳ إنشاء باقي API endpoints
4. ⏳ إضافة Export functionality
5. ⏳ إضافة Charts (optional)

### الوقت المتبقي: ~6 ساعات

---

**الحالة الحالية:** 
- ✅ الصفحة الرئيسية
- ✅ تقرير المخزون الحالي (UI)
- ⏳ API Endpoints
- ⏳ باقي التقارير

**هل تريد أن أكمل بإنشاء API endpoints؟** 🚀
