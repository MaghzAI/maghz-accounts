"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Users, Building2 } from "lucide-react";

export function QuickActions() {
  const actions = [
    {
      label: "New Transaction",
      href: "/transactions",
      icon: Plus,
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      label: "New Account",
      href: "/accounts",
      icon: FileText,
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      label: "New Customer",
      href: "/customers",
      icon: Users,
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      label: "New Vendor",
      href: "/vendors",
      icon: Building2,
      color: "bg-orange-500 hover:bg-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action) => (
        <Link key={action.label} href={action.href}>
          <Button
            variant="outline"
            className="w-full h-20 flex flex-col items-center justify-center gap-2"
          >
            <action.icon className="h-5 w-5" />
            <span className="text-xs">{action.label}</span>
          </Button>
        </Link>
      ))}
    </div>
  );
}
