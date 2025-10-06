"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Loader2, Printer, Download, RefreshCw } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface SaleReport {
  id: string;
  invoiceNumber: string;
  date: Date;
  customerName: string | null;
  paymentType: string;
  dueDate: Date | null;
  status: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  items: Array<{
    productName: string;
    productCode: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

export default function SalesReportPage() {
  const [data, setData] = useState<SaleReport[]>([]);
  const [filteredData, setFilteredData] = useState<SaleReport[]>([]);
  const [customers, setCustomers] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    dateFrom: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    customer: "",
    paymentType: "",
    status: "",
    search: "",
  });

  const [sortBy, setSortBy] = useState<keyof SaleReport>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchData();
    fetchCustomers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [data, filters, sortBy, sortOrder]);

  async function fetchCustomers() {
    try {
      const response = await fetch("/api/customers");
      if (response.ok) {
        const customersData = await response.json();
        setCustomers(customersData);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    }
  }

  async function fetchData() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);
      if (filters.customer) params.append("customerId", filters.customer);
      if (filters.paymentType) params.append("paymentType", filters.paymentType);
      if (filters.status) params.append("status", filters.status);

      const response = await fetch(`/api/reports/operations/sales?${params}`);
      if (response.ok) {
        const reportData = await response.json();
        setData(reportData);
      } else {
        toast({
          title: "Error",
          description: "Failed to load sales report",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch sales report:", error);
      toast({
        title: "Error",
        description: "Failed to load sales report",
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
        item.invoiceNumber.toLowerCase().includes(searchTerm) ||
        item.customerName?.toLowerCase().includes(searchTerm)
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
      customer: "",
      paymentType: "",
      status: "",
      search: "",
    });
  }

  function handlePrint() {
    window.print();
  }

  const summary = {
    totalSales: filteredData.length,
    totalRevenue: filteredData.reduce((sum, item) => sum + item.totalAmount, 0),
    cashSales: filteredData.filter(s => s.paymentType === "cash").reduce((sum, s) => sum + s.totalAmount, 0),
    creditSales: filteredData.filter(s => s.paymentType === "credit").reduce((sum, s) => sum + s.totalAmount, 0),
    confirmedSales: filteredData.filter(s => s.status === "confirmed").length,
    draftSales: filteredData.filter(s => s.status === "draft").length,
  };

  const statusColors: Record<string, string> = {
    draft: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📈 Sales Report</h1>
          <p className="text-muted-foreground">
            تقرير المبيعات - تفاصيل عمليات البيع
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
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalSales}</div>
            <p className="text-xs text-muted-foreground">Invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">All sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cash Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.cashSales)}</div>
            <p className="text-xs text-muted-foreground">Paid immediately</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Credit Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(summary.creditSales)}</div>
            <p className="text-xs text-muted-foreground">On account</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter sales data</CardDescription>
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
              <Label htmlFor="customer">Customer</Label>
              <select
                id="customer"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.customer}
                onChange={(e) => setFilters({ ...filters, customer: e.target.value })}
              >
                <option value="">All Customers</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="paymentType">Payment Type</Label>
              <select
                id="paymentType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.paymentType}
                onChange={(e) => setFilters({ ...filters, paymentType: e.target.value })}
              >
                <option value="">All Types</option>
                <option value="cash">💵 Cash</option>
                <option value="credit">📅 Credit</option>
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
                <option value="draft">Draft</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Invoice or customer..."
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
              <CardTitle>Sales Transactions</CardTitle>
              <CardDescription>
                Showing {filteredData.length} of {data.length} sales
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Label className="text-sm">Sort by:</Label>
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as keyof SaleReport)}
              >
                <option value="date">Date</option>
                <option value="invoiceNumber">Invoice #</option>
                <option value="totalAmount">Amount</option>
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
              <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No sales found
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left text-sm font-medium">Date</th>
                    <th className="p-3 text-left text-sm font-medium">Invoice #</th>
                    <th className="p-3 text-left text-sm font-medium">Customer</th>
                    <th className="p-3 text-left text-sm font-medium">Payment</th>
                    <th className="p-3 text-right text-sm font-medium">Subtotal</th>
                    <th className="p-3 text-right text-sm font-medium">Tax</th>
                    <th className="p-3 text-right text-sm font-medium">Total</th>
                    <th className="p-3 text-center text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((sale) => (
                    <tr key={sale.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 text-sm">{formatDate(sale.date)}</td>
                      <td className="p-3 text-sm font-mono">{sale.invoiceNumber}</td>
                      <td className="p-3 text-sm">{sale.customerName || "Walk-in"}</td>
                      <td className="p-3 text-sm">
                        {sale.paymentType === "cash" ? "💵 Cash" : "📅 Credit"}
                      </td>
                      <td className="p-3 text-right text-sm">{formatCurrency(sale.subtotal)}</td>
                      <td className="p-3 text-right text-sm">{formatCurrency(sale.taxAmount)}</td>
                      <td className="p-3 text-right text-sm font-medium">
                        {formatCurrency(sale.totalAmount)}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusColors[sale.status]}`}>
                          {sale.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-muted/50 font-semibold">
                    <td colSpan={4} className="p-3 text-sm">Total</td>
                    <td className="p-3 text-right text-sm">
                      {formatCurrency(filteredData.reduce((sum, s) => sum + s.subtotal, 0))}
                    </td>
                    <td className="p-3 text-right text-sm">
                      {formatCurrency(filteredData.reduce((sum, s) => sum + s.taxAmount, 0))}
                    </td>
                    <td className="p-3 text-right text-sm">
                      {formatCurrency(summary.totalRevenue)}
                    </td>
                    <td className="p-3 text-center text-sm">-</td>
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
