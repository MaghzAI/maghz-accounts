"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VendorsTable } from "@/components/vendors/vendors-table";
import { VendorForm } from "@/components/vendors/vendor-form";
import { Plus, Loader2, Building2 } from "lucide-react";

interface Vendor {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  taxId?: string | null;
  paymentTerms?: string | null;
  notes?: string | null;
  isActive: boolean;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | undefined>();

  useEffect(() => {
    fetchVendors();
  }, []);

  async function fetchVendors() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/vendors");
      if (response.ok) {
        const data = await response.json();
        setVendors(data);
      }
    } catch (error) {
      console.error("Failed to fetch vendors:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleNew() {
    setSelectedVendor(undefined);
    setIsDialogOpen(true);
  }

  function handleEdit(vendor: Vendor) {
    setSelectedVendor(vendor);
    setIsDialogOpen(true);
  }

  async function handleDelete(id: string) {
    try {
      const response = await fetch(`/api/vendors/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchVendors();
      }
    } catch (error) {
      console.error("Failed to delete vendor:", error);
    }
  }

  function handleSuccess() {
    setIsDialogOpen(false);
    setSelectedVendor(undefined);
    fetchVendors();
  }

  function handleCancel() {
    setIsDialogOpen(false);
    setSelectedVendor(undefined);
  }

  const activeVendors = vendors.filter((v) => v.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vendors</h1>
          <p className="text-muted-foreground">
            Manage vendor information and payables
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          New Vendor
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
                <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{vendors.length}</div>
                <p className="text-xs text-muted-foreground">
                  {activeVendors} active
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Vendors</CardTitle>
              <CardDescription>
                View and manage your vendor database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VendorsTable
                vendors={vendors}
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
              {selectedVendor ? "Edit Vendor" : "New Vendor"}
            </DialogTitle>
            <DialogDescription>
              {selectedVendor
                ? "Update vendor information"
                : "Add a new vendor to your database"}
            </DialogDescription>
          </DialogHeader>
          <VendorForm
            vendor={selectedVendor}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
