"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Loader2 } from "lucide-react";

interface AccountType {
  id: string;
  name: string;
  normalBalance: string;
}

interface Account {
  id: string;
  code: string;
  name: string;
  typeId: string;
  parentId?: string | null;
  description?: string | null;
  isActive: boolean;
}

interface AccountFormProps {
  account?: Account;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AccountForm({ account, onSuccess, onCancel }: AccountFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    fetchAccountTypes();
    fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAccountTypes() {
    try {
      const response = await fetch("/api/account-types");
      if (response.ok) {
        const data = await response.json();
        setAccountTypes(data);
      }
    } catch (error) {
      console.error("Failed to fetch account types:", error);
    }
  }

  async function fetchAccounts() {
    try {
      const response = await fetch("/api/accounts");
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.filter((a: Account) => a.id !== account?.id));
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const data = {
      code: formData.get("code") as string,
      name: formData.get("name") as string,
      typeId: formData.get("typeId") as string,
      parentId: formData.get("parentId") as string || null,
      description: formData.get("description") as string || null,
      isActive: formData.get("isActive") === "true",
    };

    try {
      const url = account ? `/api/accounts/${account.id}` : "/api/accounts";
      const method = account ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to save account");
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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="code">Account Code *</Label>
          <Input
            id="code"
            name="code"
            placeholder="e.g., 1000"
            defaultValue={account?.code}
            required
            disabled={isLoading}
            pattern="[A-Z0-9-]+"
            title="Only uppercase letters, numbers, and hyphens"
          />
          <p className="text-xs text-muted-foreground">
            Use uppercase letters, numbers, and hyphens only
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Account Name *</Label>
          <Input
            id="name"
            name="name"
            placeholder="e.g., Cash"
            defaultValue={account?.name}
            required
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="typeId">Account Type *</Label>
          <Select
            id="typeId"
            name="typeId"
            defaultValue={account?.typeId}
            required
            disabled={isLoading}
          >
            <option value="">Select type...</option>
            {accountTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="parentId">Parent Account</Label>
          <Select
            id="parentId"
            name="parentId"
            defaultValue={account?.parentId || ""}
            disabled={isLoading}
          >
            <option value="">None (Top Level)</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.code} - {acc.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Optional description..."
          defaultValue={account?.description || ""}
          disabled={isLoading}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="isActive">Status</Label>
        <Select
          id="isActive"
          name="isActive"
          defaultValue={account?.isActive !== false ? "true" : "false"}
          disabled={isLoading}
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {account ? "Update" : "Create"} Account
        </Button>
      </div>
    </form>
  );
}
