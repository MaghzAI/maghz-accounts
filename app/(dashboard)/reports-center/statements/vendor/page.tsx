"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Loader2, Printer, Download, RefreshCw } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  date: Date;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  type: string;
}

interface VendorInfo {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export default function VendorStatementPage() {
  const [data, setData] = useState<Transaction[]>([]);
  const [vendors, setVendors] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedVendor, setSelectedVendor] = useState<VendorInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    vendorId: "",
    dateFrom: "2020-01-01",
    dateTo: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  });

  const [summary, setSummary] = useState({
    openingBalance: 0,
    totalPurchases: 0,
    totalPayments: 0,
    closingBalance: 0,
  });

  useEffect(() => {
    fetchVendors();
  }, []);

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

  async function fetchData() {
    if (!filters.vendorId) {
      toast({
        title: "Error",
        description: "Please select a vendor",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        vendorId: filters.vendorId,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      });

      const response = await fetch(`/api/reports/statements/vendor?${params}`);
      if (response.ok) {
        const reportData = await response.json();
        setSelectedVendor(reportData.vendor);
        setData(reportData.transactions);
        setSummary(reportData.summary);
      } else {
        toast({
          title: "Error",
          description: "Failed to load vendor statement",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch vendor statement:", error);
      toast({
        title: "Error",
        description: "Failed to load vendor statement",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function resetFilters() {
    setFilters({
      vendorId: "",
      dateFrom: "2020-01-01",
      dateTo: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    });
    setData([]);
    setSelectedVendor(null);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🏢 Vendor Statement</h1>
          <p className="text-muted-foreground">
            كشف حساب المورد - معاملات مورد معين
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handlePrint} disabled={!selectedVendor}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" disabled={!selectedVendor}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Vendor Info */}
      {selectedVendor && (
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Vendor Name</p>
                <p className="font-bold text-lg">{selectedVendor.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-semibold">{selectedVendor.email || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-semibold">{selectedVendor.phone || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Period</p>
                <p className="font-semibold">{formatDate(new Date(filters.dateFrom))} - {formatDate(new Date(filters.dateTo))}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {selectedVendor && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Opening Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.openingBalance >= 0 ? "text-red-600" : "text-green-600"}`}>
                {formatCurrency(summary.openingBalance)}
              </div>
              <p className="text-xs text-muted-foreground">Start of period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(summary.totalPurchases)}
              </div>
              <p className="text-xs text-muted-foreground">Goods received</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.totalPayments)}
              </div>
              <p className="text-xs text-muted-foreground">Payments made</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Closing Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.closingBalance >= 0 ? "text-red-600" : "text-green-600"}`}>
                {formatCurrency(summary.closingBalance)}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.closingBalance >= 0 ? "We owe" : "They owe"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Select vendor and date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="vendor">Vendor *</Label>
              <select
                id="vendor"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.vendorId}
                onChange={(e) => setFilters({ ...filters, vendorId: e.target.value })}
              >
                <option value="">Select Vendor</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
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
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={fetchData} disabled={!filters.vendorId}>
              Generate Statement
            </Button>
            <Button variant="outline" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Table */}
      {selectedVendor && (
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              Showing {data.length} transactions for {selectedVendor.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : data.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  No transactions found for selected period
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left text-sm font-medium">Date</th>
                      <th className="p-3 text-left text-sm font-medium">Reference</th>
                      <th className="p-3 text-left text-sm font-medium">Description</th>
                      <th className="p-3 text-right text-sm font-medium">Debit (Payments)</th>
                      <th className="p-3 text-right text-sm font-medium">Credit (Purchases)</th>
                      <th className="p-3 text-right text-sm font-medium">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.openingBalance !== 0 && (
                      <tr className="border-b bg-muted/30">
                        <td className="p-3 text-sm font-semibold" colSpan={3}>Opening Balance</td>
                        <td className="p-3 text-right text-sm">-</td>
                        <td className="p-3 text-right text-sm">-</td>
                        <td className="p-3 text-right text-sm font-bold">
                          {formatCurrency(summary.openingBalance)}
                        </td>
                      </tr>
                    )}
                    {data.map((transaction) => (
                      <tr key={transaction.id} className="border-b hover:bg-muted/50">
                        <td className="p-3 text-sm">{formatDate(transaction.date)}</td>
                        <td className="p-3 text-sm font-mono">{transaction.reference}</td>
                        <td className="p-3 text-sm">{transaction.description}</td>
                        <td className="p-3 text-right text-sm text-green-600 font-medium">
                          {transaction.debit > 0 ? formatCurrency(transaction.debit) : "-"}
                        </td>
                        <td className="p-3 text-right text-sm text-orange-600 font-medium">
                          {transaction.credit > 0 ? formatCurrency(transaction.credit) : "-"}
                        </td>
                        <td className="p-3 text-right text-sm font-bold">
                          {formatCurrency(transaction.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 bg-muted/50 font-semibold">
                      <td colSpan={3} className="p-3 text-sm">Closing Balance</td>
                      <td className="p-3 text-right text-sm text-green-600">{formatCurrency(summary.totalPayments)}</td>
                      <td className="p-3 text-right text-sm text-orange-600">{formatCurrency(summary.totalPurchases)}</td>
                      <td className="p-3 text-right text-sm font-bold text-lg">
                        {formatCurrency(summary.closingBalance)}
                      </td>
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
