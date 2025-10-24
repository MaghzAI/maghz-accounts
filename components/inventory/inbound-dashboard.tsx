"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { InventoryActionBar } from "@/components/inventory/inventory-action-bar";
import { AsnForm } from "@/components/inventory/asn-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  Loader2,
  Pause,
  Play,
  RefreshCcw,
  Search,
  User,
} from "lucide-react";

type InboundSummary = {
  awaiting: number;
  docked: number;
  qcHold: number;
};

type InboundAppointmentWindow = {
  start: string;
  end: string;
};

type InboundStatusHistoryEntry = {
  status: string;
  at: string;
};

type InboundQueueItem = {
  id: string;
  reference: string;
  type: string;
  partner: string;
  dock: string;
  expectedDate: string;
  status: string;
  priority: "High" | "Medium" | "Low";
  lines: number;
  totalUnits?: number;
  assignedTo?: string | null;
  appointmentWindow?: InboundAppointmentWindow;
  statusHistory?: InboundStatusHistoryEntry[];
};

type InboundTask = {
  id: string;
  title: string;
  description: string;
  severity: "Critical" | "Normal" | "Low";
};

type InboundDashboardResponse = {
  summary: InboundSummary;
  queue: InboundQueueItem[];
  upcomingTasks: InboundTask[];
  putawaySuggestions: Record<string, PutawaySuggestion[]>;
  complianceNotes: Record<string, string[]>;
  stagingNotes: Record<string, string[]>;
  exceptions: ExceptionEvent[];
};

type SuggestionFilter = "recommended" | "alternate" | "overflow" | "all";
type ViewMode = "card" | "list";

type PutawaySuggestion = {
  id: string;
  rank: number;
  location: string;
  zone: string;
  capacityUtilization: number;
  maxCapacity: number;
  temperatureClass: "Ambient" | "Chilled" | "Frozen";
  handlingNotes: string[];
  distance: string;
  reasonTag: "recommended" | "alternate" | "overflow";
  isRecommended: boolean;
};

type ExceptionEventType = "Damage" | "Variance" | "Compliance" | "Delay";
type ExceptionEventStatus = "Open" | "Acknowledged" | "Resolved";
type ExceptionEventSeverity = "Critical" | "Warning" | "Info";
type ExceptionFilter = "all" | "open" | "acknowledged" | "resolved" | "critical";

type ExceptionEvent = {
  id: string;
  asnId: string;
  type: ExceptionEventType;
  status: ExceptionEventStatus;
  message: string;
  reportedBy: string;
  timestamp: string;
  severity: ExceptionEventSeverity;
  notes?: string;
  linkedTaskId?: string;
  isAdHoc?: boolean;
};

const priorityStyles: Record<InboundQueueItem["priority"], string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-slate-100 text-slate-700",
};

const severityStyles: Record<InboundTask["severity"], string> = {
  Critical: "border-red-200 bg-red-50 text-red-900",
  Normal: "border-blue-200 bg-blue-50 text-blue-900",
  Low: "border-slate-200 bg-slate-50 text-slate-900",
};

type TaskState = "pending" | "inProgress" | "complete";

const taskStateStyles: Record<TaskState, string> = {
  pending: "bg-muted text-muted-foreground",
  inProgress: "bg-blue-100 text-blue-700",
  complete: "bg-emerald-100 text-emerald-700",
};

const taskStateLabels: Record<TaskState, string> = {
  pending: "Pending",
  inProgress: "In progress",
  complete: "Complete",
};

type StatusFilter = "all" | "scheduled" | "atDock" | "qcHold" | "completed";
type SortOption = "expectedDate" | "priority";
type SortDirection = "asc" | "desc";

const exceptionSeverityDotClasses: Record<ExceptionEventSeverity, string> = {
  Critical: "bg-red-500",
  Warning: "bg-amber-500",
  Info: "bg-slate-400",
};

const exceptionStatusStyles: Record<ExceptionEventStatus, string> = {
  Open: "bg-red-100 text-red-700",
  Acknowledged: "bg-blue-100 text-blue-700",
  Resolved: "bg-emerald-100 text-emerald-700",
};

const statusFilterOptions: Array<{ label: string; value: StatusFilter }> = [
  { label: "All", value: "all" },
  { label: "Scheduled", value: "scheduled" },
  { label: "At Dock", value: "atDock" },
  { label: "QC Hold", value: "qcHold" },
  { label: "Completed", value: "completed" },
];

const putawayFilterOptions: Array<{ label: string; value: SuggestionFilter }> = [
  { label: "Recommended", value: "recommended" },
  { label: "Alternate", value: "alternate" },
  { label: "Overflow", value: "overflow" },
  { label: "All", value: "all" },
];

const viewModeOptions: Array<{ label: string; value: ViewMode }> = [
  { label: "Cards", value: "card" },
  { label: "List", value: "list" },
];

const exceptionFilterOptions: Array<{ label: string; value: ExceptionFilter }> = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Acknowledged", value: "acknowledged" },
  { label: "Resolved", value: "resolved" },
  { label: "Critical", value: "critical" },
];

const priorityRank: Record<InboundQueueItem["priority"], number> = {
  High: 0,
  Medium: 1,
  Low: 2,
};

function matchesStatusFilter(item: InboundQueueItem, statusFilter: StatusFilter) {
  if (statusFilter === "all") return true;

  const status = item.status.toLowerCase();

  switch (statusFilter) {
    case "scheduled":
      return status.includes("schedule");
    case "atDock":
      return status.includes("arriv") || status.includes("receiv") || status.includes("dock");
    case "qcHold":
      return status.includes("qc") || status.includes("hold") || status.includes("inspection");
    case "completed":
      return status.includes("complete") || status.includes("closed") || status.includes("putaway");
    default:
      return true;
  }
}

function matchesSearch(item: InboundQueueItem, term: string) {
  if (!term) return true;
  const normalized = term.toLowerCase();
  return [item.reference, item.partner, item.type, item.dock]
    .filter(Boolean)
    .some((field) => field.toLowerCase().includes(normalized));
}

function getStatusBadgeClasses(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("qc") || normalized.includes("hold")) {
    return "bg-red-100 text-red-700";
  }

  if (normalized.includes("arriv") || normalized.includes("receiv") || normalized.includes("dock")) {
    return "bg-amber-100 text-amber-700";
  }

  if (normalized.includes("complete") || normalized.includes("closed") || normalized.includes("putaway")) {
    return "bg-emerald-100 text-emerald-700";
  }

  return "bg-blue-100 text-blue-700";
}

const statusLevelKeywords: Array<{ key: string; level: number }> = [
  { key: "schedule", level: 0 },
  { key: "arriv", level: 1 },
  { key: "dock", level: 1 },
  { key: "receiv", level: 2 },
  { key: "qc", level: 3 },
  { key: "hold", level: 3 },
  { key: "putaway", level: 3 },
  { key: "complete", level: 4 },
  { key: "closed", level: 4 },
];

function getStatusLevel(status: string) {
  const normalized = status.toLowerCase();
  for (const entry of statusLevelKeywords) {
    if (normalized.includes(entry.key)) {
      return entry.level;
    }
  }
  return 0;
}

function determineTaskState(currentLevel: number, thresholdLevel: number): TaskState {
  if (currentLevel > thresholdLevel) return "complete";
  if (currentLevel === thresholdLevel) return "inProgress";
  return "pending";
}

function getExceptionIcon(type: ExceptionEventType) {
  switch (type) {
    case "Damage":
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case "Variance":
      return <ClipboardList className="h-4 w-4 text-blue-500" />;
    case "Compliance":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "Delay":
    default:
      return <Clock className="h-4 w-4 text-amber-500" />;
  }
}

export function InboundDashboard() {
  const { toast } = useToast();
  const [data, setData] = useState<InboundDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("expectedDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedAsnId, setSelectedAsnId] = useState<string | null>(null);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);
  const [acknowledgedSuggestions, setAcknowledgedSuggestions] = useState<Set<string>>(new Set());
  const [suggestionFilter, setSuggestionFilter] = useState<SuggestionFilter>("recommended");
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [exceptionFilter, setExceptionFilter] = useState<ExceptionFilter>("open");
  const [showOnlyCurrentAsn, setShowOnlyCurrentAsn] = useState(true);
  const [selectedExceptionId, setSelectedExceptionId] = useState<string | null>(null);
  const [acknowledgedExceptions, setAcknowledgedExceptions] = useState<Map<string, ExceptionEventStatus>>(new Map());
  const [asnFormOpen, setAsnFormOpen] = useState(false);
  const [asnFormMode, setAsnFormMode] = useState<"add" | "edit">("add");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/inventory/inbound");
      if (!response.ok) {
        throw new Error("Failed to fetch inbound queue");
      }
      const payload: InboundDashboardResponse = await response.json();
      setData(payload);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "تعذر تحميل بيانات عمليات التوريد",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const summary = useMemo(() => data?.summary ?? { awaiting: 0, docked: 0, qcHold: 0 }, [data]);
  const filteredQueue = useMemo(() => {
    if (!data?.queue) return [];
    return data.queue.filter((item) => matchesStatusFilter(item, statusFilter));
  }, [data, statusFilter]);

  const searchedQueue = useMemo(() => {
    if (!filteredQueue.length) return [];
    return filteredQueue.filter((item) => matchesSearch(item, searchTerm));
  }, [filteredQueue, searchTerm]);

  const sortedQueue = useMemo(() => {
    const queue = [...searchedQueue];
    queue.sort((a, b) => {
      let comparison = 0;

      if (sortBy === "expectedDate") {
        const aTime = new Date(a.expectedDate).getTime();
        const bTime = new Date(b.expectedDate).getTime();
        comparison = aTime - bTime;
      } else {
        comparison = priorityRank[a.priority] - priorityRank[b.priority];
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
    return queue;
  }, [searchedQueue, sortBy, sortDirection]);

  useEffect(() => {
    if (sortedQueue.length === 0) {
      setSelectedAsnId(null);
      return;
    }

    if (!selectedAsnId || !sortedQueue.some((item) => item.id === selectedAsnId)) {
      setSelectedAsnId(sortedQueue[0].id);
    }
  }, [sortedQueue, selectedAsnId]);

  const activeReceiving = useMemo(
    () => sortedQueue.find((item) => item.id === selectedAsnId) ?? null,
    [sortedQueue, selectedAsnId]
  );

  const statusHistory = useMemo(() => {
    if (!activeReceiving) return [] as InboundStatusHistoryEntry[];
    if (activeReceiving.statusHistory && activeReceiving.statusHistory.length > 0) {
      return [...activeReceiving.statusHistory].sort(
        (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
      );
    }
    return [
      {
        status: activeReceiving.status,
        at: activeReceiving.expectedDate,
      },
    ];
  }, [activeReceiving]);

  const currentStatusLevel = useMemo(
    () => getStatusLevel(activeReceiving?.status ?? ""),
    [activeReceiving]
  );

  const taskChecklist = useMemo(() => {
    const steps: Array<{ id: string; label: string; description: string; threshold: number }> = [
      { id: "unload", label: "Unload pallets", description: "Confirm pallet IDs and condition", threshold: 1 },
      { id: "verify", label: "Verify quantities", description: "Scan and reconcile against ASN", threshold: 2 },
      { id: "qa", label: "QA inspection", description: "Log damages and hold reasons", threshold: 3 },
      { id: "stage", label: "Stage for putaway", description: "Release to putaway queue", threshold: 4 },
    ];

    return steps.map((step) => ({
      ...step,
      state: determineTaskState(currentStatusLevel, step.threshold),
    }));
  }, [currentStatusLevel]);

  const appointmentWindowLabel = useMemo(() => {
    if (!activeReceiving?.appointmentWindow) return null;
    const { start, end } = activeReceiving.appointmentWindow;
    return `${format(new Date(start), "dd MMM · HH:mm")} – ${format(new Date(end), "dd MMM · HH:mm")}`;
  }, [activeReceiving]);

  const slaDescriptor = useMemo(() => {
    if (!activeReceiving) return null;
    return formatDistanceToNow(new Date(activeReceiving.expectedDate), { addSuffix: true });
  }, [activeReceiving]);

  const [actionBusy, setActionBusy] = useState(false);

  const handleAddInbound = useCallback(() => {
    setAsnFormMode("add");
    setAsnFormOpen(true);
  }, []);

  const handleEditInbound = useCallback(() => {
    if (!activeReceiving) {
      toast({
        title: "لم يتم اختيار ASN",
        description: "اختر ASN من القائمة قبل التعديل.",
        variant: "destructive",
      });
      return;
    }
    setAsnFormMode("edit");
    setAsnFormOpen(true);
  }, [activeReceiving, toast]);

  const handleDeleteInbound = useCallback(async () => {
    if (!activeReceiving) {
      toast({
        title: "لم يتم اختيار ASN",
        description: "اختر ASN قبل الحذف.",
        variant: "destructive",
      });
      return;
    }

    setActionBusy(true);
    try {
      const response = await fetch(`/api/inventory/asn/${activeReceiving.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to delete ASN");
      }
      toast({
        title: "تم حذف ASN",
        description: `${activeReceiving.reference} تم حذفها بنجاح.`,
      });
      await loadData();
      setSelectedAsnId(null);
    } catch (error) {
      console.error(error);
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل حذف ASN",
        variant: "destructive",
      });
    } finally {
      setActionBusy(false);
    }
  }, [activeReceiving, toast, loadData]);

  const handleStatusChangeInbound = useCallback(async () => {
    if (!activeReceiving) {
      toast({
        title: "لم يتم اختيار ASN",
        description: "اختر ASN قبل تغيير الحالة.",
        variant: "destructive",
      });
      return;
    }

    setActionBusy(true);
    try {
      const response = await fetch(`/api/inventory/asn/${activeReceiving.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Receiving",
        }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to update ASN status");
      }
      toast({
        title: "تم تحديث الحالة",
        description: `${activeReceiving.reference} تم تحديثها إلى Receiving.`,
      });
      await loadData();
    } catch (error) {
      console.error(error);
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل تحديث الحالة",
        variant: "destructive",
      });
    } finally {
      setActionBusy(false);
    }
  }, [activeReceiving, toast, loadData]);

  const handlePreviewInbound = useCallback(() => {
    if (!activeReceiving) {
      toast({
        title: "لم يتم اختيار ASN",
        description: "اختر ASN للمعاينة.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Preview ASN",
      description: `${activeReceiving.reference}`,
    });
  }, [activeReceiving, toast]);

  const handlePrintInbound = useCallback(() => {
    if (!activeReceiving) {
      toast({
        title: "لم يتم اختيار ASN",
        description: "اختر ASN قبل الطباعة.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Print ASN",
      description: `${activeReceiving.reference}`,
    });
  }, [activeReceiving, toast]);

  const handleExportInboundCsv = useCallback(() => {
    toast({
      title: "Export CSV",
      description: "سيتم تفعيل هذه الميزة قريبًا.",
    });
  }, [toast]);

  const handleExportInboundXlsx = useCallback(() => {
    toast({
      title: "Export XLSX",
      description: "سيتم تفعيل هذه الميزة قريبًا.",
    });
  }, [toast]);

  const putawaySuggestions = useMemo(() => {
    if (!activeReceiving) return [] as PutawaySuggestion[];
    return data?.putawaySuggestions?.[activeReceiving.id] ?? [];
  }, [activeReceiving, data?.putawaySuggestions]);

  const activeComplianceNotes = useMemo(() => {
    if (!activeReceiving) return [] as string[];
    const notes = data?.complianceNotes?.[activeReceiving.id] ?? [];
    return notes.length > 0 ? notes : ["No special compliance flags detected for this receipt."];
  }, [activeReceiving, data?.complianceNotes]);

  const activeStagingNotes = useMemo(() => {
    if (!activeReceiving) {
      return [] as string[];
    }
    const notes = data?.stagingNotes?.[activeReceiving.id] ?? [];
    return notes.length > 0
      ? notes
      : [
          "Assign two operators for pallet count back-up.",
          "Flag lot numbers for allergen handling.",
          "Confirm cross-dock items before putaway.",
        ];
  }, [activeReceiving, data?.stagingNotes]);

  const exceptionEvents = useMemo(() => data?.exceptions ?? [], [data?.exceptions]);

  useEffect(() => {
    if (putawaySuggestions.length === 0) {
      setSelectedSuggestionId(null);
      return;
    }
    if (
      !selectedSuggestionId ||
      !putawaySuggestions.some((suggestion) => suggestion.id === selectedSuggestionId)
    ) {
      setSelectedSuggestionId(putawaySuggestions[0].id);
    }
  }, [putawaySuggestions, selectedSuggestionId]);

  const filteredSuggestions = useMemo(() => {
    if (suggestionFilter === "all") return putawaySuggestions;
    return putawaySuggestions.filter((suggestion) => suggestion.reasonTag === suggestionFilter);
  }, [putawaySuggestions, suggestionFilter]);

  const totalCapacity = useMemo(
    () => putawaySuggestions.reduce((sum, suggestion) => sum + suggestion.maxCapacity, 0),
    [putawaySuggestions]
  );

  const assignedSuggestionsCount = acknowledgedSuggestions.size;

  const handleSuggestionAcknowledge = (suggestion: PutawaySuggestion) => {
    setAcknowledgedSuggestions((prev) => new Set(prev).add(suggestion.id));
    setSelectedSuggestionId(suggestion.id);
    toast({
      title: "Putaway assigned",
      description: `${suggestion.location} locked for ${activeReceiving?.reference ?? "document"}.`,
    });
  };

  const handleSuggestionHold = (suggestion: PutawaySuggestion) => {
    toast({
      title: "Suggestion put on hold",
      description: `${suggestion.location} marked for supervisor review.`,
    });
  };

  const handleSuggestionDetails = (suggestion: PutawaySuggestion) => {
    toast({
      title: "Location details",
      description: `${suggestion.location} · ${suggestion.zone} · ${suggestion.temperatureClass} zone`,
    });
  };

  const filteredExceptionEvents = useMemo(() => {
    const filtered = exceptionEvents
      .filter((event) => !showOnlyCurrentAsn || event.asnId === (activeReceiving?.id ?? ""))
      .map((event) => {
        const override = acknowledgedExceptions.get(event.id);
        return override ? { ...event, status: override } : event;
      })
      .filter((event) => {
        if (exceptionFilter === "all") return true;
        if (exceptionFilter === "critical") {
          return event.severity === "Critical";
        }
        return event.status.toLowerCase() === exceptionFilter;
      });

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [
    exceptionEvents,
    showOnlyCurrentAsn,
    activeReceiving?.id,
    exceptionFilter,
    acknowledgedExceptions,
  ]);

  const openExceptionCount = filteredExceptionEvents.filter((event) => event.status === "Open").length;
  const newestOpenEvent = filteredExceptionEvents.find((event) => event.status === "Open");

  const handleExceptionStatusUpdate = (event: ExceptionEvent, status: ExceptionEventStatus) => {
    setAcknowledgedExceptions((prev) => {
      const next = new Map(prev);
      next.set(event.id, status);
      return next;
    });
    setSelectedExceptionId(event.id);
    toast({
      title: `Exception ${status.toLowerCase()}`,
      description: `${event.message} marked as ${status.toLowerCase()}.`,
    });
  };

  const handleEscalateException = (event: ExceptionEvent) => {
    toast({
      title: "Escalated to supervisor",
      description: `${event.message} assigned to control tower oversight.`,
    });
  };

  const handleSortChange = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(option);
    setSortDirection("asc");
  };

  const renderSortIcon = (option: SortOption) => {
    if (sortBy !== option) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const actionBarSelectionLabel = activeReceiving ? `ASN ${activeReceiving.reference}` : "No ASN selected";

  return (
    <div className="space-y-6">
      <InventoryActionBar
        isBusy={isLoading || actionBusy}
        selectionLabel={actionBarSelectionLabel}
        disableEdit={!activeReceiving}
        disableDelete={!activeReceiving}
        disableChangeStatus={!activeReceiving}
        onAdd={handleAddInbound}
        onEdit={handleEditInbound}
        onDelete={handleDeleteInbound}
        onChangeStatus={handleStatusChangeInbound}
        onRefresh={loadData}
        onPreview={handlePreviewInbound}
        onPrint={handlePrintInbound}
        onExportCsv={handleExportInboundCsv}
        onExportXlsx={handleExportInboundXlsx}
      />

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">Receiving Control Tower</h2>
          <p className="text-sm text-muted-foreground">
            Monitor advanced shipping notices, dock assignments, and tasks awaiting completion.
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
            <CardTitle className="text-sm font-medium">Awaiting Arrival</CardTitle>
            <CardDescription>Scheduled inbound loads</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{summary.awaiting}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">At Dock</CardTitle>
            <CardDescription>Currently unloading/receiving</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{summary.docked}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">QC Hold</CardTitle>
            <CardDescription>Shipments pending quality review</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{summary.qcHold}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <Card data-anchor="asn-queue">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>ASN Queue</CardTitle>
                <CardDescription>Track inbound notices, transfers, and returns awaiting action</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 pb-4 lg:flex-row lg:items-center lg:justify-between">
                <Tabs defaultValue="all" value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                  <TabsList className="flex flex-wrap gap-1 bg-transparent p-0">
                    {statusFilterOptions.map((option) => (
                      <TabsTrigger
                        key={option.value}
                        value={option.value}
                        className="rounded-md border bg-muted px-3 py-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground sm:text-sm"
                      >
                        {option.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search reference, partner, or dock"
                      className="pl-8"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSortChange("expectedDate")}
                      className="flex items-center gap-1 whitespace-nowrap"
                    >
                      ETA
                      {renderSortIcon("expectedDate")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSortChange("priority")}
                      className="flex items-center gap-1 whitespace-nowrap"
                    >
                      Priority
                      {renderSortIcon("priority")}
                    </Button>
                  </div>
                </div>
              </div>
              {isLoading && !data ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : data && data.queue.length > 0 ? (
                sortedQueue.length > 0 ? (
                  <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="p-3 text-left font-medium">Reference</th>
                          <th className="p-3 text-left font-medium">Type</th>
                          <th className="p-3 text-left font-medium">Partner</th>
                          <th className="p-3 text-left font-medium">Dock</th>
                          <th className="p-3 text-left font-medium">Expected</th>
                          <th className="p-3 text-left font-medium">Status</th>
                          <th className="p-3 text-left font-medium">Priority</th>
                          <th className="p-3 text-right font-medium">Lines</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedQueue.map((item) => {
                          const isActive = item.id === selectedAsnId;

                          return (
                            <tr
                              key={item.id}
                              onClick={() => setSelectedAsnId(item.id)}
                              className={cn(
                                "border-t cursor-pointer transition-colors",
                                isActive ? "bg-primary/5" : "hover:bg-muted/50"
                              )}
                              aria-selected={isActive}
                            >
                              <td className="p-3 font-medium">{item.reference}</td>
                              <td className="p-3 text-muted-foreground">{item.type}</td>
                              <td className="p-3 text-muted-foreground">{item.partner}</td>
                              <td className="p-3 text-muted-foreground">{item.dock}</td>
                              <td className="p-3 text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {format(new Date(item.expectedDate), "dd MMM yyyy")}
                                </span>
                              </td>
                              <td className="p-3">
                                <span
                                  className={cn(
                                    "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                                    getStatusBadgeClasses(item.status)
                                  )}
                                >
                                  {item.status}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className={cn("inline-flex items-center rounded-full px-2 py-1 text-xs font-medium", priorityStyles[item.priority])}>
                                  {item.priority}
                                </span>
                              </td>
                              <td className="p-3 text-right font-semibold">{item.lines}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    No inbound documents match the selected filters. Try adjusting status, search, or sort options.
                  </div>
                )
              ) : (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No inbound documents scheduled today.
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-anchor="receiving-workspace">
            <CardHeader>
              <CardTitle>Receiving Workspace</CardTitle>
              <CardDescription>Live context for the active ASN and dock activity</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && !data ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : activeReceiving ? (
                <div className="space-y-6">
                  <div className="flex flex-col gap-4 rounded-lg border bg-muted/30 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-lg font-semibold text-slate-900">{activeReceiving.reference}</span>
                          <span className="rounded-md border bg-background px-2 py-0.5 text-xs text-muted-foreground">
                            {activeReceiving.type}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {activeReceiving.assignedTo ?? "Unassigned"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <ClipboardList className="h-3.5 w-3.5" />
                            {activeReceiving.partner}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {format(new Date(activeReceiving.expectedDate), "dd MMM yyyy")}
                          </span>
                          {slaDescriptor && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {slaDescriptor}
                            </span>
                          )}
                          {appointmentWindowLabel && (
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {appointmentWindowLabel}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                            getStatusBadgeClasses(activeReceiving.status)
                          )}
                        >
                          {activeReceiving.status}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                            priorityStyles[activeReceiving.priority]
                          )}
                        >
                          {activeReceiving.priority} priority
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => handleActionClick("Start Receiving")}>
                        <Play className="mr-2 h-4 w-4" />
                        Start
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleActionClick("Pause Receiving")}>
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                      </Button>
                      <Button size="sm" onClick={() => handleActionClick("Complete Receiving")}>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Complete
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleActionClick("Flag Exception")}>
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Flag exception
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-lg border p-4 text-sm">
                      <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
                        <ClipboardList className="h-4 w-4" />
                        Lines
                      </div>
                      <p className="mt-1 text-2xl font-semibold text-slate-900">{activeReceiving.lines}</p>
                      <p className="text-xs text-muted-foreground">Document line count</p>
                    </div>
                    <div className="rounded-lg border p-4 text-sm">
                      <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4" />
                        Units
                      </div>
                      <p className="mt-1 text-2xl font-semibold text-slate-900">
                        {activeReceiving.totalUnits ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">Total handling units</p>
                    </div>
                    <div className="rounded-lg border p-4 text-sm">
                      <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Appointment
                      </div>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {appointmentWindowLabel ?? "No window scheduled"}
                      </p>
                      <p className="text-xs text-muted-foreground">Dock {activeReceiving.dock}</p>
                    </div>
                    <div className="rounded-lg border p-4 text-sm">
                      <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        SLA
                      </div>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{slaDescriptor ?? "No deadline"}</p>
                      <p className="text-xs text-muted-foreground">Based on expected arrival</p>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                    <div className="space-y-3">
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <Clock className="h-4 w-4" />
                        Status timeline
                      </h4>
                      <ol className="relative border-l border-dashed border-muted pl-4">
                        {statusHistory.map((entry, index) => {
                          const isCurrent = index === statusHistory.length - 1;
                          return (
                            <li key={`${entry.status}-${entry.at}`} className="relative mb-4 pl-4 last:mb-0">
                              <span
                                className={cn(
                                  "absolute left-[-9px] top-1.5 h-3 w-3 rounded-full border-2 border-background",
                                  isCurrent ? "bg-primary" : "bg-muted"
                                )}
                              />
                              <p className={cn("text-sm", isCurrent ? "font-semibold text-slate-900" : "text-slate-700")}>{entry.status}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(entry.at), "dd MMM yyyy · HH:mm")} — {formatDistanceToNow(new Date(entry.at), { addSuffix: true })}
                              </p>
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                    <div className="space-y-3">
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <ClipboardList className="h-4 w-4" />
                        Task checklist
                      </h4>
                      <div className="space-y-2">
                        {taskChecklist.map((task) => (
                          <div key={task.id} className="rounded-lg border p-3 text-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-medium text-slate-900">{task.label}</p>
                                <p className="text-xs text-muted-foreground">{task.description}</p>
                              </div>
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold",
                                  taskStateStyles[task.state]
                                )}
                              >
                                {taskStateLabels[task.state]}
                              </span>
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3 text-xs"
                                onClick={() => handleActionClick(`Mark ${task.label} complete`)}
                              >
                                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                Mark done
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-lg border p-4 text-sm">
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <ClipboardList className="h-4 w-4" />
                        Staging notes
                      </h4>
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                        {activeStagingNotes.map((note, index) => (
                          <li key={`staging-${index}`}>{note}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg border p-4 text-sm">
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <AlertTriangle className="h-4 w-4" />
                        Compliance & handling
                      </h4>
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                        {activeComplianceNotes.map((note, index) => (
                          <li key={`compliance-${index}`}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Select an ASN from the queue to activate the receiving workspace.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card data-anchor="putaway-suggestions">
            <CardHeader>
              <CardTitle>Putaway Suggestions</CardTitle>
              <CardDescription>Ranked destinations based on space and velocity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-3 lg:grid-cols-[1.5fr_auto_auto]">
                  <div className="flex flex-wrap items-center gap-2">
                    {putawayFilterOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant={suggestionFilter === option.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSuggestionFilter(option.value)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-slate-900">{putawaySuggestions.length}</span>
                    <span>slots</span>
                    <span className="hidden sm:inline">·</span>
                    <span className="hidden sm:inline">{Math.round(totalCapacity)} max units</span>
                    <span className="hidden sm:inline">·</span>
                    <span className="hidden sm:inline">{assignedSuggestionsCount} assigned</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {viewModeOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant={viewMode === option.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode(option.value)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {filteredSuggestions.length === 0 ? (
                  <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                    No putaway slots match the selected filter. Try viewing alternate or overflow locations.
                  </div>
                ) : viewMode === "card" ? (
                  <div className="grid gap-3">
                    {filteredSuggestions.map((suggestion) => {
                      const isSelected = suggestion.id === selectedSuggestionId;
                      const isAcknowledged = acknowledgedSuggestions.has(suggestion.id);

                      return (
                        <div
                          key={suggestion.id}
                          onClick={() => setSelectedSuggestionId(suggestion.id)}
                          className={cn(
                            "cursor-pointer rounded-lg border p-4 text-sm transition-colors",
                            isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/40"
                          )}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                                #{suggestion.rank}
                              </span>
                              <div>
                                <p className="font-medium text-slate-900">{suggestion.location}</p>
                                <p className="text-xs text-muted-foreground">{suggestion.zone}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-md bg-muted px-2 py-0.5 text-xs uppercase text-muted-foreground">
                                {suggestion.temperatureClass}
                              </span>
                              <span
                                className={cn(
                                  "rounded-md px-2 py-0.5 text-xs font-semibold",
                                  suggestion.reasonTag === "recommended"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : suggestion.reasonTag === "alternate"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-amber-100 text-amber-700"
                                )}
                              >
                                {suggestion.reasonTag === "recommended"
                                  ? "Recommended"
                                  : suggestion.reasonTag === "alternate"
                                  ? "Alternate"
                                  : "Overflow"}
                              </span>
                              {isAcknowledged && (
                                <span className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                                  Assigned
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                            <div>
                              <p className="font-medium text-slate-700">Capacity</p>
                              <p>{Math.round(suggestion.capacityUtilization * 100)}% utilized · {suggestion.maxCapacity} units max</p>
                            </div>
                            <div>
                              <p className="font-medium text-slate-700">Distance</p>
                              <p>{suggestion.distance}</p>
                            </div>
                            <div>
                              <p className="font-medium text-slate-700">Handling notes</p>
                              <p>{suggestion.handlingNotes[0]}</p>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {suggestion.handlingNotes.slice(1).map((note, index) => (
                              <span key={`${suggestion.id}-note-${index}`} className="rounded-md border px-2 py-0.5">
                                {note}
                              </span>
                            ))}
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Button
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleSuggestionAcknowledge(suggestion);
                              }}
                              disabled={isAcknowledged}
                            >
                              Assign
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleSuggestionHold(suggestion);
                              }}
                            >
                              Hold
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleSuggestionDetails(suggestion);
                              }}
                            >
                              Details
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40">
                        <tr>
                          <th className="p-3 text-left font-medium">Rank</th>
                          <th className="p-3 text-left font-medium">Location</th>
                          <th className="p-3 text-left font-medium">Zone</th>
                          <th className="p-3 text-left font-medium">Capacity</th>
                          <th className="p-3 text-left font-medium">Distance</th>
                          <th className="p-3 text-left font-medium">Temperature</th>
                          <th className="p-3 text-left font-medium">Status</th>
                          <th className="p-3 text-right font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSuggestions.map((suggestion) => {
                          const isAcknowledged = acknowledgedSuggestions.has(suggestion.id);
                          return (
                            <tr key={suggestion.id} className="border-t">
                              <td className="p-3">#{suggestion.rank}</td>
                              <td className="p-3">
                                <div className="font-medium text-slate-900">{suggestion.location}</div>
                                <div className="text-xs text-muted-foreground">{suggestion.handlingNotes[0]}</div>
                              </td>
                              <td className="p-3 text-muted-foreground">{suggestion.zone}</td>
                              <td className="p-3 text-muted-foreground">
                                {Math.round(suggestion.capacityUtilization * 100)}% · {suggestion.maxCapacity} units
                              </td>
                              <td className="p-3 text-muted-foreground">{suggestion.distance}</td>
                              <td className="p-3 text-muted-foreground">{suggestion.temperatureClass}</td>
                              <td className="p-3">
                                <span
                                  className={cn(
                                    "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                                    suggestion.reasonTag === "recommended"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : suggestion.reasonTag === "alternate"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-amber-100 text-amber-700"
                                  )}
                                >
                                  {suggestion.reasonTag === "recommended"
                                    ? "Recommended"
                                    : suggestion.reasonTag === "alternate"
                                    ? "Alternate"
                                    : "Overflow"}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSuggestionAcknowledge(suggestion)}
                                    disabled={isAcknowledged}
                                  >
                                    Assign
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleSuggestionHold(suggestion)}
                                  >
                                    Hold
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSuggestionDetails(suggestion)}
                                  >
                                    Details
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
              </div>
            </CardContent>
          </Card>

          <Card data-anchor="exception-timeline">
            <CardHeader>
              <CardTitle>Exception Timeline</CardTitle>
              <CardDescription>Recently reported discrepancies and holds</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    {exceptionFilterOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant={exceptionFilter === option.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setExceptionFilter(option.value)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border"
                        checked={showOnlyCurrentAsn}
                        onChange={(event) => setShowOnlyCurrentAsn(event.target.checked)}
                      />
                      <span>Current ASN only</span>
                    </label>
                    <span className="hidden sm:inline">·</span>
                    <span className="hidden sm:inline">
                      {openExceptionCount} open
                      {newestOpenEvent
                        ? ` · latest ${formatDistanceToNow(new Date(newestOpenEvent.timestamp), { addSuffix: true })}`
                        : ""}
                    </span>
                  </div>
                </div>

                {filteredExceptionEvents.length === 0 ? (
                  <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                    No exceptions to display. Your receiving flow is running smoothly.
                  </div>
                ) : (
                  <ol className="relative border-l border-dashed border-muted pl-4">
                    {filteredExceptionEvents.map((event) => {
                      const isSelected = event.id === selectedExceptionId;
                      const statusStyle = exceptionStatusStyles[event.status];

                      return (
                        <li key={event.id} className="relative mb-5 pl-5 last:mb-0">
                          <span
                            className={cn(
                              "absolute left-[-10px] top-2 h-3 w-3 rounded-full",
                              exceptionSeverityDotClasses[event.severity]
                            )}
                          />
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                              {getExceptionIcon(event.type)}
                              <span>{event.message}</span>
                            </div>
                            <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", statusStyle)}>
                              {event.status}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span>
                              Reported by {event.reportedBy}
                            </span>
                            <span>·</span>
                            <span>{format(new Date(event.timestamp), "dd MMM yyyy · HH:mm")}</span>
                            <span>·</span>
                            <button
                              type="button"
                              className="text-primary underline-offset-4 hover:underline"
                              onClick={() => setSelectedAsnId(event.asnId)}
                            >
                              Go to ASN
                            </button>
                            {event.linkedTaskId && (
                              <span>
                                · Task {event.linkedTaskId}
                              </span>
                            )}
                          </div>
                          {event.notes && (
                            <div className="mt-2 text-sm text-slate-700">
                              {event.notes}
                            </div>
                          )}
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleExceptionStatusUpdate(event, "Acknowledged")}
                              disabled={event.status === "Acknowledged" || event.status === "Resolved"}
                            >
                              Acknowledge
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleExceptionStatusUpdate(event, "Resolved")}
                              disabled={event.status === "Resolved"}
                            >
                              Resolve
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleEscalateException(event)}
                            >
                              Escalate
                            </Button>
                            <button
                              type="button"
                              className="text-primary underline-offset-4 hover:underline"
                              onClick={() =>
                                setSelectedExceptionId((current) => (current === event.id ? null : event.id))
                              }
                            >
                              {isSelected ? "Hide details" : "Show details"}
                            </button>
                          </div>
                          {isSelected && (
                            <div className="mt-3 rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
                              Maintain escalation notes here. Workflow automation will connect to incident tracking in future iterations.
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            </CardContent>
          </Card>

          <Card data-anchor="action-items">
            <CardHeader>
              <CardTitle>Action Items</CardTitle>
              <CardDescription>Focus areas that need operator attention</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && !data ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : data && data.upcomingTasks.length > 0 ? (
                <div className="grid gap-3">
                  {data.upcomingTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`rounded-lg border px-4 py-3 text-sm ${severityStyles[task.severity]}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <p className="text-xs opacity-80">{task.description}</p>
                        </div>
                        <span className="whitespace-nowrap text-xs font-semibold uppercase">
                          {task.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No outstanding tasks. Great job!
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ASN Form Dialog */}
      <AsnForm
        open={asnFormOpen}
        onOpenChange={setAsnFormOpen}
        mode={asnFormMode}
        asn={
          asnFormMode === "edit" && activeReceiving
            ? {
                id: activeReceiving.id,
                reference: activeReceiving.reference,
                type: activeReceiving.type,
                partnerName: activeReceiving.partner,
                dock: activeReceiving.dock,
                status: activeReceiving.status,
                priority: activeReceiving.priority,
                lineCount: activeReceiving.lines,
                totalUnits: activeReceiving.totalUnits,
              }
            : undefined
        }
        onSuccess={loadData}
      />
    </div>
  );
}
