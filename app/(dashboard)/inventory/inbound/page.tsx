import { InboundDashboard } from "@/components/inventory/inbound-dashboard";

export default function InventoryInboundPage() {
  return (
    <div className="space-y-6" data-anchor="inventory-inbound">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Inbound Operations</h1>
        <p className="text-sm text-muted-foreground">
          Track inbound documents, coordinate dock activities, and highlight action items for receiving teams.
          Processing forms and barcode workflows will follow in upcoming iterations.
        </p>
      </header>

      <InboundDashboard />
    </div>
  );
}
