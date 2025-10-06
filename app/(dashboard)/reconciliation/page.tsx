"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Loader2, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Reconciliation {
  id: string;
  accountCode: string;
  accountName: string;
  statementDate: Date;
  statementBalance: number;
  bookBalance: number;
  difference: number;
  status: string;
  createdAt: Date;
  completedAt?: Date | null;
}

interface Account {
  id: string;
  code: string;
  name: string;
}

export default function ReconciliationPage() {
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [reconciliationForm, setReconciliationForm] = useState({
    accountId: "",
    statementDate: new Date().toISOString().split('T')[0],
    statementBalance: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setIsLoading(true);
      const [reconciliationsRes, accountsRes] = await Promise.all([
        fetch("/api/reconciliations"),
        fetch("/api/accounts"),
      ]);

      if (reconciliationsRes.ok) {
        const data = await reconciliationsRes.json();
        setReconciliations(data);
      }
      if (accountsRes.ok) {
        const data = await accountsRes.json();
        // Filter for bank/cash accounts
        setAccounts(data.filter((a: Account) => 
          a.name.toLowerCase().includes("bank") || 
          a.name.toLowerCase().includes("cash")
        ));
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({
        title: "Error",
        description: "Failed to load reconciliation data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateReconciliation(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch("/api/reconciliations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reconciliationForm),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Reconciliation created successfully",
        });
        setIsDialogOpen(false);
        setReconciliationForm({
          accountId: "",
          statementDate: new Date().toISOString().split('T')[0],
          statementBalance: 0,
        });
        fetchData();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create reconciliation",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create reconciliation",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "in_progress":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  }

  const completedCount = reconciliations.filter(r => r.status === "completed").length;
  const pendingCount = reconciliations.filter(r => r.status === "pending").length;
  const totalDifference = reconciliations.reduce((sum, r) => sum + Math.abs(r.difference), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bank Reconciliation</h1>
          <p className="text-muted-foreground">
            Match bank statements with your records
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Reconciliation
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reconciliations</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reconciliations.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">Successfully reconciled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Differences</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDifference)}</div>
            <p className="text-xs text-muted-foreground">Unreconciled amount</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Reconciliation History</CardTitle>
            <CardDescription>View and manage bank reconciliations</CardDescription>
          </CardHeader>
          <CardContent>
            {reconciliations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  No reconciliations yet. Create your first reconciliation to get started.
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left text-sm font-medium">Account</th>
                      <th className="p-3 text-left text-sm font-medium">Statement Date</th>
                      <th className="p-3 text-right text-sm font-medium">Statement Balance</th>
                      <th className="p-3 text-right text-sm font-medium">Book Balance</th>
                      <th className="p-3 text-right text-sm font-medium">Difference</th>
                      <th className="p-3 text-center text-sm font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reconciliations.map((rec) => (
                      <tr key={rec.id} className="border-b hover:bg-muted/50">
                        <td className="p-3 text-sm">
                          <div className="font-medium">{rec.accountName}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {rec.accountCode}
                          </div>
                        </td>
                        <td className="p-3 text-sm">
                          {formatDate(rec.statementDate)}
                        </td>
                        <td className="p-3 text-right text-sm font-medium">
                          {formatCurrency(rec.statementBalance)}
                        </td>
                        <td className="p-3 text-right text-sm font-medium">
                          {formatCurrency(rec.bookBalance)}
                        </td>
                        <td className={`p-3 text-right text-sm font-medium ${
                          Math.abs(rec.difference) < 0.01 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(rec.difference)}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {getStatusIcon(rec.status)}
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(rec.status)}`}>
                              {rec.status.replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Reconciliation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent onClose={() => setIsDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Create Bank Reconciliation</DialogTitle>
            <DialogDescription>Start a new bank reconciliation process</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateReconciliation} className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="account">Bank/Cash Account *</Label>
                <select
                  id="account"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={reconciliationForm.accountId}
                  onChange={(e) => setReconciliationForm({ ...reconciliationForm, accountId: e.target.value })}
                  required
                >
                  <option value="">Select account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="statementDate">Statement Date *</Label>
                <Input
                  id="statementDate"
                  type="date"
                  value={reconciliationForm.statementDate}
                  onChange={(e) => setReconciliationForm({ ...reconciliationForm, statementDate: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="statementBalance">Statement Balance *</Label>
                <Input
                  id="statementBalance"
                  type="number"
                  step="0.01"
                  value={reconciliationForm.statementBalance}
                  onChange={(e) => setReconciliationForm({ ...reconciliationForm, statementBalance: parseFloat(e.target.value) || 0 })}
                  required
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Reconciliation
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
