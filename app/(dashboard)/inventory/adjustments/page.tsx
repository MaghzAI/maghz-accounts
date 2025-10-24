import { AdjustmentsDashboard } from "@/components/inventory/adjustments-dashboard";

export default function InventoryAdjustmentsPage() {
  return (
    <div className="space-y-6" data-anchor="inventory-adjustments">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Inventory Adjustments</h1>
        <p className="text-sm text-muted-foreground">
          Govern cycle counts, variance investigations, and approval routing to keep stock accuracy high.
          Detailed workflows and reconciliation tools will be rolled out in future sprints.
        </p>
      </header>

      <AdjustmentsDashboard />
    </div>
  );
}
