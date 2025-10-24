import { POForm } from "@/components/procurement/purchase-orders/po-form";
import { db } from "@/lib/db";
import { vendors, warehouses, products } from "@/lib/db/schema";

export default async function NewPurchaseOrderPage() {
  // Fetch vendors, warehouses, and products
  const vendorsList = await db.select().from(vendors);
  const warehousesList = await db.select().from(warehouses);
  const productsList = await db.select().from(products);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <POForm
        vendors={vendorsList}
        warehouses={warehousesList}
        products={productsList}
      />
    </div>
  );
}
