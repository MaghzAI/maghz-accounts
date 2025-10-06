"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRightLeft, Loader2, Printer, Download, RefreshCw } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Transfer {
  id: string;
  date: Date;
  reference: string;
  productName: string;
  productCode: string;
  fromWarehouseName: string;
  toWarehouseName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  notes: string | null;
}

export default function TransfersReportPage() {
  const [data, setData] = useState<Transfer[]>([]);
  const [filteredData, setFilteredData] = useState<Transfer[]>([]);
  const [products, setProducts] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    dateFrom: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    productId: "",
    warehouseId: "",
    search: "",
  });

  const [summary, setSummary] = useState({
    totalTransfers: 0,
    totalQuantity: 0,
    totalValue: 0,
    uniqueProducts: 0,
    uniqueWarehouses: 0,
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

      const response = await fetch(`/api/reports/movements/transfers?${params}`);
      if (response.ok) {
        const reportData = await response.json();
        setData(reportData.transfers);
        setSummary(reportData.summary);
      } else {
        toast({
          title: "Error",
          description: "Failed to load transfers report",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch transfers report:", error);
      toast({
        title: "Error",
        description: "Failed to load transfers report",
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
        item.reference?.toLowerCase().includes(searchTerm) ||
        item.fromWarehouseName.toLowerCase().includes(searchTerm) ||
        item.toWarehouseName.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredData(filtered);
  }

  function resetFilters() {
    setFilters({
      dateFrom: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0],
      productId: "",
      warehouseId: "",
      search: "",
    });
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🔄 Transfers Report</h1>
          <p className="text-muted-foreground">
            التحويلات - حركات التحويل بين المخازن
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
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalTransfers}</div>
            <p className="text-xs text-muted-foreground">Transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalQuantity}</div>
            <p className="text-xs text-muted-foreground">Units transferred</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalValue)}</div>
            <p className="text-xs text-muted-foreground">Transfer value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.uniqueProducts}</div>
            <p className="text-xs text-muted-foreground">Unique products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Warehouses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.uniqueWarehouses}</div>
            <p className="text-xs text-muted-foreground">Involved</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter transfer transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
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
          </div>

          <div className="grid gap-4 md:grid-cols-1 mt-4">
            <div className="grid gap-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Product, warehouse, or reference..."
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
          <CardTitle>Transfer Transactions</CardTitle>
          <CardDescription>
            Showing {filteredData.length} of {data.length} transfers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8">
              <ArrowRightLeft className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No transfers found
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left text-sm font-medium">Date</th>
                    <th className="p-3 text-left text-sm font-medium">Reference</th>
                    <th className="p-3 text-left text-sm font-medium">Product</th>
                    <th className="p-3 text-left text-sm font-medium">From</th>
                    <th className="p-3 text-center text-sm font-medium">→</th>
                    <th className="p-3 text-left text-sm font-medium">To</th>
                    <th className="p-3 text-right text-sm font-medium">Quantity</th>
                    <th className="p-3 text-right text-sm font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((transfer) => (
                    <tr key={transfer.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 text-sm">{formatDate(transfer.date)}</td>
                      <td className="p-3 text-sm font-mono">{transfer.reference || "-"}</td>
                      <td className="p-3 text-sm">
                        <div className="font-medium">{transfer.productName}</div>
                        <div className="text-xs text-muted-foreground">{transfer.productCode}</div>
                      </td>
                      <td className="p-3 text-sm text-red-600">{transfer.fromWarehouseName}</td>
                      <td className="p-3 text-center">
                        <ArrowRightLeft className="h-4 w-4 mx-auto text-muted-foreground" />
                      </td>
                      <td className="p-3 text-sm text-green-600">{transfer.toWarehouseName}</td>
                      <td className="p-3 text-right text-sm font-medium">{transfer.quantity}</td>
                      <td className="p-3 text-right text-sm">
                        {formatCurrency(transfer.totalCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-muted/50 font-semibold">
                    <td colSpan={6} className="p-3 text-sm">Total</td>
                    <td className="p-3 text-right text-sm">{summary.totalQuantity}</td>
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
