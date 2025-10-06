"use client";

import { Menu, Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { signOut, useSession } from "next-auth/react";

export function Header() {
  const { toggleSidebar } = useAppStore();
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
      <Button variant="ghost" size="icon" onClick={toggleSidebar}>
        <Menu className="h-5 w-5" />
      </Button>
      <div className="flex-1" />
      {session?.user && (
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <p className="font-medium">{session.user.name}</p>
            <p className="text-xs text-muted-foreground">{session.user.role}</p>
          </div>
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      )}
    </header>
  );
}
