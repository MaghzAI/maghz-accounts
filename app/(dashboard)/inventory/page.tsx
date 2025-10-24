import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Inventory Overview",
};

export default function InventoryOverviewPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Inventory Control Center</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Start here to review key metrics and jump into inbound, outbound, transfer,
          adjustments, reporting, and configuration workflows.
        </p>
      </header>

      <section className="rounded-lg border bg-muted/30 p-6" data-anchor="inventory-overview">
        <h2 className="text-xl font-semibold">Coming Soon</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Detailed dashboards, guided setup, and KPI summaries will appear here once
          the functional modules are implemented.
        </p>
      </section>
    </div>
  );
}
