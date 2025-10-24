import { OutboundDashboard } from "@/components/inventory/outbound-dashboard";

export default function InventoryOutboundPage() {
  return (
    <div className="space-y-6" data-anchor="inventory-outbound">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Outbound Operations</h1>
        <p className="text-sm text-muted-foreground">
          Coordinate picking waves, packing progress, and carrier pickups to keep orders flowing on time.
          Detailed wave planners and shipping integrations will be added next.
        </p>
      </header>

      <OutboundDashboard />
    </div>
  );
}
