"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BalanceSheetReport } from "@/components/reports/balance-sheet-report";
import { IncomeStatementReport } from "@/components/reports/income-statement-report";
import { TrialBalanceReport } from "@/components/reports/trial-balance-report";
import { FileText, TrendingUp, DollarSign, Loader2 } from "lucide-react";

type ReportType = "balance-sheet" | "income-statement" | "trial-balance" | null;

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType>(null);
  const [reportData, setReportData] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split("T")[0]);
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  async function generateReport(type: ReportType) {
    if (!type) return;

    setIsLoading(true);
    setSelectedReport(type);

    try {
      let url = "";
      if (type === "balance-sheet") {
        url = `/api/reports/balance-sheet?asOfDate=${asOfDate}`;
      } else if (type === "income-statement") {
        url = `/api/reports/income-statement?startDate=${startDate}&endDate=${endDate}`;
      } else if (type === "trial-balance") {
        url = `/api/reports/trial-balance?asOfDate=${asOfDate}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error("Failed to generate report:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function closeReport() {
    setSelectedReport(null);
    setReportData(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financial Reports</h1>
        <p className="text-muted-foreground">
          Generate and view financial statements
        </p>
      </div>

      {/* Date Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Parameters</CardTitle>
          <CardDescription>Set date range for reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="asOfDate">As of Date (Balance Sheet & Trial Balance)</Label>
              <Input
                id="asOfDate"
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date (Income Statement)</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (Income Statement)</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:border-primary" onClick={() => generateReport("balance-sheet")}>
          <CardHeader>
            <FileText className="h-8 w-8 text-primary" />
            <CardTitle className="mt-4">Balance Sheet</CardTitle>
            <CardDescription>Assets, Liabilities, and Equity</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" disabled={isLoading}>
              {isLoading && selectedReport === "balance-sheet" ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
              ) : (
                "Generate Report"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary" onClick={() => generateReport("income-statement")}>
          <CardHeader>
            <TrendingUp className="h-8 w-8 text-primary" />
            <CardTitle className="mt-4">Income Statement</CardTitle>
            <CardDescription>Revenue and Expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" disabled={isLoading}>
              {isLoading && selectedReport === "income-statement" ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
              ) : (
                "Generate Report"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary" onClick={() => generateReport("trial-balance")}>
          <CardHeader>
            <DollarSign className="h-8 w-8 text-primary" />
            <CardTitle className="mt-4">Trial Balance</CardTitle>
            <CardDescription>Verify account balances</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" disabled={isLoading}>
              {isLoading && selectedReport === "trial-balance" ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
              ) : (
                "Generate Report"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Report Dialog */}
      <Dialog open={!!selectedReport && !!reportData} onOpenChange={closeReport}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" onClose={closeReport}>
          <DialogHeader>
            <DialogTitle>
              {selectedReport === "balance-sheet" && "Balance Sheet"}
              {selectedReport === "income-statement" && "Income Statement"}
              {selectedReport === "trial-balance" && "Trial Balance"}
            </DialogTitle>
          </DialogHeader>
          {reportData && (
            <>
              {selectedReport === "balance-sheet" && <BalanceSheetReport data={reportData as never} />}
              {selectedReport === "income-statement" && <IncomeStatementReport data={reportData as never} />}
              {selectedReport === "trial-balance" && <TrialBalanceReport data={reportData as never} />}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
