"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Package, Loader2, Printer, Download, RefreshCw, 
  AlertTriangle, CheckCircle, XCircle 
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface InventoryItem {
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

export default function CurrentInventoryReportPage() {
  const [data, setData] = useState<InventoryItem[]>([]);
  const [filteredData, setFilteredData] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const { toast } = useToast();

  // Filters
  const [filters, setFilters] = useState({
    warehouse: "",
    category: "",
    product: "",
    status: "",
  });

  // Sorting
  const [sortBy, setSortBy] = useState<keyof InventoryItem>("productName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    fetchData();
    fetchWarehouses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [data, filters, sortBy, sortOrder]);

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
      const response = await fetch("/api/reports/inventory/current");
      if (response.ok) {
        const reportData = await response.json();
        setData(reportData);
      } else {
        toast({
          title: "Error",
          description: "Failed to load inventory report",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch inventory report:", error);
      toast({
        title: "Error",
        description: "Failed to load inventory report",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...data];

    // Apply filters
    if (filters.warehouse) {
      filtered = filtered.filter(item => item.warehouseName === filters.warehouse);
    }
    if (filters.category) {
      filtered = filtered.filter(item => item.category === filters.category);
    }
    if (filters.product) {
      const searchTerm = filters.product.toLowerCase();
      filtered = filtered.filter(item => 
        item.productName.toLowerCase().includes(searchTerm) ||
        item.productCode.toLowerCase().includes(searchTerm)
      );
    }
    if (filters.status) {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc" 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }
      
      return 0;
    });

    setFilteredData(filtered);
  }

  function resetFilters() {
    setFilters({
      warehouse: "",
      category: "",
      product: "",
      status: "",
    });
  }

  function handlePrint() {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  }

  function handleExport(format: "csv" | "excel") {
    // TODO: Implement export functionality
    toast({
      title: "Export",
      description: `Exporting to ${format.toUpperCase()}...`,
    });
  }

  // Calculate summary
  const summary = {
    totalItems: filteredData.length,
    totalQuantity: filteredData.reduce((sum, item) => sum + item.quantity, 0),
    totalValue: filteredData.reduce((sum, item) => sum + item.totalValue, 0),
    normalStock: filteredData.filter(item => item.status === "normal").length,
    lowStock: filteredData.filter(item => item.status === "low").length,
    outOfStock: filteredData.filter(item => item.status === "out").length,
  };

  // Get unique categories
  const categories = Array.from(new Set(data.map(item => item.category).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📦 Current Inventory Report</h1>
          <p className="text-muted-foreground">
            تقرير المخزون الحالي - عرض حالة المخزون في جميع المخازن
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchData()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handlePrint} disabled={isPrinting}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={() => handleExport("excel")}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalItems}</div>
            <p className="text-xs text-muted-foreground">Products in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalValue)}</div>
            <p className="text-xs text-muted-foreground">Inventory valuation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{summary.lowStock}</div>
            <p className="text-xs text-muted-foreground">Items need reorder</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.outOfStock}</div>
            <p className="text-xs text-muted-foreground">Items unavailable</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter and search inventory items</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
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

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Status</option>
                <option value="normal">✅ Normal</option>
                <option value="low">⚠️ Low Stock</option>
                <option value="out">❌ Out of Stock</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="product">Search Product</Label>
              <Input
                id="product"
                placeholder="Product name or code..."
                value={filters.product}
                onChange={(e) => setFilters({ ...filters, product: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Inventory Items</CardTitle>
              <CardDescription>
                Showing {filteredData.length} of {data.length} items
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Label className="text-sm">Sort by:</Label>
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as keyof InventoryItem)}
              >
                <option value="productName">Product Name</option>
                <option value="quantity">Quantity</option>
                <option value="totalValue">Value</option>
                <option value="warehouseName">Warehouse</option>
              </select>
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No inventory items found
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
                    <th className="p-3 text-right text-sm font-medium">Quantity</th>
                    <th className="p-3 text-right text-sm font-medium">Avg Cost</th>
                    <th className="p-3 text-right text-sm font-medium">Total Value</th>
                    <th className="p-3 text-center text-sm font-medium">Status</th>
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
                        {item.quantity} {item.unit}
                      </td>
                      <td className="p-3 text-right text-sm">{formatCurrency(item.averageCost)}</td>
                      <td className="p-3 text-right text-sm font-medium">
                        {formatCurrency(item.totalValue)}
                      </td>
                      <td className="p-3 text-center">
                        {item.status === "normal" && (
                          <span className="inline-flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4" />
                          </span>
                        )}
                        {item.status === "low" && (
                          <span className="inline-flex items-center text-orange-600">
                            <AlertTriangle className="h-4 w-4" />
                          </span>
                        )}
                        {item.status === "out" && (
                          <span className="inline-flex items-center text-red-600">
                            <XCircle className="h-4 w-4" />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-muted/50 font-semibold">
                    <td colSpan={4} className="p-3 text-sm">Total</td>
                    <td className="p-3 text-right text-sm">{summary.totalQuantity}</td>
                    <td className="p-3 text-right text-sm">-</td>
                    <td className="p-3 text-right text-sm">{formatCurrency(summary.totalValue)}</td>
                    <td className="p-3 text-center text-sm">-</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area,
          .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
          }
        }
      `}</style>
    </div>
  );
}
