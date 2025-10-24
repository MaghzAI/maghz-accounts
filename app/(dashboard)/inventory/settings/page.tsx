import { SettingsDashboard } from "@/components/inventory/settings-dashboard";

export default function InventorySettingsPage() {
  return (
    <div className="space-y-6" data-anchor="inventory-settings">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Inventory Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure numbering schemes, policy defaults, integrations, and notifications. Advanced editors
          and role-based overrides will be added in future iterations.
        </p>
      </header>

      <SettingsDashboard />
    </div>
  );
}
