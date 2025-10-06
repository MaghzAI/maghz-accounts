"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart3, Loader2, Printer, Download, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Movement {
  id: string;
  date: Date;
  type: string;
  reference: string;
  warehouseName: string;
  quantityIn: number;
  quantityOut: number;
  quantity: number;
  unitCost: number;
  totalCost: number;
  balance: number;
  notes: string | null;
}

export default function ProductMovementReportPage() {
  const [data, setData] = useState<Movement[]>([]);
  const [products, setProducts] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; code: string; name: string; unit: string; category: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    productId: "",
    dateFrom: "2020-01-01", // Far back to include all transactions
    dateTo: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    warehouseId: "",
    type: "",
  });

  const [summary, setSummary] = useState({
    totalIn: 0,
    totalOut: 0,
    netMovement: 0,
    totalValue: 0,
  });

  useEffect(() => {
    fetchProducts();
    fetchWarehouses();
  }, []);

  async function fetchProducts() {
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const productsData = await response.json();
        setProducts(productsData);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  }

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
    if (!filters.productId) {
      toast({
        title: "Error",
        description: "Please select a product",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        productId: filters.productId,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      });
      
      if (filters.warehouseId) params.append("warehouseId", filters.warehouseId);
      if (filters.type) params.append("type", filters.type);

      const response = await fetch(`/api/reports/movements/product?${params}`);
      if (response.ok) {
        const reportData = await response.json();
        setSelectedProduct(reportData.product);
        setData(reportData.movements);
        setSummary(reportData.summary);
      } else {
        toast({
          title: "Error",
          description: "Failed to load product movement report",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch product movement report:", error);
      toast({
        title: "Error",
        description: "Failed to load product movement report",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function resetFilters() {
    setFilters({
      productId: "",
      dateFrom: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0],
      warehouseId: "",
      type: "",
    });
    setData([]);
    setSelectedProduct(null);
  }

  function handlePrint() {
    window.print();
  }

  const typeColors: Record<string, string> = {
    purchase: "text-green-600",
    sale: "text-blue-600",
    adjustment: "text-orange-600",
    "transfer-in": "text-purple-600",
    "transfer-out": "text-red-600",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📊 Product Movement Report</h1>
          <p className="text-muted-foreground">
            تقرير حركة الصنف - تتبع حركة صنف معين
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handlePrint} disabled={!selectedProduct}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" disabled={!selectedProduct}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Product Info */}
      {selectedProduct && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Product Code</p>
                <p className="font-mono font-bold">{selectedProduct.code}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Product Name</p>
                <p className="font-bold">{selectedProduct.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unit</p>
                <p className="font-semibold">{selectedProduct.unit}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-semibold">{selectedProduct.category || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {selectedProduct && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total In</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                {summary.totalIn}
              </div>
              <p className="text-xs text-muted-foreground">Received</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Out</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 flex items-center">
                <TrendingDown className="h-5 w-5 mr-2" />
                {summary.totalOut}
              </div>
              <p className="text-xs text-muted-foreground">Issued</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Net Movement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.netMovement >= 0 ? "text-green-600" : "text-red-600"}`}>
                {summary.netMovement >= 0 ? "+" : ""}{summary.netMovement}
              </div>
              <p className="text-xs text-muted-foreground">Net change</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalValue)}</div>
              <p className="text-xs text-muted-foreground">Movement value</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Select product and date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="grid gap-2">
              <Label htmlFor="product">Product *</Label>
              <select
                id="product"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.productId}
                onChange={(e) => setFilters({ ...filters, productId: e.target.value })}
              >
                <option value="">Select Product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dateFrom">Date From</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dateTo">Date To</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="warehouse">Warehouse</Label>
              <select
                id="warehouse"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.warehouseId}
                onChange={(e) => setFilters({ ...filters, warehouseId: e.target.value })}
              >
                <option value="">All Warehouses</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <option value="">All Types</option>
                <option value="purchase">Purchase</option>
                <option value="sale">Sale</option>
                <option value="adjustment">Adjustment</option>
                <option value="transfer-in">Transfer In</option>
                <option value="transfer-out">Transfer Out</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={fetchData} disabled={!filters.productId}>
              Generate Report
            </Button>
            <Button variant="outline" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Table */}
      {selectedProduct && (
        <Card>
          <CardHeader>
            <CardTitle>Movement History</CardTitle>
            <CardDescription>
              Showing {data.length} movements for {selectedProduct.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : data.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  No movements found for selected period
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left text-sm font-medium">Date</th>
                      <th className="p-3 text-left text-sm font-medium">Type</th>
                      <th className="p-3 text-left text-sm font-medium">Reference</th>
                      <th className="p-3 text-left text-sm font-medium">Warehouse</th>
                      <th className="p-3 text-right text-sm font-medium">In</th>
                      <th className="p-3 text-right text-sm font-medium">Out</th>
                      <th className="p-3 text-right text-sm font-medium">Balance</th>
                      <th className="p-3 text-right text-sm font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((movement) => (
                      <tr key={movement.id} className="border-b hover:bg-muted/50">
                        <td className="p-3 text-sm">{formatDate(movement.date)}</td>
                        <td className="p-3 text-sm">
                          <span className={`font-medium ${typeColors[movement.type] || ""}`}>
                            {movement.type}
                          </span>
                        </td>
                        <td className="p-3 text-sm font-mono">{movement.reference || "-"}</td>
                        <td className="p-3 text-sm">{movement.warehouseName}</td>
                        <td className="p-3 text-right text-sm text-green-600 font-medium">
                          {movement.quantityIn > 0 ? movement.quantityIn : "-"}
                        </td>
                        <td className="p-3 text-right text-sm text-red-600 font-medium">
                          {movement.quantityOut > 0 ? movement.quantityOut : "-"}
                        </td>
                        <td className="p-3 text-right text-sm font-bold">
                          {movement.balance}
                        </td>
                        <td className="p-3 text-right text-sm">
                          {formatCurrency(Math.abs(movement.totalCost))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 bg-muted/50 font-semibold">
                      <td colSpan={4} className="p-3 text-sm">Total</td>
                      <td className="p-3 text-right text-sm text-green-600">{summary.totalIn}</td>
                      <td className="p-3 text-right text-sm text-red-600">{summary.totalOut}</td>
                      <td className="p-3 text-right text-sm">{summary.netMovement}</td>
                      <td className="p-3 text-right text-sm">{formatCurrency(Math.abs(summary.totalValue))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
