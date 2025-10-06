"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, CheckCircle, XCircle } from "lucide-react";

interface Account {
  id: string;
  code: string;
  name: string;
  typeId: string;
  typeName: string;
  parentId?: string | null;
  description?: string | null;
  isActive: boolean;
}

interface AccountsTableProps {
  accounts: Account[];
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
}

export function AccountsTable({ accounts, onEdit, onDelete }: AccountsTableProps) {
  const [filter, setFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.code.toLowerCase().includes(filter.toLowerCase()) ||
      account.name.toLowerCase().includes(filter.toLowerCase());
    const matchesType = !typeFilter || account.typeId === typeFilter;
    return matchesSearch && matchesType;
  });

  const accountTypes = Array.from(new Set(accounts.map((a) => a.typeName)));

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search by code or name..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex h-9 w-full max-w-sm rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="">All Types</option>
          {accountTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left text-sm font-medium">Code</th>
              <th className="p-3 text-left text-sm font-medium">Name</th>
              <th className="p-3 text-left text-sm font-medium">Type</th>
              <th className="p-3 text-left text-sm font-medium">Status</th>
              <th className="p-3 text-right text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">
                  No accounts found. Create your first account to get started.
                </td>
              </tr>
            ) : (
              filteredAccounts.map((account) => (
                <tr key={account.id} className="border-b hover:bg-muted/50">
                  <td className="p-3 text-sm font-mono">{account.code}</td>
                  <td className="p-3 text-sm">
                    <div>
                      <p className="font-medium">{account.name}</p>
                      {account.description && (
                        <p className="text-xs text-muted-foreground">
                          {account.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-sm">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      {account.typeName}
                    </span>
                  </td>
                  <td className="p-3 text-sm">
                    {account.isActive ? (
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <XCircle className="h-4 w-4" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(account)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Delete account "${account.name}"?`)) {
                            onDelete(account.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredAccounts.length} of {accounts.length} accounts
      </div>
    </div>
  );
}
