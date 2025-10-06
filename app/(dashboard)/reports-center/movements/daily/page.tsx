"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Loader2, Printer, Download, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Movement {
  id: string;
  date: Date;
  type: string;
  reference: string;
  productName: string;
  productCode: string;
  warehouseName: string;
  quantityIn: number;
  quantityOut: number;
  valueIn: number;
  valueOut: number;
}

export default function DailyMovementsReportPage() {
  const [data, setData] = useState<Movement[]>([]);
  const [filteredData, setFilteredData] = useState<Movement[]>([]);
  const [products, setProducts] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    dateFrom: new Date().toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    productId: "",
    warehouseId: "",
    type: "",
    search: "",
  });

  const [summary, setSummary] = useState({
    totalMovements: 0,
    totalIn: 0,
    totalOut: 0,
    netMovement: 0,
    totalValueIn: 0,
    totalValueOut: 0,
  });

  useEffect(() => {
    fetchData();
    fetchProducts();
    fetchWarehouses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [data, filters.search]);

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
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);
      if (filters.productId) params.append("productId", filters.productId);
      if (filters.warehouseId) params.append("warehouseId", filters.warehouseId);
      if (filters.type) params.append("type", filters.type);

      const response = await fetch(`/api/reports/movements/daily?${params}`);
      if (response.ok) {
        const reportData = await response.json();
        setData(reportData.movements);
        setSummary(reportData.summary);
      } else {
        toast({
          title: "Error",
          description: "Failed to load daily movements report",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch daily movements report:", error);
      toast({
        title: "Error",
        description: "Failed to load daily movements report",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...data];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(item => 
        item.productName.toLowerCase().includes(searchTerm) ||
        item.productCode.toLowerCase().includes(searchTerm) ||
        item.reference?.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredData(filtered);
  }

  function resetFilters() {
    setFilters({
      dateFrom: new Date().toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0],
      productId: "",
      warehouseId: "",
      type: "",
      search: "",
    });
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
          <h1 className="text-3xl font-bold">📅 Daily Movements Report</h1>
          <p className="text-muted-foreground">
            الحركات اليومية - جميع حركات المخزون
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
            <CardTitle className="text-sm font-medium">Total Movements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalMovements}</div>
            <p className="text-xs text-muted-foreground">Transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total In</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              {summary.totalIn}
            </div>
            <p className="text-xs text-muted-foreground">{formatCurrency(summary.totalValueIn)}</p>
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
            <p className="text-xs text-muted-foreground">{formatCurrency(summary.totalValueOut)}</p>
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
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter daily movements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
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
              <Label htmlFor="product">Product</Label>
              <select
                id="product"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.productId}
                onChange={(e) => setFilters({ ...filters, productId: e.target.value })}
              >
                <option value="">All Products</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
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

          <div className="grid gap-4 md:grid-cols-1 mt-4">
            <div className="grid gap-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Product name, code, or reference..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
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
          <CardTitle>Movement Transactions</CardTitle>
          <CardDescription>
            Showing {filteredData.length} of {data.length} movements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No movements found
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
                    <th className="p-3 text-left text-sm font-medium">Product</th>
                    <th className="p-3 text-left text-sm font-medium">Warehouse</th>
                    <th className="p-3 text-right text-sm font-medium">In</th>
                    <th className="p-3 text-right text-sm font-medium">Out</th>
                    <th className="p-3 text-right text-sm font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((movement) => (
                    <tr key={movement.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 text-sm">{formatDate(movement.date)}</td>
                      <td className="p-3 text-sm">
                        <span className={`font-medium ${typeColors[movement.type] || ""}`}>
                          {movement.type}
                        </span>
                      </td>
                      <td className="p-3 text-sm font-mono">{movement.reference || "-"}</td>
                      <td className="p-3 text-sm">
                        <div className="font-medium">{movement.productName}</div>
                        <div className="text-xs text-muted-foreground">{movement.productCode}</div>
                      </td>
                      <td className="p-3 text-sm">{movement.warehouseName}</td>
                      <td className="p-3 text-right text-sm text-green-600 font-medium">
                        {movement.quantityIn > 0 ? movement.quantityIn : "-"}
                      </td>
                      <td className="p-3 text-right text-sm text-red-600 font-medium">
                        {movement.quantityOut > 0 ? movement.quantityOut : "-"}
                      </td>
                      <td className="p-3 text-right text-sm">
                        {formatCurrency(movement.valueIn > 0 ? movement.valueIn : movement.valueOut)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-muted/50 font-semibold">
                    <td colSpan={5} className="p-3 text-sm">Total</td>
                    <td className="p-3 text-right text-sm text-green-600">{summary.totalIn}</td>
                    <td className="p-3 text-right text-sm text-red-600">{summary.totalOut}</td>
                    <td className="p-3 text-right text-sm">
                      {formatCurrency(summary.totalValueIn + summary.totalValueOut)}
                    </td>
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
