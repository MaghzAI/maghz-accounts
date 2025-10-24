"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { InventoryActionBar } from "@/components/inventory/inventory-action-bar";
import { WaveForm } from "@/components/inventory/wave-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCcw, Truck, Waves } from "lucide-react";

interface OutboundSummary {
  backlog: number;
  picking: number;
  staging: number;
}

interface OutboundBacklogItem {
  id: string;
  customer: string;
  destination: string;
  priority: "High" | "Medium" | "Low";
  dueDate: string;
  lines: number;
  status: string;
  wave: string | null;
  pickerTeam: string | null;
}

interface OutboundShipmentItem {
  id: string;
  carrier: string;
  service: string;
  cartons: number;
  weight: number;
  stage: string;
  plannedPickup: string;
}

interface OutboundAlert {
  id: string;
  title: string;
  description: string;
  severity: "Critical" | "Normal" | "Low";
}

interface OutboundWavePlan {
  id: string;
  name: string;
  pickerTeam: string;
  startTime: string;
  status: string;
  orders: number;
  lines: number;
  priorityFocus: string;
}

interface OutboundCarrierCapacity {
  id: string;
  carrier: string;
  capacityUsed: number;
  capacityTotal: number;
  cutoff: string;
}

interface OutboundPackingTask {
  id: string;
  orderId: string;
  station: string;
  status: string;
  startedAt: string | null;
}

interface OutboundDashboardResponse {
  summary: OutboundSummary;
  backlog: OutboundBacklogItem[];
  shipments: OutboundShipmentItem[];
  alerts: OutboundAlert[];
  wavePlans: OutboundWavePlan[];
  carrierCapacity: OutboundCarrierCapacity[];
  packingTasks: OutboundPackingTask[];
}

const priorityClassNames: Record<OutboundBacklogItem["priority"], string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-slate-100 text-slate-700",
};

const alertClassNames: Record<OutboundAlert["severity"], string> = {
  Critical: "border-red-200 bg-red-50 text-red-900",
  Normal: "border-blue-200 bg-blue-50 text-blue-900",
  Low: "border-slate-200 bg-slate-50 text-slate-900",
};

const EMPTY_WAVE_PLANS: OutboundWavePlan[] = [];
const EMPTY_CARRIER_CAPACITY: OutboundCarrierCapacity[] = [];
const EMPTY_PACKING_TASKS: OutboundPackingTask[] = [];
const EMPTY_BACKLOG: OutboundBacklogItem[] = [];
const EMPTY_SHIPMENTS: OutboundShipmentItem[] = [];
const EMPTY_ALERTS: OutboundAlert[] = [];

function toCsv<T extends Record<string, unknown>>(rows: T[], columns: { key: keyof T; header: string; format?: (value: unknown, row: T) => string }[]) {
  const escape = (value: string) => {
    if (value.includes(",") || value.includes("\"")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const header = columns.map((col) => escape(col.header)).join(",");
  const dataLines = rows.map((row) =>
    columns
      .map((col) => {
        const raw = row[col.key];
        const value = col.format ? col.format(raw, row) : raw;
        if (value === undefined || value === null) return "";
        return escape(String(value));
      })
      .join(",")
  );

  return [header, ...dataLines].join("\n");
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function OutboundDashboard() {
  const { toast } = useToast();
  const [data, setData] = useState<OutboundDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWaveId, setSelectedWaveId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [actionBusy, setActionBusy] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: "delete" | "status";
    waveName: string;
  } | null>(null);
  const [waveFormOpen, setWaveFormOpen] = useState(false);
  const [waveFormMode, setWaveFormMode] = useState<"add" | "edit">("add");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "scheduled" | "in-progress" | "completed">("all");
  const [sortBy, setSortBy] = useState<"name" | "status" | "orders" | "lines">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/inventory/outbound");
      if (!response.ok) {
        throw new Error("Failed to fetch outbound summary");
      }
      const payload: OutboundDashboardResponse = await response.json();
      setData(payload);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "تعذر تحميل بيانات الصرف والشحن",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!data?.wavePlans?.length) {
      setSelectedWaveId(null);
      return;
    }
    if (!selectedWaveId || !data.wavePlans.some((wave) => wave.id === selectedWaveId)) {
      setSelectedWaveId(data.wavePlans[0].id);
    }
  }, [data?.wavePlans, selectedWaveId]);

  const selectedWave = useMemo(() => {
    if (!selectedWaveId || !data?.wavePlans) return null;
    return data.wavePlans.find((wave) => wave.id === selectedWaveId) ?? null;
  }, [data?.wavePlans, selectedWaveId]);

  const capacityUtilization = useMemo(() => {
    if (!data?.carrierCapacity?.length) return 0;
    const { used, total } = data.carrierCapacity.reduce(
      (acc, carrier) => {
        acc.used += carrier.capacityUsed;
        acc.total += carrier.capacityTotal;
        return acc;
      },
      { used: 0, total: 0 }
    );

    if (total === 0) return 0;
    return Math.round((used / total) * 100);
  }, [data?.carrierCapacity]);

  const wavePlans = data?.wavePlans ?? EMPTY_WAVE_PLANS;
  const carrierCapacity = data?.carrierCapacity ?? EMPTY_CARRIER_CAPACITY;
  const packingTasks = data?.packingTasks ?? EMPTY_PACKING_TASKS;
  const backlog = data?.backlog ?? EMPTY_BACKLOG;
  const shipments = data?.shipments ?? EMPTY_SHIPMENTS;
  const alerts = data?.alerts ?? EMPTY_ALERTS;
  const summary = data?.summary;

  // Filter and search waves
  const filteredWaves = useMemo(() => {
    return wavePlans.filter((wave) => {
      // Status filter
      if (statusFilter !== "all") {
        const waveStatus = wave.status.toLowerCase().replace(/\s+/g, "-");
        if (waveStatus !== statusFilter) return false;
      }
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          wave.name.toLowerCase().includes(term) ||
          wave.id.toLowerCase().includes(term) ||
          (wave.pickerTeam?.toLowerCase().includes(term) ?? false)
        );
      }
      return true;
    });
  }, [wavePlans, statusFilter, searchTerm]);

  // Sort waves
  const sortedWaves = useMemo(() => {
    const sorted = [...filteredWaves];
    sorted.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "orders":
          comparison = a.orders - b.orders;
          break;
        case "lines":
          comparison = a.lines - b.lines;
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [filteredWaves, sortBy, sortDirection]);

  const handleAdd = useCallback(() => {
    setWaveFormMode("add");
    setWaveFormOpen(true);
  }, []);

  const handleEdit = useCallback(() => {
    if (!selectedWave) {
      toast({
        title: "لم يتم اختيار موجة",
        description: "اختر موجة من الجدول قبل التعديل.",
        variant: "destructive",
      });
      return;
    }
    setWaveFormMode("edit");
    setWaveFormOpen(true);
  }, [selectedWave, toast]);

  const handleDelete = useCallback(() => {
    if (!selectedWave) {
      toast({
        title: "لم يتم اختيار موجة",
        description: "اختر موجة قبل الحذف.",
        variant: "destructive",
      });
      return;
    }
    setPendingAction({ type: "delete", waveName: selectedWave.name });
  }, [selectedWave, toast]);

  const handleStatusChange = useCallback(() => {
    if (!selectedWave) {
      toast({
        title: "لم يتم اختيار موجة",
        description: "اختر موجة قبل تغيير الحالة.",
        variant: "destructive",
      });
      return;
    }
    setPendingAction({ type: "status", waveName: selectedWave.name });
  }, [selectedWave, toast]);

  const handlePreview = useCallback(() => {
    if (!selectedWave) {
      toast({
        title: "لم يتم اختيار موجة",
        description: "اختر موجة للمعاينة.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "معاينة الموجة",
      description: `الموجة: ${selectedWave.name}`,
    });
  }, [selectedWave, toast]);

  const handlePrint = useCallback(() => {
    if (!shipments.length) {
      toast({
        title: "لا توجد بيانات للطباعة",
        description: "أضف شحنات أو حمّل البيانات قبل الطباعة.",
      });
      return;
    }

    const printWindow = window.open("", "outbound-print");
    if (!printWindow) {
      toast({
        title: "تعذر فتح نافذة الطباعة",
        description: "تحقق من السماح بالنوافذ المنبثقة.",
        variant: "destructive",
      });
      return;
    }

    const tableRows = shipments
      .map(
        (shipment) => `
          <tr>
            <td>${shipment.id}</td>
            <td>${shipment.carrier}</td>
            <td>${shipment.service}</td>
            <td>${shipment.stage}</td>
            <td>${shipment.cartons}</td>
            <td>${shipment.weight}</td>
            <td>${format(new Date(shipment.plannedPickup), "dd MMM yyyy")}</td>
          </tr>
        `
      )
      .join("\n");

    printWindow.document.write(`<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <title>Outbound Shipments</title>
          <style>
            body { font-family: sans-serif; padding: 24px; }
            h1 { margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
            th { background-color: #f8fafc; }
          </style>
        </head>
        <body>
          <h1>Outbound Shipments</h1>
          <table>
            <thead>
              <tr>
                <th>Shipment</th>
                <th>Carrier</th>
                <th>Service</th>
                <th>Stage</th>
                <th>Cartons</th>
                <th>Weight (kg)</th>
                <th>Pickup</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>`);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }, [shipments, toast]);

  const handleExportCsv = useCallback(() => {
    if (!backlog.length) {
      toast({
        title: "لا توجد بيانات للتصدير",
        description: "أضف طلبات أو حمّل البيانات قبل التصدير.",
      });
      return;
    }

    const csv = toCsv(backlog as Record<string, unknown>[], [
      { key: "id", header: "Order" },
      { key: "customer", header: "Customer" },
      { key: "destination", header: "Destination" },
      { key: "wave", header: "Wave", format: (value) => (value ? String(value) : "—") },
      { key: "pickerTeam", header: "Team", format: (value) => (value ? String(value) : "—") },
      {
        key: "dueDate",
        header: "Due Date",
        format: (value) => (value ? format(new Date(String(value)), "yyyy-MM-dd") : ""),
      },
      { key: "status", header: "Status" },
      { key: "priority", header: "Priority" },
      { key: "lines", header: "Lines" },
    ]);

    const filename = `outbound-backlog-${format(new Date(), "yyyyMMdd-HHmmss")}.csv`;
    downloadCsv(filename, csv);
    toast({
      title: "تم إنشاء ملف CSV",
      description: `تم تنزيل ${filename}.`,
    });
  }, [backlog, toast]);
  const handleExportXlsx = useCallback(() => {
    toast({
      title: "تصدير XLSX",
      description: "سيتم تفعيل هذه الميزة قريبًا.",
    });
  }, [toast]);

  const closeDialog = useCallback(() => {
    if (actionBusy) return;
    setPendingAction(null);
  }, [actionBusy]);

  const handleConfirmAction = useCallback(async () => {
    if (!pendingAction || !selectedWave) return;
    setActionBusy(true);
    try {
      if (pendingAction.type === "delete") {
        const response = await fetch(`/api/inventory/waves/${selectedWave.id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || "Failed to delete wave");
        }
        toast({
          title: "تم حذف الموجة",
          description: `${pendingAction.waveName} تم حذفها بنجاح.`,
        });
      } else if (pendingAction.type === "status") {
        const response = await fetch(`/api/inventory/waves/${selectedWave.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "Completed",
          }),
        });
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || "Failed to update wave status");
        }
        toast({
          title: "تم تحديث الحالة",
          description: `${pendingAction.waveName} تم تحديثها إلى Completed.`,
        });
      }
      await loadData();
      setSelectedWaveId(null);
    } catch (error) {
      console.error(error);
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل تنفيذ الإجراء",
        variant: "destructive",
      });
    } finally {
      setActionBusy(false);
      setPendingAction(null);
    }
  }, [pendingAction, selectedWave, toast, loadData]);

  return (
    <div className="space-y-6">
      <InventoryActionBar
        isBusy={isLoading || actionBusy}
        selectionLabel={selectedWave ? `الموجة المحددة: ${selectedWave.name}` : "لا توجد موجة محددة"}
        disableEdit={!selectedWave}
        disableDelete={!selectedWave}
        disableChangeStatus={!selectedWave}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onChangeStatus={handleStatusChange}
        onRefresh={loadData}
        onPreview={handlePreview}
        onPrint={handlePrint}
        onExportCsv={handleExportCsv}
        onExportXlsx={handleExportXlsx}
      />

      <Dialog open={Boolean(pendingAction)} onOpenChange={(open) => (open ? null : closeDialog())}>
        <DialogContent onClose={closeDialog}>
          <DialogHeader className="space-y-3">
            <DialogTitle>
              {pendingAction?.type === "delete" ? "تأكيد حذف الموجة" : "تأكيد تغيير الحالة"}
            </DialogTitle>
            <DialogDescription>
              {pendingAction?.waveName
                ? `الموجة: ${pendingAction.waveName}`
                : "اختر موجة للمتابعة."}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              {pendingAction?.type === "delete"
                ? "سيتم حذف هذه الموجة نهائيًا من النظام."
                : "سيتم تحديث حالة الموجة إلى Completed."}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeDialog} disabled={actionBusy}>
                إلغاء
              </Button>
              <Button 
                onClick={handleConfirmAction} 
                disabled={actionBusy}
                variant={pendingAction?.type === "delete" ? "destructive" : "default"}
              >
                {actionBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                تأكيد
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">Fulfillment Control Tower</h2>
          <p className="text-sm text-muted-foreground">
            Watch order backlog, picking waves, and carrier pickups in one place.
          </p>
        </div>
        <Button variant="outline" onClick={loadData} disabled={isLoading}>
          <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Order Backlog</CardTitle>
            <CardDescription>Orders waiting to start picking</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary?.backlog ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Currently Picking</CardTitle>
            <CardDescription>Orders in active pick waves</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary?.picking ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Staging / Packing</CardTitle>
            <CardDescription>Ready for carrier handoff</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary?.staging ?? 0}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Wave Planner</CardTitle>
              <CardDescription>Manage picking waves and release timing</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("table")}
              >
                Table
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and Filter */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                placeholder="ابحث عن موجة..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <select
                value={statusFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value as "all" | "draft" | "scheduled" | "in-progress" | "completed")}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">جميع الحالات</option>
                <option value="draft">مسودة</option>
                <option value="scheduled">مجدولة</option>
                <option value="in-progress">قيد التنفيذ</option>
                <option value="completed">مكتملة</option>
              </select>
              <select
                value={sortBy}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as "name" | "status" | "orders" | "lines")}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="name">الاسم</option>
                <option value="status">الحالة</option>
                <option value="orders">الطلبات</option>
                <option value="lines">الأسطر</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
              >
                {sortDirection === "asc" ? "↑" : "↓"}
              </Button>
            </div>

            {isLoading && !data ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : wavePlans.length > 0 ? (
              sortedWaves.length > 0 ? (
                <div className={`grid gap-3 ${viewMode === "grid" ? "md:grid-cols-2" : ""}`}>
                  {sortedWaves.map((wave) => (
                    <div
                      key={wave.id}
                      onClick={() => setSelectedWaveId(wave.id)}
                      className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                        selectedWaveId === wave.id ? "border-primary bg-primary/5" : "hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{wave.name}</p>
                          <p className="text-xs text-muted-foreground">{wave.pickerTeam}</p>
                        </div>
                        <span className="text-xs font-semibold uppercase text-muted-foreground">{wave.status}</span>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <div>
                          <p>Orders</p>
                          <p className="font-semibold text-slate-900">{wave.orders}</p>
                        </div>
                        <div>
                          <p>Lines</p>
                          <p className="font-semibold text-slate-900">{wave.lines}</p>
                        </div>
                        <div>
                          <p>Start</p>
                          <p className="font-semibold text-slate-900">{format(new Date(wave.startTime), "dd MMM · HH:mm")}</p>
                        </div>
                      </div>
                      <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                        <Waves className="h-3.5 w-3.5" /> {wave.priorityFocus} priority
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="p-3 text-left font-medium">Wave</th>
                        <th className="p-3 text-left font-medium">Team</th>
                        <th className="p-3 text-left font-medium">Status</th>
                        <th className="p-3 text-left font-medium">Orders</th>
                        <th className="p-3 text-left font-medium">Lines</th>
                        <th className="p-3 text-left font-medium">Start</th>
                        <th className="p-3 text-left font-medium">Focus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedWaves.map((wave) => (
                        <tr key={wave.id} className="border-t">
                          <td className="p-3 font-semibold">{wave.id}</td>
                          <td className="p-3 text-muted-foreground">{wave.pickerTeam}</td>
                          <td className="p-3 text-muted-foreground">{wave.status}</td>
                          <td className="p-3 text-muted-foreground">{wave.orders}</td>
                          <td className="p-3 text-muted-foreground">{wave.lines}</td>
                          <td className="p-3 text-muted-foreground">{format(new Date(wave.startTime), "dd MMM · HH:mm")}</td>
                          <td className="p-3 text-muted-foreground">{wave.priorityFocus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">No wave plans created yet.</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Wave Details</CardTitle>
            <CardDescription>Focus on the selected wave metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedWave ? (
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                  <p className="text-sm font-semibold text-slate-900">{selectedWave.name}</p>
                  <p className="text-xs text-muted-foreground">Team {selectedWave.pickerTeam}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Scheduled {formatDistanceToNow(new Date(selectedWave.startTime), { addSuffix: true })}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs uppercase text-muted-foreground">Orders</p>
                    <p className="text-2xl font-semibold text-slate-900">{selectedWave.orders}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs uppercase text-muted-foreground">Lines</p>
                    <p className="text-2xl font-semibold text-slate-900">{selectedWave.lines}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Priority focus: <span className="font-semibold text-slate-900">{selectedWave.priorityFocus}</span>
                </p>
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">Select a wave to inspect its metrics.</div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Carrier Capacity</CardTitle>
            <CardDescription>Monitor pickup windows and trailer utilization</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && !data ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : carrierCapacity.length > 0 ? (
              <div className="space-y-3">
                <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                  <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
                    <Truck className="h-4 w-4" /> Network Utilization
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{capacityUtilization}%</p>
                  <p className="text-xs text-muted-foreground">Aggregate usage across booked carriers</p>
                </div>
                {carrierCapacity.map((carrier) => {
                  const percent = Math.round((carrier.capacityUsed / carrier.capacityTotal) * 100);
                  return (
                    <div key={carrier.id} className="rounded-lg border p-4 text-sm">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-900">{carrier.carrier}</p>
                        <span className="text-xs text-muted-foreground">
                          Cutoff {format(new Date(carrier.cutoff), "dd MMM · HH:mm")}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {carrier.capacityUsed}/{carrier.capacityTotal} slots
                        </span>
                        <span>{percent}%</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${Math.min(percent, 100)}%` }}
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">No carrier bookings yet.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Packing Tasks</CardTitle>
            <CardDescription>Track workload by station and order</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && !data ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : packingTasks.length > 0 ? (
              <div className="space-y-3">
                {packingTasks.map((task) => (
                  <div key={task.id} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{task.orderId}</p>
                        <p className="text-xs text-muted-foreground">Station {task.station}</p>
                      </div>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                        {task.status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {task.startedAt ? (
                        <>Started {formatDistanceToNow(new Date(task.startedAt), { addSuffix: true })}</>
                      ) : (
                        <>Awaiting assignment</>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">No packing tasks queued.</div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Order Backlog</CardTitle>
          <CardDescription>Prioritized sales orders and transfer requests</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !data ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : backlog.length > 0 ? (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-left font-medium">Order</th>
                    <th className="p-3 text-left font-medium">Customer / Destination</th>
                    <th className="p-3 text-left font-medium">Wave</th>
                    <th className="p-3 text-left font-medium">Team</th>
                    <th className="p-3 text-left font-medium">Due</th>
                    <th className="p-3 text-left font-medium">Status</th>
                    <th className="p-3 text-left font-medium">Priority</th>
                    <th className="p-3 text-right font-medium">Lines</th>
                  </tr>
                </thead>
                <tbody>
                  {backlog.map((order) => (
                    <tr key={order.id} className="border-t">
                      <td className="p-3 font-medium">{order.id}</td>
                      <td className="p-3 text-muted-foreground">
                        <span className="block font-medium text-slate-900">{order.customer}</span>
                        <span className="text-xs text-muted-foreground">{order.destination}</span>
                      </td>
                      <td className="p-3 text-muted-foreground">{order.wave ?? "—"}</td>
                      <td className="p-3 text-muted-foreground">{order.pickerTeam ?? "—"}</td>
                      <td className="p-3 text-muted-foreground">{format(new Date(order.dueDate), "dd MMM yyyy")}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                          {order.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${priorityClassNames[order.priority]}`}>
                          {order.priority}
                        </span>
                      </td>
                      <td className="p-3 text-right font-semibold">{order.lines}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No orders waiting for picking right now.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shipping Schedule</CardTitle>
          <CardDescription>Shipments progressing through packing and staging</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !data ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : shipments.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {shipments.map((shipment) => (
                <div key={shipment.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold">{shipment.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {shipment.carrier} · {shipment.service}
                      </p>
                    </div>
                    <span className="text-xs font-semibold uppercase text-muted-foreground">{shipment.stage}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Cartons</p>
                      <p className="font-medium">{shipment.cartons}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Weight (kg)</p>
                      <p className="font-medium">{shipment.weight}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Pickup</p>
                      <p className="font-medium">{format(new Date(shipment.plannedPickup), "dd MMM")}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No shipments staged yet.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alerts & Exceptions</CardTitle>
          <CardDescription>Operational warnings to resolve before carrier cutoff</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !data ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : alerts.length > 0 ? (
            <div className="grid gap-3">
              {alerts.map((alert) => (
                <div key={alert.id} className={`rounded-lg border px-4 py-3 text-sm ${alertClassNames[alert.severity]}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{alert.title}</p>
                      <p className="text-xs opacity-80">{alert.description}</p>
                    </div>
                    <span className="whitespace-nowrap text-xs font-semibold uppercase">{alert.severity}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No outstanding alerts.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wave Form Dialog */}
      <WaveForm
        open={waveFormOpen}
        onOpenChange={setWaveFormOpen}
        mode={waveFormMode}
        wave={
          waveFormMode === "edit" && selectedWave
            ? {
                id: selectedWave.id,
                name: selectedWave.name,
                pickerTeam: selectedWave.pickerTeam,
                status: selectedWave.status,
                priorityFocus: selectedWave.priorityFocus,
                orderCount: selectedWave.orders,
                lineCount: selectedWave.lines,
              }
            : undefined
        }
        onSuccess={loadData}
      />
    </div>
  );
}
