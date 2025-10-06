"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CustomersTable } from "@/components/customers/customers-table";
import { CustomerForm } from "@/components/customers/customer-form";
import { Plus, Loader2, Users } from "lucide-react";

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

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/customers");
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleNew() {
    setSelectedCustomer(undefined);
    setIsDialogOpen(true);
  }

  function handleEdit(customer: Customer) {
    setSelectedCustomer(customer);
    setIsDialogOpen(true);
  }

  async function handleDelete(id: string) {
    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchCustomers();
      }
    } catch (error) {
      console.error("Failed to delete customer:", error);
    }
  }

  function handleSuccess() {
    setIsDialogOpen(false);
    setSelectedCustomer(undefined);
    fetchCustomers();
  }

  function handleCancel() {
    setIsDialogOpen(false);
    setSelectedCustomer(undefined);
  }

  const activeCustomers = customers.filter((c) => c.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">
            Manage customer information and receivables
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          New Customer
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customers.length}</div>
                <p className="text-xs text-muted-foreground">
                  {activeCustomers} active
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Customers</CardTitle>
              <CardDescription>
                View and manage your customer database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomersTable
                customers={customers}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent onClose={handleCancel} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedCustomer ? "Edit Customer" : "New Customer"}
            </DialogTitle>
            <DialogDescription>
              {selectedCustomer
                ? "Update customer information"
                : "Add a new customer to your database"}
            </DialogDescription>
          </DialogHeader>
          <CustomerForm
            customer={selectedCustomer}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
