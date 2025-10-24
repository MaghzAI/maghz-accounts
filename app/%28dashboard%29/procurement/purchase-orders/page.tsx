import { POList } from "@/components/procurement/purchase-orders/po-list";

export default function PurchaseOrdersPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <POList />
    </div>
  );
}
