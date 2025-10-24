import { TransfersDashboard } from "@/components/inventory/transfers-dashboard";

export default function InventoryTransfersPage() {
  return (
    <div className="space-y-6" data-anchor="inventory-transfers">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Stock Transfers</h1>
        <p className="text-sm text-muted-foreground">
          Coordinate inter-warehouse moves, monitor in-transit stock, and clear checkpoints before receipt.
          Detailed approval flows and variance handling will be added in subsequent iterations.
        </p>
      </header>

      <TransfersDashboard />
    </div>
  );
}
