import type { ReactNode } from "react";
import { InventoryNav } from "@/components/inventory/inventory-nav";

export default function InventoryLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <InventoryNav />
      <div>{children}</div>
    </div>
  );
}
