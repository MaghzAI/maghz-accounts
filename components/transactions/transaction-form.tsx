"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Loader2, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Account {
  id: string;
  code: string;
  name: string;
}

interface TransactionLine {
  accountId: string;
  debit: number;
  credit: number;
  description: string;
}

interface TransactionFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function TransactionForm({ onSuccess, onCancel }: TransactionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [code, setCode] = useState("");
  const [lines, setLines] = useState<TransactionLine[]>([
    { accountId: "", debit: 0, credit: 0, description: "" },
    { accountId: "", debit: 0, credit: 0, description: "" },
  ]);

  useEffect(() => {
    fetchAccounts();
    generateCode();
  }, []);

  async function generateCode() {
    try {
      const response = await fetch("/api/generate-code?type=transaction");
      if (response.ok) {
        const { code: newCode } = await response.json();
        setCode(newCode);
      }
    } catch (error) {
      console.error("Failed to generate code:", error);
    }
  }

  async function fetchAccounts() {
    try {
      const response = await fetch("/api/accounts");
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.filter((a: Account & { isActive: boolean }) => a.isActive));
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    }
  }

  function addLine() {
    setLines([...lines, { accountId: "", debit: 0, credit: 0, description: "" }]);
  }

  function removeLine(index: number) {
    if (lines.length > 2) {
      setLines(lines.filter((_, i) => i !== index));
    }
  }

  function updateLine(index: number, field: keyof TransactionLine, value: string | number) {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  }

  const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    
    // Add auto-generated code
    formData.set("reference", code);
    const data = {
      date: formData.get("date") as string,
      description: formData.get("description") as string,
      reference: formData.get("reference") as string || null,
      type: formData.get("type") as string,
      lines: lines.map(line => ({
        accountId: line.accountId,
        debit: Number(line.debit) || 0,
        credit: Number(line.credit) || 0,
        description: line.description || null,
      })),
    };

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to create transaction");
        setIsLoading(false);
        return;
      }

      onSuccess();
    } catch {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={new Date().toISOString().split("T")[0]}
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Type *</Label>
          <Select id="type" name="type" required disabled={isLoading}>
            <option value="">Select type...</option>
            <option value="invoice">Invoice</option>
            <option value="expense">Expense</option>
            <option value="payment">Payment</option>
            <option value="receipt">Receipt</option>
            <option value="journal">Journal Entry</option>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reference">Reference (Auto-generated)</Label>
          <Input
            id="reference"
            name="reference"
            value={code}
            readOnly
            className="bg-muted"
            placeholder="Auto-generated"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Transaction description..."
          required
          disabled={isLoading}
          rows={2}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Transaction Lines *</Label>
          <Button type="button" size="sm" onClick={addLine} disabled={isLoading}>
            <Plus className="mr-2 h-4 w-4" />
            Add Line
          </Button>
        </div>

        <div className="space-y-2">
          {lines.map((line, index) => (
            <div key={index} className="grid gap-2 rounded-md border p-3 md:grid-cols-12">
              <div className="md:col-span-4">
                <Select
                  value={line.accountId}
                  onChange={(e) => updateLine(index, "accountId", e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full"
                >
                  <option value="">Select account...</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="md:col-span-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Debit"
                  value={line.debit || ""}
                  onChange={(e) => {
                    updateLine(index, "debit", e.target.value);
                    if (Number(e.target.value) > 0) {
                      updateLine(index, "credit", 0);
                    }
                  }}
                  disabled={isLoading}
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Credit"
                  value={line.credit || ""}
                  onChange={(e) => {
                    updateLine(index, "credit", e.target.value);
                    if (Number(e.target.value) > 0) {
                      updateLine(index, "debit", 0);
                    }
                  }}
                  disabled={isLoading}
                />
              </div>
              <div className="md:col-span-3">
                <Input
                  placeholder="Description (optional)"
                  value={line.description}
                  onChange={(e) => updateLine(index, "description", e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="md:col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLine(index)}
                  disabled={isLoading || lines.length <= 2}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-md border bg-muted/50 p-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">Total Debit: {formatCurrency(totalDebit)}</p>
            <p className="text-sm font-medium">Total Credit: {formatCurrency(totalCredit)}</p>
          </div>
          <div>
            {isBalanced ? (
              <span className="text-sm font-medium text-green-600">✓ Balanced</span>
            ) : (
              <span className="text-sm font-medium text-destructive">
                ✗ Not Balanced (Difference: {formatCurrency(Math.abs(totalDebit - totalCredit))})
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !isBalanced}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Transaction
        </Button>
      </div>
    </form>
  );
}
