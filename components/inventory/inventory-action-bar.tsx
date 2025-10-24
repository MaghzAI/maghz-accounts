"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Eye, FileDown, FileSpreadsheet, Pencil, Plus, Printer, RefreshCcw, Trash2, Wand2 } from "lucide-react";
import { ReactNode, useMemo } from "react";

type ActionDefinition = {
  label: string;
  icon: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  disabledReason?: string;
};

export interface InventoryActionBarProps {
  className?: string;
  selectionLabel?: string;
  isBusy?: boolean;
  disablePrimaryActions?: boolean;
  disableSecondaryActions?: boolean;
  disableAdd?: boolean;
  disableEdit?: boolean;
  disableDelete?: boolean;
  disableChangeStatus?: boolean;
  disablePreview?: boolean;
  disablePrint?: boolean;
  disableExportCsv?: boolean;
  disableExportXlsx?: boolean;
  onAdd?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onChangeStatus?: () => void;
  onRefresh?: () => void;
  onPreview?: () => void;
  onPrint?: () => void;
  onExportCsv?: () => void;
  onExportXlsx?: () => void;
}

function fallback(label: string) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`InventoryActionBar: ${label} action is not wired yet.`);
  }
}

function createAction(
  label: string,
  Icon: ReactNode,
  handler?: () => void,
  disabled?: boolean
): ActionDefinition {
  return {
    label,
    icon: Icon,
    onSelect: handler ?? (() => fallback(label)),
    disabled,
  };
}

export function InventoryActionBar({
  className,
  selectionLabel,
  isBusy = false,
  disablePrimaryActions = false,
  disableSecondaryActions = false,
  disableAdd = false,
  disableEdit = false,
  disableDelete = false,
  disableChangeStatus = false,
  disablePreview = false,
  disablePrint = false,
  disableExportCsv = false,
  disableExportXlsx = false,
  onAdd,
  onEdit,
  onDelete,
  onChangeStatus,
  onRefresh,
  onPreview,
  onPrint,
  onExportCsv,
  onExportXlsx,
}: InventoryActionBarProps) {
  const primaryActions = useMemo(
    () => [
      createAction("Add", <Plus className="h-4 w-4" />, onAdd, disableAdd || disablePrimaryActions || isBusy),
      createAction("Edit", <Pencil className="h-4 w-4" />, onEdit, disableEdit || disablePrimaryActions || isBusy),
      createAction("Delete", <Trash2 className="h-4 w-4" />, onDelete, disableDelete || disablePrimaryActions || isBusy),
      createAction(
        "Change status",
        <Wand2 className="h-4 w-4" />,
        onChangeStatus,
        disableChangeStatus || disablePrimaryActions || isBusy
      ),
    ],
    [
      disableAdd,
      disableChangeStatus,
      disableDelete,
      disableEdit,
      disablePrimaryActions,
      isBusy,
      onAdd,
      onChangeStatus,
      onDelete,
      onEdit,
    ]
  );

  const secondaryActions = useMemo(
    () => [
      createAction(
        "Preview",
        <Eye className="h-4 w-4" />,
        onPreview,
        disablePreview || disableSecondaryActions || isBusy
      ),
      createAction(
        "Print",
        <Printer className="h-4 w-4" />,
        onPrint,
        disablePrint || disableSecondaryActions || isBusy
      ),
      createAction(
        "Export CSV",
        <FileDown className="h-4 w-4" />,
        onExportCsv,
        disableExportCsv || disableSecondaryActions || isBusy
      ),
      createAction(
        "Export XLSX",
        <FileSpreadsheet className="h-4 w-4" />,
        onExportXlsx,
        disableExportXlsx || disableSecondaryActions || isBusy
      ),
    ],
    [
      disableExportCsv,
      disableExportXlsx,
      disablePreview,
      disablePrint,
      disableSecondaryActions,
      isBusy,
      onExportCsv,
      onExportXlsx,
      onPreview,
      onPrint,
    ]
  );

  const refreshAction = useMemo(
    () => createAction("Refresh", <RefreshCcw className="h-4 w-4" />, onRefresh, isBusy),
    [isBusy, onRefresh]
  );

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border bg-card/50 px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {primaryActions.map((action) => (
          <Button
            key={action.label}
            size="sm"
            variant={action.label === "Add" ? "default" : "secondary"}
            onClick={action.onSelect}
            disabled={action.disabled}
          >
            <span className="mr-2 inline-flex items-center justify-center">
              {action.icon}
            </span>
            {action.label}
          </Button>
        ))}
        <Button size="sm" variant="outline" onClick={refreshAction.onSelect} disabled={refreshAction.disabled}>
          <RefreshCcw className={cn("mr-2 h-4 w-4", { "animate-spin": isBusy })} /> Refresh
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {secondaryActions.map((action) => (
          <Button
            key={action.label}
            size="sm"
            variant="outline"
            onClick={action.onSelect}
            disabled={action.disabled}
          >
            <span className="mr-2 inline-flex items-center justify-center text-muted-foreground">{action.icon}</span>
            {action.label}
          </Button>
        ))}
      </div>
      <div className="text-xs text-muted-foreground md:text-right">
        {selectionLabel ?? "No records selected"}
      </div>
    </div>
  );
}
