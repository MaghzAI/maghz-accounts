import { db } from "../lib/db";
import { products, warehouses, inventoryTransactions, stockLevels, users } from "../lib/db/schema";
import { randomUUID } from "crypto";
import { eq, and } from "drizzle-orm";

async function addInitialStock() {
  console.log("🚀 Adding initial stock to all products...\n");

  // Get first user (admin)
  const user = await db.select().from(users).limit(1).then(rows => rows[0]);
  
  if (!user) {
    console.error("❌ No users found in database. Please create a user first.");
    process.exit(1);
  }
  
  console.log("👤 Using user:", user.email, "\n");

  // Get all products
  const allProducts = await db.select().from(products);
  console.log(`📦 Found ${allProducts.length} products\n`);

  // Get first warehouse (or create one if none exists)
  let warehouse = await db.select().from(warehouses).limit(1).then(rows => rows[0]);
  
  if (!warehouse) {
    console.log("📍 No warehouse found, creating default warehouse...");
    const warehouseId = randomUUID();
    warehouse = await db.insert(warehouses).values({
      id: warehouseId,
      code: "WH-001",
      name: "Main Warehouse",
      location: "Default Location",
    }).returning().then(rows => rows[0]);
    console.log("✅ Created warehouse:", warehouse.name, "\n");
  } else {
    console.log("📍 Using warehouse:", warehouse.name, "\n");
  }

  // Add stock for each product
  for (const product of allProducts) {
    // Check if stock already exists
    const existingStock = await db
      .select()
      .from(stockLevels)
      .where(
        and(
          eq(stockLevels.productId, product.id),
          eq(stockLevels.warehouseId, warehouse.id)
        )
      )
      .limit(1)
      .then(rows => rows[0]);

    if (existingStock && existingStock.quantity > 0) {
      console.log(`⏭️  Skipping ${product.name} - already has stock: ${existingStock.quantity}`);
      continue;
    }

    // Add initial stock (100 units with cost price)
    const quantity = 100;
    const unitCost = product.costPrice || 10;
    const totalCost = quantity * unitCost;

    try {
      // Create inventory transaction
      const transactionId = randomUUID();
      await db.insert(inventoryTransactions).values({
        id: transactionId,
        productId: product.id,
        warehouseId: warehouse.id,
        transactionId: null,
        type: "opening-balance",
        quantity: quantity,
        unitCost: unitCost,
        totalCost: totalCost,
        reference: "INITIAL-STOCK",
        notes: "Initial stock added by script",
        userId: user.id,
      });

      // Update or create stock level
      if (existingStock) {
        await db
          .update(stockLevels)
          .set({
            quantity: quantity,
            averageCost: unitCost,
            totalValue: totalCost,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(stockLevels.productId, product.id),
              eq(stockLevels.warehouseId, warehouse.id)
            )
          );
      } else {
        await db.insert(stockLevels).values({
          id: randomUUID(),
          productId: product.id,
          warehouseId: warehouse.id,
          quantity: quantity,
          averageCost: unitCost,
          totalValue: totalCost,
        });
      }

      console.log(`✅ Added stock for ${product.name}: ${quantity} units @ ${unitCost} each`);
    } catch (error) {
      console.error(`❌ Failed to add stock for ${product.name}:`, error);
    }
  }

  console.log("\n🎉 Initial stock added successfully!");
  process.exit(0);
}

addInitialStock().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
