import { ReportsDashboard } from "@/components/inventory/reports-dashboard";

export default function InventoryReportsPage() {
  return (
    <div className="space-y-6" data-anchor="inventory-reports">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Inventory Reports</h1>
        <p className="text-sm text-muted-foreground">
          Review KPIs, valuation trends, and diagnostic insights to guide daily decisions and long-term planning.
          Interactive charts and drill-downs will be layered in upcoming releases.
        </p>
      </header>

      <ReportsDashboard />
    </div>
  );
}
