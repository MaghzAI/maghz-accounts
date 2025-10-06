"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2, Printer, Download, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface LowStockItem {
  id: string;
  productCode: string;
  productName: string;
  category: string | null;
  unit: string;
  warehouseName: string;
  currentStock: number;
  reorderLevel: number;
  shortage: number;
  averageCost: number;
  totalValue: number;
}

export default function LowStockReportPage() {
  const [data, setData] = useState<LowStockItem[]>([]);
  const [filteredData, setFilteredData] = useState<LowStockItem[]>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    warehouse: "",
    category: "",
  });

  useEffect(() => {
    fetchData();
    fetchWarehouses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [data, filters]);

  async function fetchWarehouses() {
    try {
      const response = await fetch("/api/warehouses");
      if (response.ok) {
        const warehousesData = await response.json();
        setWarehouses(warehousesData);
      }
    } catch (error) {
      console.error("Failed to fetch warehouses:", error);
    }
  }

  async function fetchData() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.warehouse) params.append("warehouse", filters.warehouse);
      if (filters.category) params.append("category", filters.category);

      const response = await fetch(`/api/reports/inventory/low-stock?${params}`);
      if (response.ok) {
        const reportData = await response.json();
        setData(reportData);
      } else {
        toast({
          title: "Error",
          description: "Failed to load low stock report",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch low stock report:", error);
      toast({
        title: "Error",
        description: "Failed to load low stock report",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function applyFilters() {
    setFilteredData(data);
  }

  function resetFilters() {
    setFilters({
      warehouse: "",
      category: "",
    });
  }

  function handlePrint() {
    window.print();
  }

  const categories = Array.from(new Set(data.map(item => item.category).filter(Boolean)));

  const summary = {
    totalItems: filteredData.length,
    totalShortage: filteredData.reduce((sum, item) => sum + item.shortage, 0),
    totalValue: filteredData.reduce((sum, item) => sum + item.totalValue, 0),
    criticalItems: filteredData.filter(item => item.currentStock === 0).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">⚠️ Low Stock Report</h1>
          <p className="text-muted-foreground">
            تقرير المخزون منخفض - الأصناف التي وصلت لمستوى إعادة الطلب
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{summary.totalItems}</div>
            <p className="text-xs text-muted-foreground">Need reorder</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.criticalItems}</div>
            <p className="text-xs text-muted-foreground">Out of stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Shortage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalShortage}</div>
            <p className="text-xs text-muted-foreground">Units needed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalValue)}</div>
            <p className="text-xs text-muted-foreground">Current value</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter low stock items</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="warehouse">Warehouse</Label>
              <select
                id="warehouse"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.warehouse}
                onChange={(e) => setFilters({ ...filters, warehouse: e.target.value })}
              >
                <option value="">All Warehouses</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.name}>
                    {wh.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat || ""}>
                    {cat || "Uncategorized"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={fetchData}>Apply Filters</Button>
            <Button variant="outline" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Table */}
      <Card>
        <CardHeader>
          <CardTitle>Low Stock Items</CardTitle>
          <CardDescription>
            Showing {filteredData.length} items that need reordering
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No low stock items found
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left text-sm font-medium">Code</th>
                    <th className="p-3 text-left text-sm font-medium">Product</th>
                    <th className="p-3 text-left text-sm font-medium">Category</th>
                    <th className="p-3 text-left text-sm font-medium">Warehouse</th>
                    <th className="p-3 text-right text-sm font-medium">Current</th>
                    <th className="p-3 text-right text-sm font-medium">Reorder Level</th>
                    <th className="p-3 text-right text-sm font-medium">Shortage</th>
                    <th className="p-3 text-right text-sm font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 text-sm font-mono">{item.productCode}</td>
                      <td className="p-3 text-sm">{item.productName}</td>
                      <td className="p-3 text-sm">{item.category || "-"}</td>
                      <td className="p-3 text-sm">{item.warehouseName}</td>
                      <td className="p-3 text-right text-sm">
                        <span className={item.currentStock === 0 ? "text-red-600 font-bold" : "text-orange-600"}>
                          {item.currentStock} {item.unit}
                        </span>
                      </td>
                      <td className="p-3 text-right text-sm">{item.reorderLevel}</td>
                      <td className="p-3 text-right text-sm font-bold text-red-600">
                        {item.shortage}
                      </td>
                      <td className="p-3 text-right text-sm">
                        {formatCurrency(item.totalValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-muted/50 font-semibold">
                    <td colSpan={6} className="p-3 text-sm">Total</td>
                    <td className="p-3 text-right text-sm">{summary.totalShortage}</td>
                    <td className="p-3 text-right text-sm">{formatCurrency(summary.totalValue)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
