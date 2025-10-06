import { db } from "../lib/db";
import { productUnits } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function initializeProductUnits() {
  const units = [
    { name: "Piece", symbol: "pcs", description: "Individual pieces or items" },
    { name: "Kilogram", symbol: "kg", description: "Weight in kilograms" },
    { name: "Gram", symbol: "g", description: "Weight in grams" },
    { name: "Liter", symbol: "L", description: "Volume in liters" },
    { name: "Milliliter", symbol: "ml", description: "Volume in milliliters" },
    { name: "Meter", symbol: "m", description: "Length in meters" },
    { name: "Centimeter", symbol: "cm", description: "Length in centimeters" },
    { name: "Box", symbol: "box", description: "Boxed items" },
    { name: "Carton", symbol: "ctn", description: "Carton packaging" },
    { name: "Dozen", symbol: "doz", description: "12 pieces" },
    { name: "Pack", symbol: "pack", description: "Packaged items" },
    { name: "Set", symbol: "set", description: "Set of items" },
  ];

  for (const unit of units) {
    try {
      const existing = await db
        .select()
        .from(productUnits)
        .where(eq(productUnits.name, unit.name))
        .limit(1)
        .then((rows) => rows[0]);

      if (!existing) {
        await db.insert(productUnits).values({
          id: `unit_${unit.symbol}_${Date.now()}`,
          name: unit.name,
          symbol: unit.symbol,
          description: unit.description,
          isActive: true,
        });
        console.log(`✅ Added unit: ${unit.name} (${unit.symbol})`);
      }
    } catch (error) {
      console.error(`Error adding unit ${unit.name}:`, error);
    }
  }
}

async function main() {
  console.log("🔧 Initializing product units...");
  
  try {
    await initializeProductUnits();
    console.log("✅ Product units initialized successfully!");
  } catch (error) {
    console.error("❌ Error initializing product units:", error);
    process.exit(1);
  }
}

main();
