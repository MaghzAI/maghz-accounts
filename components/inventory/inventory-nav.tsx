"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems: Array<{ label: string; href: string; description: string }> = [
  { label: "Overview", href: "/inventory", description: "Summary & quick links" },
  { label: "Products", href: "/inventory/products", description: "Catalog & stock" },
  { label: "Inbound", href: "/inventory/inbound", description: "Receiving & putaway" },
  { label: "Outbound", href: "/inventory/outbound", description: "Picking & shipping" },
  { label: "Transfers", href: "/inventory/transfers", description: "Inter-warehouse moves" },
  { label: "Adjustments", href: "/inventory/adjustments", description: "Cycle counts & variances" },
  { label: "Reports", href: "/inventory/reports", description: "KPIs & analytics" },
  { label: "Settings", href: "/inventory/settings", description: "Policies & defaults" },
  { label: "Master Data", href: "/inventory/master-data", description: "Units & groups" },
];

export function InventoryNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap items-start justify-between gap-2 rounded-lg border bg-background p-4">
      <div>
        <h2 className="text-lg font-semibold">Inventory Navigation</h2>
        <p className="text-sm text-muted-foreground">
          Jump to a functional area to continue setup.
        </p>
      </div>
      <nav className="flex flex-wrap gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col rounded-md border px-3 py-2 text-left text-sm transition-colors",
                isActive
                  ? "border-primary bg-primary/10 text-primary"
                  : "hover:border-primary/50 hover:text-primary"
              )}
            >
              <span className="font-medium">{item.label}</span>
              <span className="text-xs text-muted-foreground">{item.description}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
