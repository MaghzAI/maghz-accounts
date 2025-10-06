import { db } from "@/lib/db";
import { defaultSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getDefaultSetting(key: string): Promise<string | null> {
  try {
    const setting = await db
      .select()
      .from(defaultSettings)
      .where(eq(defaultSettings.settingKey, key))
      .limit(1)
      .then((rows) => rows[0]);

    return setting?.settingValue || null;
  } catch (error) {
    console.error("Error fetching default setting:", error);
    return null;
  }
}

export async function getModuleDefaults(module: string) {
  try {
    const settings = await db
      .select()
      .from(defaultSettings)
      .where(eq(defaultSettings.module, module));

    const defaults: Record<string, string> = {};
    settings.forEach((setting) => {
      defaults[setting.settingKey] = setting.settingValue;
    });

    return defaults;
  } catch (error) {
    console.error("Error fetching module defaults:", error);
    return {};
  }
}

export async function initializeDefaultSettings() {
  const settings = [
    // Product defaults
    {
      key: "product_default_unit",
      value: "pcs",
      type: "text",
      module: "product",
      label: "Default Unit",
      description: "Default unit of measurement for products",
    },
    {
      key: "product_default_reorder_level",
      value: "10",
      type: "number",
      module: "product",
      label: "Default Reorder Level",
      description: "Default minimum stock level before reordering",
    },
    {
      key: "product_default_inventory_account",
      value: "",
      type: "account_id",
      module: "product",
      label: "Default Inventory Account",
      description: "Default account for inventory assets",
    },
    {
      key: "product_default_cogs_account",
      value: "",
      type: "account_id",
      module: "product",
      label: "Default COGS Account",
      description: "Default account for cost of goods sold",
    },

    // Sales defaults
    {
      key: "sales_default_ar_account",
      value: "",
      type: "account_id",
      module: "sales",
      label: "Default A/R Account",
      description: "Default accounts receivable account",
    },
    {
      key: "sales_default_revenue_account",
      value: "",
      type: "account_id",
      module: "sales",
      label: "Default Revenue Account",
      description: "Default sales revenue account",
    },
    {
      key: "sales_default_warehouse",
      value: "",
      type: "warehouse_id",
      module: "sales",
      label: "Default Warehouse",
      description: "Default warehouse for sales",
    },

    // Transaction defaults
    {
      key: "transaction_default_type",
      value: "journal",
      type: "text",
      module: "transaction",
      label: "Default Transaction Type",
      description: "Default type for new transactions",
    },

    // Customer defaults
    {
      key: "customer_default_credit_limit",
      value: "10000",
      type: "number",
      module: "customer",
      label: "Default Credit Limit",
      description: "Default credit limit for new customers",
    },

    // Vendor defaults
    {
      key: "vendor_default_payment_terms",
      value: "Net 30",
      type: "text",
      module: "vendor",
      label: "Default Payment Terms",
      description: "Default payment terms for vendors",
    },
  ];

  for (const setting of settings) {
    try {
      const existing = await db
        .select()
        .from(defaultSettings)
        .where(eq(defaultSettings.settingKey, setting.key))
        .limit(1)
        .then((rows) => rows[0]);

      if (!existing) {
        await db.insert(defaultSettings).values({
          id: `default_${setting.key}_${Date.now()}`,
          settingKey: setting.key,
          settingValue: setting.value,
          settingType: setting.type,
          module: setting.module,
          label: setting.label,
          description: setting.description,
          isActive: true,
        });
      }
    } catch (error) {
      console.error(`Error initializing ${setting.key}:`, error);
    }
  }
}
