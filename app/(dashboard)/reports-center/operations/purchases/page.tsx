"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Receipt, Loader2, Printer, Download, RefreshCw } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Purchase {
  id: string;
  date: Date;
  reference: string;
  vendorName: string | null;
  productName: string;
  productCode: string;
  warehouseName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export default function PurchasesReportPage() {
  const [data, setData] = useState<Purchase[]>([]);
  const [filteredData, setFilteredData] = useState<Purchase[]>([]);
  const [vendors, setVendors] = useState<Array<{ id: string; name: string }>>([]);
  const [products, setProducts] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    dateFrom: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    vendorId: "",
    productId: "",
    warehouseId: "",
    search: "",
  });

  const [sortBy, setSortBy] = useState<keyof Purchase>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchData();
    fetchVendors();
    fetchProducts();
    fetchWarehouses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [data, filters, sortBy, sortOrder]);

  async function fetchVendors() {
    try {
      const response = await fetch("/api/vendors");
      if (response.ok) {
        const vendorsData = await response.json();
        setVendors(vendorsData);
      }
    } catch (error) {
      console.error("Failed to fetch vendors:", error);
    }
  }

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
      if (filters.vendorId) params.append("vendorId", filters.vendorId);
      if (filters.productId) params.append("productId", filters.productId);
      if (filters.warehouseId) params.append("warehouseId", filters.warehouseId);

      const response = await fetch(`/api/reports/operations/purchases?${params}`);
      if (response.ok) {
        const reportData = await response.json();
        setData(reportData.purchases);
      } else {
        toast({
          title: "Error",
          description: "Failed to load purchases report",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch purchases report:", error);
      toast({
        title: "Error",
        description: "Failed to load purchases report",
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
        item.reference?.toLowerCase().includes(searchTerm) ||
        item.vendorName?.toLowerCase().includes(searchTerm) ||
        item.productName.toLowerCase().includes(searchTerm)
      );
    }

    filtered.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      
      if (aVal instanceof Date && bVal instanceof Date) {
        return sortOrder === "asc" 
          ? aVal.getTime() - bVal.getTime()
          : bVal.getTime() - aVal.getTime();
      }
      
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
      dateFrom: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0],
      vendorId: "",
      productId: "",
      warehouseId: "",
      search: "",
    });
  }

  function handlePrint() {
    window.print();
  }

  const summary = {
    totalPurchases: filteredData.length,
    totalQuantity: filteredData.reduce((sum, item) => sum + item.quantity, 0),
    totalCost: filteredData.reduce((sum, item) => sum + item.totalCost, 0),
    uniqueVendors: new Set(filteredData.map(p => p.vendorName).filter(Boolean)).size,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🧾 Purchases Report</h1>
          <p className="text-muted-foreground">
            تقرير المشتريات - تفاصيل عمليات الشراء
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
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalPurchases}</div>
            <p className="text-xs text-muted-foreground">Transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalCost)}</div>
            <p className="text-xs text-muted-foreground">All purchases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalQuantity}</div>
            <p className="text-xs text-muted-foreground">Units purchased</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.uniqueVendors}</div>
            <p className="text-xs text-muted-foreground">Unique vendors</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter purchases data</CardDescription>
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
              <Label htmlFor="vendor">Vendor</Label>
              <select
                id="vendor"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.vendorId}
                onChange={(e) => setFilters({ ...filters, vendorId: e.target.value })}
              >
                <option value="">All Vendors</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
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
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Reference, vendor, product..."
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Purchase Transactions</CardTitle>
              <CardDescription>
                Showing {filteredData.length} of {data.length} purchases
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Label className="text-sm">Sort by:</Label>
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as keyof Purchase)}
              >
                <option value="date">Date</option>
                <option value="vendorName">Vendor</option>
                <option value="totalCost">Cost</option>
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
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No purchases found
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left text-sm font-medium">Date</th>
                    <th className="p-3 text-left text-sm font-medium">Reference</th>
                    <th className="p-3 text-left text-sm font-medium">Vendor</th>
                    <th className="p-3 text-left text-sm font-medium">Product</th>
                    <th className="p-3 text-left text-sm font-medium">Warehouse</th>
                    <th className="p-3 text-right text-sm font-medium">Qty</th>
                    <th className="p-3 text-right text-sm font-medium">Unit Cost</th>
                    <th className="p-3 text-right text-sm font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((purchase) => (
                    <tr key={purchase.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 text-sm">{formatDate(purchase.date)}</td>
                      <td className="p-3 text-sm font-mono">{purchase.reference || "-"}</td>
                      <td className="p-3 text-sm">{purchase.vendorName || "Unknown"}</td>
                      <td className="p-3 text-sm">
                        <div className="font-medium">{purchase.productName}</div>
                        <div className="text-xs text-muted-foreground">{purchase.productCode}</div>
                      </td>
                      <td className="p-3 text-sm">{purchase.warehouseName}</td>
                      <td className="p-3 text-right text-sm">{purchase.quantity}</td>
                      <td className="p-3 text-right text-sm">{formatCurrency(purchase.unitCost)}</td>
                      <td className="p-3 text-right text-sm font-medium">
                        {formatCurrency(purchase.totalCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-muted/50 font-semibold">
                    <td colSpan={5} className="p-3 text-sm">Total</td>
                    <td className="p-3 text-right text-sm">{summary.totalQuantity}</td>
                    <td className="p-3 text-right text-sm">-</td>
                    <td className="p-3 text-right text-sm">{formatCurrency(summary.totalCost)}</td>
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
