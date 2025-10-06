"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AccountsTable } from "@/components/accounts/accounts-table";
import { AccountForm } from "@/components/accounts/account-form";
import { Plus, Loader2, Download } from "lucide-react";

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

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | undefined>();

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/accounts");
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleEdit(account: Account) {
    setSelectedAccount(account);
    setIsDialogOpen(true);
  }

  async function handleDelete(id: string) {
    try {
      const response = await fetch(`/api/accounts/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchAccounts();
      }
    } catch (error) {
      console.error("Failed to delete account:", error);
    }
  }

  function handleSuccess() {
    setIsDialogOpen(false);
    setSelectedAccount(undefined);
    fetchAccounts();
  }

  function handleCancel() {
    setIsDialogOpen(false);
    setSelectedAccount(undefined);
  }

  const accountsByType = accounts.reduce((acc, account) => {
    const type = account.typeName;
    if (!acc[type]) acc[type] = [];
    acc[type].push(account);
    return acc;
  }, {} as Record<string, Account[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chart of Accounts</h1>
          <p className="text-muted-foreground">
            Manage your account structure
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Account
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-5">
            {Object.entries(accountsByType).map(([type, accs]) => (
              <Card key={type}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">{type}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{accs.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {accs.filter((a) => a.isActive).length} active
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Accounts</CardTitle>
              <CardDescription>
                View and manage your chart of accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AccountsTable
                accounts={accounts}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent onClose={handleCancel}>
          <DialogHeader>
            <DialogTitle>
              {selectedAccount ? "Edit Account" : "Create New Account"}
            </DialogTitle>
            <DialogDescription>
              {selectedAccount
                ? "Update the account details below."
                : "Add a new account to your chart of accounts."}
            </DialogDescription>
          </DialogHeader>
          <AccountForm
            account={selectedAccount}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
