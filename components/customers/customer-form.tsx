"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Loader2 } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  taxId?: string | null;
  creditLimit?: number | null;
  notes?: string | null;
  isActive: boolean;
}

interface CustomerFormProps {
  customer?: Customer;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CustomerForm({ customer, onSuccess, onCancel }: CustomerFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");

  useEffect(() => {
    if (!customer) {
      generateCode();
    }
  }, [customer]);

  async function generateCode() {
    try {
      const response = await fetch("/api/generate-code?type=customer");
      if (response.ok) {
        const { code: newCode } = await response.json();
        setCode(newCode);
      }
    } catch (error) {
      console.error("Failed to generate code:", error);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const data = {
      code: customer ? undefined : code,
      name: formData.get("name") as string,
      email: formData.get("email") as string || null,
      phone: formData.get("phone") as string || null,
      address: formData.get("address") as string || null,
      taxId: formData.get("taxId") as string || null,
      creditLimit: formData.get("creditLimit") ? Number(formData.get("creditLimit")) : null,
      notes: formData.get("notes") as string || null,
      isActive: formData.get("isActive") === "on",
    };

    try {
      const url = customer ? `/api/customers/${customer.id}` : "/api/customers";
      const method = customer ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || `Failed to ${customer ? "update" : "create"} customer`);
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
        {!customer && (
          <div className="space-y-2">
            <Label htmlFor="code">Code * (Auto-generated)</Label>
            <Input
              id="code"
              value={code}
              readOnly
              className="bg-muted"
              placeholder="Auto-generated"
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={customer?.name}
            required
            disabled={isLoading}
            placeholder="Customer name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={customer?.email || ""}
            disabled={isLoading}
            placeholder="email@example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={customer?.phone || ""}
            disabled={isLoading}
            placeholder="+1234567890"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="taxId">Tax ID</Label>
          <Input
            id="taxId"
            name="taxId"
            defaultValue={customer?.taxId || ""}
            disabled={isLoading}
            placeholder="Tax identification number"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="creditLimit">Credit Limit</Label>
          <Input
            id="creditLimit"
            name="creditLimit"
            type="number"
            step="0.01"
            min="0"
            defaultValue={customer?.creditLimit || ""}
            disabled={isLoading}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="isActive" className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              defaultChecked={customer?.isActive ?? true}
              disabled={isLoading}
              className="h-4 w-4"
            />
            Active
          </Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          name="address"
          defaultValue={customer?.address || ""}
          disabled={isLoading}
          placeholder="Full address"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={customer?.notes || ""}
          disabled={isLoading}
          placeholder="Additional notes"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {customer ? "Update" : "Create"} Customer
        </Button>
      </div>
    </form>
  );
}
