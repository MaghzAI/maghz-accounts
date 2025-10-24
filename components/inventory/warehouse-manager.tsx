"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { InventoryActionBar } from "@/components/inventory/inventory-action-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { WarehouseForm, type WarehouseFormValues } from "@/components/inventory/warehouse-form";
import { useToast } from "@/hooks/use-toast";
import { Warehouse as WarehouseIcon, Plus, Pencil, Trash2, Loader2 } from "lucide-react";

export type Warehouse = {
  id: string;
  code: string;
  name: string;
  location: string | null;
  manager: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  deletedAt?: string | null;
};

const emptyFormValues: WarehouseFormValues = {
  code: "",
  name: "",
  location: "",
  manager: "",
  phone: "",
  isActive: true,
};

export function WarehouseManager() {
  const { toast } = useToast();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [formValues, setFormValues] = useState<WarehouseFormValues>(emptyFormValues);
  const [activeWarehouseId, setActiveWarehouseId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadWarehouses = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/warehouses");
      if (!response.ok) {
        throw new Error("Failed to load warehouses");
      }

      const data: Warehouse[] = await response.json();
      setWarehouses(data);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "تعذر تحميل قائمة المستودعات",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadWarehouses();
  }, [loadWarehouses]);

  const stats = useMemo(() => {
    const total = warehouses.length;
    const active = warehouses.filter((w) => w.isActive && !w.deletedAt).length;
    const archived = warehouses.filter((w) => !w.isActive || !!w.deletedAt).length;
    return { total, active, archived };
  }, [warehouses]);

  const selectedWarehouse = useMemo(
    () => warehouses.find((warehouse) => warehouse.id === activeWarehouseId) ?? null,
    [activeWarehouseId, warehouses]
  );

  const handleChangeStatus = useCallback(() => {
    if (!selectedWarehouse) {
      toast({
        title: "لم يتم اختيار مستودع",
        description: "اختر مستودعًا من الجدول قبل تغيير الحالة.",
        variant: "destructive",
      });
      return;
    }

    const nextState = selectedWarehouse.isActive && !selectedWarehouse.deletedAt ? "Archived" : "Active";
    toast({
      title: "Toggle status (mock)",
      description: `${selectedWarehouse.name} سيتم تحويله إلى ${nextState} عند ربط التكامل الفعلي.`,
    });
  }, [selectedWarehouse, toast]);

  const handlePreview = useCallback(() => {
    toast({
      title: "Preview warehouse",
      description: "سيتم توفير معاينة تفصيلية لاحقًا.",
    });
  }, [toast]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleExportCsv = useCallback(() => {
    toast({
      title: "Export CSV",
      description: "سيتم تصدير قائمة المستودعات بعد اكتمال واجهات التقارير.",
    });
  }, [toast]);

  const handleExportXlsx = useCallback(() => {
    toast({
      title: "Export XLSX",
      description: "سيتم تمكين التصدير إلى Excel في مرحلة قادمة.",
    });
  }, [toast]);

  async function prepareCreateDialog() {
    try {
      setMode("create");
      setActiveWarehouseId(null);
      setFormValues(emptyFormValues);

      const response = await fetch("/api/generate-code?type=warehouse");
      if (response.ok) {
        const payload = await response.json();
        setFormValues((prev) => ({ ...prev, code: payload.code ?? prev.code }));
      }

      setDialogOpen(true);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "تعذر تجهيز نموذج المستودع",
        variant: "destructive",
      });
    }
  }

  function openEditDialog(warehouse: Warehouse) {
    setMode("edit");
    setActiveWarehouseId(warehouse.id);
    setFormValues({
      code: warehouse.code,
      name: warehouse.name,
      location: warehouse.location ?? "",
      manager: warehouse.manager ?? "",
      phone: warehouse.phone ?? "",
      isActive: warehouse.isActive,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(values: WarehouseFormValues) {
    setIsSubmitting(true);
    try {
      const payload = {
        code: values.code.trim(),
        name: values.name.trim(),
        location: values.location.trim() || null,
        manager: values.manager.trim() || null,
        phone: values.phone.trim() || null,
        isActive: values.isActive,
      };

      if (mode === "create") {
        const response = await fetch("/api/warehouses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || "Failed to create warehouse");
        }

        toast({
          title: "Success",
          description: "تم إنشاء المستودع بنجاح",
        });
      } else if (activeWarehouseId) {
        const response = await fetch(`/api/warehouses/${activeWarehouseId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || "Failed to update warehouse");
        }

        toast({
          title: "Success",
          description: "تم تحديث بيانات المستودع",
        });
      }

      setDialogOpen(false);
      setActiveWarehouseId(null);
      await loadWarehouses();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "تعذر حفظ بيانات المستودع",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmation = confirm("هل تريد أرشفة هذا المستودع؟ سيتم تعطيله من الاستخدام.");
    if (!confirmation) return;

    try {
      const response = await fetch(`/api/warehouses/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to delete warehouse");
      }

      toast({
        title: "Success",
        description: "تمت أرشفة المستودع",
      });

      await loadWarehouses();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "تعذر أرشفة المستودع",
        variant: "destructive",
      });
    }
  }

  const selectionLabel = selectedWarehouse ? `${selectedWarehouse.code} · ${selectedWarehouse.name}` : "لا يوجد مستودع محدد";

  return (
    <div className="space-y-6" data-anchor="inventory-warehouses">
      <InventoryActionBar
        isBusy={isLoading || isSubmitting}
        selectionLabel={selectionLabel}
        disableEdit={!selectedWarehouse}
        disableDelete={!selectedWarehouse}
        disableChangeStatus={!selectedWarehouse}
        onAdd={prepareCreateDialog}
        onEdit={() => selectedWarehouse && openEditDialog(selectedWarehouse)}
        onDelete={() => selectedWarehouse && handleDelete(selectedWarehouse.id)}
        onChangeStatus={handleChangeStatus}
        onRefresh={loadWarehouses}
        onPreview={handlePreview}
        onPrint={handlePrint}
        onExportCsv={handleExportCsv}
        onExportXlsx={handleExportXlsx}
      />
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Warehouses</CardTitle>
            <WarehouseIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <CardDescription>All storage locations</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <CardDescription>Usable in operations</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archived</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{stats.archived}</div>
            <CardDescription>Inactive or soft deleted</CardDescription>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Warehouses</CardTitle>
            <CardDescription>Manage your physical storage locations</CardDescription>
          </div>
          <Button onClick={prepareCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Warehouse
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : warehouses.length === 0 ? (
            <div className="py-10 text-center">
              <WarehouseIcon className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">لم يتم تسجيل أي مستودعات بعد.</p>
              <Button className="mt-4" onClick={prepareCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Create your first warehouse
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-left font-medium">Code</th>
                    <th className="p-3 text-left font-medium">Name</th>
                    <th className="p-3 text-left font-medium">Location</th>
                    <th className="p-3 text-left font-medium">Manager</th>
                    <th className="p-3 text-left font-medium">Phone</th>
                    <th className="p-3 text-center font-medium">Status</th>
                    <th className="p-3 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouses.map((warehouse) => {
                    const isSelected = warehouse.id === activeWarehouseId;
                    return (
                      <tr
                        key={warehouse.id}
                        className={cn("border-t cursor-pointer transition-colors", isSelected ? "bg-primary/5" : "hover:bg-muted/50")}
                        onClick={() => setActiveWarehouseId(warehouse.id)}
                        aria-selected={isSelected}
                      >
                      <td className="p-3 font-mono">{warehouse.code}</td>
                      <td className="p-3 font-medium">{warehouse.name}</td>
                      <td className="p-3 text-muted-foreground">{warehouse.location || "—"}</td>
                      <td className="p-3 text-muted-foreground">{warehouse.manager || "—"}</td>
                      <td className="p-3 text-muted-foreground">{warehouse.phone || "—"}</td>
                      <td className="p-3 text-center">
                        {warehouse.isActive && !warehouse.deletedAt ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                            Archived
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setActiveWarehouseId(warehouse.id);
                              openEditDialog(warehouse);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setActiveWarehouseId(warehouse.id);
                              handleDelete(warehouse.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Create Warehouse" : "Edit Warehouse"}</DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Set up a new storage location for inbound, outbound, and transfer flows."
                : "Update warehouse details to keep your directory accurate."}
            </DialogDescription>
          </DialogHeader>
          <WarehouseForm
            initialValues={formValues}
            mode={mode}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
