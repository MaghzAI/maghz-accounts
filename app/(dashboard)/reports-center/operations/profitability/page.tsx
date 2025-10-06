"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PieChart, Loader2, Printer, Download, RefreshCw, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ProfitabilityItem {
  productId: string;
  productCode: string;
  productName: string;
  category: string | null;
  unit: string;
  quantitySold: number;
  salesRevenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  profitMargin: string | number;
}

export default function ProfitabilityReportPage() {
  const [data, setData] = useState<ProfitabilityItem[]>([]);
  const [filteredData, setFilteredData] = useState<ProfitabilityItem[]>([]);
  const [products, setProducts] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    dateFrom: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    productId: "",
    category: "",
    search: "",
  });

  const [sortBy, setSortBy] = useState<keyof ProfitabilityItem>("grossProfit");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalQuantitySold: 0,
    totalRevenue: 0,
    totalCOGS: 0,
    totalProfit: 0,
    averageMargin: 0,
  });

  useEffect(() => {
    fetchData();
    fetchProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [data, filters, sortBy, sortOrder]);

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

  async function fetchData() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);
      if (filters.productId) params.append("productId", filters.productId);
      if (filters.category) params.append("category", filters.category);

      const response = await fetch(`/api/reports/operations/profitability?${params}`);
      if (response.ok) {
        const reportData = await response.json();
        setData(reportData.data);
        setSummary(reportData.summary);
      } else {
        toast({
          title: "Error",
          description: "Failed to load profitability report",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch profitability report:", error);
      toast({
        title: "Error",
        description: "Failed to load profitability report",
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
        item.productCode.toLowerCase().includes(searchTerm)
      );
    }

    filtered.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }
      
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc" 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      return 0;
    });

    setFilteredData(filtered);
  }

  function resetFilters() {
    setFilters({
      dateFrom: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0],
      productId: "",
      category: "",
      search: "",
    });
  }

  function handlePrint() {
    window.print();
  }

  const categories = Array.from(new Set(data.map(item => item.category).filter(Boolean)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">💰 Profitability Report</h1>
          <p className="text-muted-foreground">
            تقرير الربحية - تحليل الأرباح والهوامش
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
            <CardTitle className="text-sm font-medium">Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Items sold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Total sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">COGS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(summary.totalCOGS)}</div>
            <p className="text-xs text-muted-foreground">Cost of goods</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 flex items-center">
              <TrendingUp className="h-5 w-5 mr-1" />
              {formatCurrency(summary.totalProfit)}
            </div>
            <p className="text-xs text-muted-foreground">Net profit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {summary.averageMargin.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">Profit margin</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter profitability data</CardDescription>
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
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Product name or code..."
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
              <CardTitle>Product Profitability</CardTitle>
              <CardDescription>
                Showing {filteredData.length} of {data.length} products
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Label className="text-sm">Sort by:</Label>
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as keyof ProfitabilityItem)}
              >
                <option value="grossProfit">Profit</option>
                <option value="salesRevenue">Revenue</option>
                <option value="profitMargin">Margin %</option>
                <option value="quantitySold">Quantity</option>
              </select>
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              >
                <option value="desc">Highest First</option>
                <option value="asc">Lowest First</option>
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
              <PieChart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No profitability data found
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left text-sm font-medium">Product</th>
                    <th className="p-3 text-left text-sm font-medium">Category</th>
                    <th className="p-3 text-right text-sm font-medium">Qty Sold</th>
                    <th className="p-3 text-right text-sm font-medium">Revenue</th>
                    <th className="p-3 text-right text-sm font-medium">COGS</th>
                    <th className="p-3 text-right text-sm font-medium">Profit</th>
                    <th className="p-3 text-right text-sm font-medium">Margin %</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => (
                    <tr key={item.productId} className="border-b hover:bg-muted/50">
                      <td className="p-3 text-sm">
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-xs text-muted-foreground">{item.productCode}</div>
                      </td>
                      <td className="p-3 text-sm">{item.category || "-"}</td>
                      <td className="p-3 text-right text-sm">{item.quantitySold}</td>
                      <td className="p-3 text-right text-sm text-blue-600 font-medium">
                        {formatCurrency(item.salesRevenue)}
                      </td>
                      <td className="p-3 text-right text-sm text-orange-600">
                        {formatCurrency(item.costOfGoodsSold)}
                      </td>
                      <td className="p-3 text-right text-sm font-bold text-green-600">
                        {formatCurrency(item.grossProfit)}
                      </td>
                      <td className="p-3 text-right text-sm">
                        <span className={`font-bold ${
                          Number(item.profitMargin) >= 30 ? "text-green-600" :
                          Number(item.profitMargin) >= 15 ? "text-blue-600" :
                          Number(item.profitMargin) >= 0 ? "text-orange-600" :
                          "text-red-600"
                        }`}>
                          {item.profitMargin}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-muted/50 font-semibold">
                    <td colSpan={2} className="p-3 text-sm">Total</td>
                    <td className="p-3 text-right text-sm">{summary.totalQuantitySold}</td>
                    <td className="p-3 text-right text-sm text-blue-600">{formatCurrency(summary.totalRevenue)}</td>
                    <td className="p-3 text-right text-sm text-orange-600">{formatCurrency(summary.totalCOGS)}</td>
                    <td className="p-3 text-right text-sm text-green-600">{formatCurrency(summary.totalProfit)}</td>
                    <td className="p-3 text-right text-sm">{summary.averageMargin.toFixed(2)}%</td>
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
