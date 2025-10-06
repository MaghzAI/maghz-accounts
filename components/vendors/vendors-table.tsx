"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Mail, Phone } from "lucide-react";

interface Vendor {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  taxId?: string | null;
  paymentTerms?: string | null;
  isActive: boolean;
}

interface VendorsTableProps {
  vendors: Vendor[];
  onEdit: (vendor: Vendor) => void;
  onDelete: (id: string) => void;
}

export function VendorsTable({ vendors, onEdit, onDelete }: VendorsTableProps) {
  const [filter, setFilter] = useState("");

  const filteredVendors = vendors.filter((vendor) =>
    vendor.name.toLowerCase().includes(filter.toLowerCase()) ||
    vendor.email?.toLowerCase().includes(filter.toLowerCase()) ||
    vendor.phone?.includes(filter)
  );

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search by name, email, or phone..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="flex h-9 w-full max-w-sm rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
      />

      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left text-sm font-medium">Name</th>
              <th className="p-3 text-left text-sm font-medium">Contact</th>
              <th className="p-3 text-left text-sm font-medium">Tax ID</th>
              <th className="p-3 text-left text-sm font-medium">Payment Terms</th>
              <th className="p-3 text-center text-sm font-medium">Status</th>
              <th className="p-3 text-right text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVendors.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">
                  No vendors found. Create your first vendor to get started.
                </td>
              </tr>
            ) : (
              filteredVendors.map((vendor) => (
                <tr key={vendor.id} className="border-b hover:bg-muted/50">
                  <td className="p-3 text-sm font-medium">{vendor.name}</td>
                  <td className="p-3 text-sm">
                    <div className="space-y-1">
                      {vendor.email && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {vendor.email}
                        </div>
                      )}
                      {vendor.phone && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {vendor.phone}
                        </div>
                      )}
                      {!vendor.email && !vendor.phone && "-"}
                    </div>
                  </td>
                  <td className="p-3 text-sm font-mono">{vendor.taxId || "-"}</td>
                  <td className="p-3 text-sm">{vendor.paymentTerms || "-"}</td>
                  <td className="p-3 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        vendor.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {vendor.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(vendor)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Delete vendor "${vendor.name}"?`)) {
                            onDelete(vendor.id);
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
        Showing {filteredVendors.length} of {vendors.length} vendors
      </div>
    </div>
  );
}
