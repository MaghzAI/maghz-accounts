import { WarehouseManager } from "@/components/inventory/warehouse-manager";
import { StorageGroupsPlaceholder } from "@/components/inventory/storage-groups-placeholder";

export default function InventoryMasterDataPage() {
  return (
    <div className="space-y-8" data-anchor="inventory-master-data">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Master Data</h1>
        <p className="text-sm text-muted-foreground">
          Maintain core warehouse information and prepare storage groups for advanced fulfillment flows.
        </p>
      </header>

      <WarehouseManager />

      <StorageGroupsPlaceholder />
    </div>
  );
}
