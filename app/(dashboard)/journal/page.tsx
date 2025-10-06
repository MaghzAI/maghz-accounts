"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, BookOpen, Repeat, FileText, Loader2, X } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface JournalEntry {
  id: string;
  date: Date;
  reference: string;
  description: string;
  totalDebit: number;
  totalCredit: number;
}

interface Account {
  id: string;
  code: string;
  name: string;
}

interface EntryLine {
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
}

export default function JournalPage() {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [entryForm, setEntryForm] = useState({
    date: new Date().toISOString().split('T')[0],
    reference: "",
    description: "",
  });

  const [entryLines, setEntryLines] = useState<EntryLine[]>([]);
  const [currentLine, setCurrentLine] = useState({
    accountId: "",
    debit: 0,
    credit: 0,
    description: "",
  });

  useEffect(() => {
    fetchData();
    generateJournalCode();
  }, []);

  async function generateJournalCode() {
    try {
      const response = await fetch("/api/generate-code?type=journal");
      if (response.ok) {
        const { code } = await response.json();
        setEntryForm(prev => ({ ...prev, reference: code }));
      }
    } catch (error) {
      console.error("Failed to generate code:", error);
    }
  }

  async function fetchData() {
    try {
      setIsLoading(true);
      const [entriesRes, accountsRes] = await Promise.all([
        fetch("/api/transactions?type=journal"),
        fetch("/api/accounts"),
      ]);

      if (entriesRes.ok) {
        const data = await entriesRes.json();
        setJournalEntries(data);
      }
      if (accountsRes.ok) {
        const data = await accountsRes.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({
        title: "Error",
        description: "Failed to load journal entries",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function addLineToEntry() {
    if (!currentLine.accountId || (currentLine.debit === 0 && currentLine.credit === 0)) {
      toast({
        title: "Error",
        description: "Please select an account and enter debit or credit amount",
        variant: "destructive",
      });
      return;
    }

    if (currentLine.debit > 0 && currentLine.credit > 0) {
      toast({
        title: "Error",
        description: "A line cannot have both debit and credit",
        variant: "destructive",
      });
      return;
    }

    const account = accounts.find(a => a.id === currentLine.accountId);
    if (!account) return;

    const newLine: EntryLine = {
      accountId: currentLine.accountId,
      accountName: `${account.code} - ${account.name}`,
      debit: currentLine.debit,
      credit: currentLine.credit,
      description: currentLine.description,
    };

    setEntryLines([...entryLines, newLine]);
    setCurrentLine({ accountId: "", debit: 0, credit: 0, description: "" });
  }

  function removeLine(index: number) {
    setEntryLines(entryLines.filter((_, i) => i !== index));
  }

  async function handleCreateEntry(e: React.FormEvent) {
    e.preventDefault();

    if (entryLines.length < 2) {
      toast({
        title: "Error",
        description: "Journal entry must have at least 2 lines",
        variant: "destructive",
      });
      return;
    }

    const totalDebit = entryLines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = entryLines.reduce((sum, line) => sum + line.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      toast({
        title: "Error",
        description: "Total debits must equal total credits",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const lines = entryLines.map(line => ({
        accountId: line.accountId,
        debit: line.debit,
        credit: line.credit,
        description: line.description || null,
      }));

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: entryForm.date,
          reference: entryForm.reference,
          description: entryForm.description,
          type: "journal",
          lines,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Journal entry created successfully",
        });
        setIsDialogOpen(false);
        setEntryForm({
          date: new Date().toISOString().split('T')[0],
          reference: "",
          description: "",
        });
        setEntryLines([]);
        fetchData();
        generateJournalCode(); // Generate new code for next entry
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create journal entry",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create journal entry",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  const totalDebit = entryLines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = entryLines.reduce((sum, line) => sum + line.credit, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Journal Entries</h1>
          <p className="text-muted-foreground">
            Record manual journal entries and adjustments
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Journal Entry
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{journalEntries.length}</div>
            <p className="text-xs text-muted-foreground">Journal entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recurring</CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Journal Entries</CardTitle>
          <CardDescription>Manual journal entries and adjustments</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : journalEntries.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No journal entries yet. Create your first entry to get started.
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
                    <th className="p-3 text-right text-sm font-medium">Debit</th>
                    <th className="p-3 text-right text-sm font-medium">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {journalEntries.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 text-sm">{formatDate(entry.date)}</td>
                      <td className="p-3 text-sm font-mono">{entry.reference}</td>
                      <td className="p-3 text-sm">{entry.description}</td>
                      <td className="p-3 text-right text-sm font-medium">
                        {formatCurrency(entry.totalDebit)}
                      </td>
                      <td className="p-3 text-right text-sm font-medium">
                        {formatCurrency(entry.totalCredit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Journal Entry Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent onClose={() => setIsDialogOpen(false)} className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Journal Entry</DialogTitle>
            <DialogDescription>Record a manual journal entry with double-entry validation</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateEntry} className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={entryForm.date}
                  onChange={(e) => setEntryForm({ ...entryForm, date: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reference">Reference * (Auto-generated)</Label>
                <Input
                  id="reference"
                  value={entryForm.reference}
                  readOnly
                  required
                  className="bg-muted"
                  placeholder="Auto-generated"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={entryForm.description}
                  onChange={(e) => setEntryForm({ ...entryForm, description: e.target.value })}
                  required
                  placeholder="Entry description"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">Entry Lines</h3>
              
              <div className="grid gap-4 md:grid-cols-5 mb-4">
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="account">Account</Label>
                  <select
                    id="account"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={currentLine.accountId}
                    onChange={(e) => setCurrentLine({ ...currentLine, accountId: e.target.value })}
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
                  <Label htmlFor="debit">Debit</Label>
                  <Input
                    id="debit"
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentLine.debit}
                    onChange={(e) => setCurrentLine({ ...currentLine, debit: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="credit">Credit</Label>
                  <Input
                    id="credit"
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentLine.credit}
                    onChange={(e) => setCurrentLine({ ...currentLine, credit: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>&nbsp;</Label>
                  <Button type="button" onClick={addLineToEntry} className="w-full">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {entryLines.length > 0 && (
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-2 text-left text-sm font-medium">Account</th>
                        <th className="p-2 text-right text-sm font-medium">Debit</th>
                        <th className="p-2 text-right text-sm font-medium">Credit</th>
                        <th className="p-2 text-center text-sm font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entryLines.map((line, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2 text-sm">{line.accountName}</td>
                          <td className="p-2 text-right text-sm">{formatCurrency(line.debit)}</td>
                          <td className="p-2 text-right text-sm">{formatCurrency(line.credit)}</td>
                          <td className="p-2 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLine(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      <tr className="font-bold bg-muted/30">
                        <td className="p-2 text-right">Total:</td>
                        <td className="p-2 text-right">{formatCurrency(totalDebit)}</td>
                        <td className="p-2 text-right">{formatCurrency(totalCredit)}</td>
                        <td className="p-2 text-center">
                          {isBalanced ? (
                            <span className="text-green-600 text-xs">✓ Balanced</span>
                          ) : (
                            <span className="text-red-600 text-xs">✗ Unbalanced</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving || !isBalanced || entryLines.length < 2}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Entry
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
