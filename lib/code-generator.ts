import { db } from "@/lib/db";
import { codeSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function generateCode(entityType: string): Promise<string> {
  try {
    // Get code settings for this entity type
    const settings = await db
      .select()
      .from(codeSettings)
      .where(eq(codeSettings.entityType, entityType))
      .limit(1)
      .then((rows) => rows[0]);

    if (!settings || !settings.isActive) {
      // Return default format if no settings found
      return `${entityType.toUpperCase()}-${Date.now()}`;
    }

    // Increment the current number
    const nextNumber = settings.currentNumber + 1;

    // Update the current number in database
    await db
      .update(codeSettings)
      .set({
        currentNumber: nextNumber,
        updatedAt: new Date(),
      })
      .where(eq(codeSettings.id, settings.id));

    // Generate the code
    const paddedNumber = nextNumber.toString().padStart(settings.digitLength, "0");
    const code = `${settings.prefix}${settings.separator}${paddedNumber}${settings.suffix || ""}`;

    return code;
  } catch (error) {
    console.error("Error generating code:", error);
    // Fallback to timestamp-based code
    return `${entityType.toUpperCase()}-${Date.now()}`;
  }
}

export function generateExample(
  prefix: string,
  separator: string,
  digitLength: number,
  suffix?: string
): string {
  const paddedNumber = "1".padStart(digitLength, "0");
  return `${prefix}${separator}${paddedNumber}${suffix || ""}`;
}

export async function getCodeSettings(entityType: string) {
  try {
    const settings = await db
      .select()
      .from(codeSettings)
      .where(eq(codeSettings.entityType, entityType))
      .limit(1)
      .then((rows) => rows[0]);

    return settings;
  } catch (error) {
    console.error("Error fetching code settings:", error);
    return null;
  }
}

export async function initializeDefaultCodeSettings() {
  const defaultSettings = [
    {
      entityType: "product",
      prefix: "PROD",
      separator: "-",
      digitLength: 4,
      example: "PROD-0001",
    },
    {
      entityType: "warehouse",
      prefix: "WH",
      separator: "-",
      digitLength: 3,
      example: "WH-001",
    },
    {
      entityType: "transaction",
      prefix: "TRX",
      separator: "-",
      digitLength: 5,
      example: "TRX-00001",
    },
    {
      entityType: "customer",
      prefix: "CUST",
      separator: "-",
      digitLength: 4,
      example: "CUST-0001",
    },
    {
      entityType: "vendor",
      prefix: "VEND",
      separator: "-",
      digitLength: 4,
      example: "VEND-0001",
    },
    {
      entityType: "invoice",
      prefix: "INV",
      separator: "-",
      digitLength: 5,
      example: "INV-00001",
    },
    {
      entityType: "journal",
      prefix: "JE",
      separator: "-",
      digitLength: 5,
      example: "JE-00001",
    },
    {
      entityType: "reconciliation",
      prefix: "REC",
      separator: "-",
      digitLength: 4,
      example: "REC-0001",
    },
  ];

  for (const setting of defaultSettings) {
    try {
      // Check if setting already exists
      const existing = await db
        .select()
        .from(codeSettings)
        .where(eq(codeSettings.entityType, setting.entityType))
        .limit(1)
        .then((rows) => rows[0]);

      if (!existing) {
        // Insert new setting
        await db.insert(codeSettings).values({
          id: `code_${setting.entityType}_${Date.now()}`,
          entityType: setting.entityType,
          prefix: setting.prefix,
          separator: setting.separator,
          digitLength: setting.digitLength,
          currentNumber: 0,
          example: setting.example,
          isActive: true,
        });
      }
    } catch (error) {
      console.error(`Error initializing ${setting.entityType} code settings:`, error);
    }
  }
}
