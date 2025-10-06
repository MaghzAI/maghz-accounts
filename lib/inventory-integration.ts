/**
 * Inventory Integration with Accounting System
 * 
 * This module handles automatic inventory transactions when financial transactions occur
 */

import { db } from "@/lib/db";
import { inventoryTransactions, stockLevels, products, transactionLines } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

interface InventoryItem {
  productId: string;
  warehouseId: string;
  quantity: number;
  unitCost: number;
}

/**
 * Create inventory transaction when purchasing goods
 * Called automatically when a Purchase transaction is created
 */
export async function createPurchaseInventoryTransaction(
  transactionId: string,
  items: InventoryItem[],
  userId: string,
  reference?: string
) {
  const results = [];

  for (const item of items) {
    // Create inventory transaction
    const invTransaction = await db
      .insert(inventoryTransactions)
      .values({
        id: randomUUID(),
        productId: item.productId,
        warehouseId: item.warehouseId,
        transactionId,
        type: "purchase",
        quantity: item.quantity,
        unitCost: item.unitCost,
        totalCost: item.quantity * item.unitCost,
        reference,
        userId,
      })
      .returning()
      .then((rows) => rows[0]);

    // Update stock levels
    await updateStockLevel(item.productId, item.warehouseId, item.quantity, item.unitCost);

    results.push(invTransaction);
  }

  return results;
}

/**
 * Create inventory transaction when selling goods
 * Called automatically when a Sale/Invoice transaction is created
 */
export async function createSaleInventoryTransaction(
  transactionId: string,
  items: InventoryItem[],
  userId: string,
  reference?: string
) {
  const results = [];

  for (const item of items) {
    // Get current average cost from stock levels
    const stockLevel = await db
      .select()
      .from(stockLevels)
      .where(
        and(
          eq(stockLevels.productId, item.productId),
          eq(stockLevels.warehouseId, item.warehouseId)
        )
      )
      .limit(1)
      .then((rows) => rows[0]);

    if (!stockLevel) {
      throw new Error(`No stock found for product ${item.productId} in warehouse ${item.warehouseId}`);
    }

    if (stockLevel.quantity < item.quantity) {
      throw new Error(`Insufficient stock. Available: ${stockLevel.quantity}, Required: ${item.quantity}`);
    }

    const averageCost = stockLevel.averageCost;

    // Create inventory transaction (negative quantity for sale)
    const invTransaction = await db
      .insert(inventoryTransactions)
      .values({
        id: randomUUID(),
        productId: item.productId,
        warehouseId: item.warehouseId,
        transactionId,
        type: "sale",
        quantity: -item.quantity, // Negative for sale
        unitCost: averageCost,
        totalCost: item.quantity * averageCost,
        reference,
        userId,
      })
      .returning()
      .then((rows) => rows[0]);

    // Update stock levels (decrease)
    await updateStockLevel(item.productId, item.warehouseId, -item.quantity, averageCost);

    // Create COGS transaction line
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, item.productId))
      .limit(1)
      .then((rows) => rows[0]);

    if (product) {
      // Add COGS entry to transaction lines
      await db.insert(transactionLines).values({
        id: randomUUID(),
        transactionId,
        accountId: product.cogsAccountId,
        debit: item.quantity * averageCost,
        credit: 0,
        description: `COGS for ${product.name}`,
      });

      // Add Inventory credit entry
      await db.insert(transactionLines).values({
        id: randomUUID(),
        transactionId,
        accountId: product.inventoryAccountId,
        debit: 0,
        credit: item.quantity * averageCost,
        description: `Inventory reduction for ${product.name}`,
      });
    }

    results.push(invTransaction);
  }

  return results;
}

/**
 * Update stock level for a product in a warehouse
 * Uses Average Cost Method
 */
async function updateStockLevel(
  productId: string,
  warehouseId: string,
  quantityChange: number,
  unitCost: number
) {
  // Check if stock level exists
  const existingStock = await db
    .select()
    .from(stockLevels)
    .where(
      and(
        eq(stockLevels.productId, productId),
        eq(stockLevels.warehouseId, warehouseId)
      )
    )
    .limit(1)
    .then((rows) => rows[0]);

  if (!existingStock) {
    // Create new stock level
    await db.insert(stockLevels).values({
      id: randomUUID(),
      productId,
      warehouseId,
      quantity: quantityChange,
      averageCost: unitCost,
      totalValue: quantityChange * unitCost,
      lastUpdated: new Date(),
    });
  } else {
    // Update existing stock level
    const oldQuantity = existingStock.quantity;
    const oldValue = existingStock.totalValue;
    const newQuantity = oldQuantity + quantityChange;

    let newAverageCost = existingStock.averageCost;
    let newTotalValue = oldValue;

    if (quantityChange > 0) {
      // Purchase: recalculate average cost
      const addedValue = quantityChange * unitCost;
      newTotalValue = oldValue + addedValue;
      newAverageCost = newQuantity > 0 ? newTotalValue / newQuantity : 0;
    } else {
      // Sale: use existing average cost
      newTotalValue = newQuantity * existingStock.averageCost;
    }

    await db
      .update(stockLevels)
      .set({
        quantity: newQuantity,
        averageCost: newAverageCost,
        totalValue: newTotalValue,
        lastUpdated: new Date(),
      })
      .where(eq(stockLevels.id, existingStock.id));
  }
}

/**
 * Create inventory adjustment
 * Used for stock corrections, damages, etc.
 */
export async function createInventoryAdjustment(
  productId: string,
  warehouseId: string,
  quantityChange: number,
  reason: string,
  userId: string,
  notes?: string
) {
  // Get product to get current cost
  const product = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!product) {
    throw new Error("Product not found");
  }

  // Get current stock level
  const stockLevel = await db
    .select()
    .from(stockLevels)
    .where(
      and(
        eq(stockLevels.productId, productId),
        eq(stockLevels.warehouseId, warehouseId)
      )
    )
    .limit(1)
    .then((rows) => rows[0]);

  const unitCost = stockLevel?.averageCost || product.costPrice;

  // Create adjustment transaction
  const adjustment = await db
    .insert(inventoryTransactions)
    .values({
      id: randomUUID(),
      productId,
      warehouseId,
      transactionId: null,
      type: "adjustment",
      quantity: quantityChange,
      unitCost,
      totalCost: Math.abs(quantityChange) * unitCost,
      reference: reason,
      notes,
      userId,
    })
    .returning()
    .then((rows) => rows[0]);

  // Update stock level
  await updateStockLevel(productId, warehouseId, quantityChange, unitCost);

  return adjustment;
}

/**
 * Get stock level for a product in a warehouse
 */
export async function getStockLevel(productId: string, warehouseId: string) {
  return await db
    .select()
    .from(stockLevels)
    .where(
      and(
        eq(stockLevels.productId, productId),
        eq(stockLevels.warehouseId, warehouseId)
      )
    )
    .limit(1)
    .then((rows) => rows[0]);
}

/**
 * Get all stock levels for a product across all warehouses
 */
export async function getProductStockLevels(productId: string) {
  return await db
    .select()
    .from(stockLevels)
    .where(eq(stockLevels.productId, productId));
}

/**
 * Check if sufficient stock is available
 */
export async function checkStockAvailability(
  productId: string,
  warehouseId: string,
  requiredQuantity: number
): Promise<{ available: boolean; currentStock: number }> {
  const stockLevel = await getStockLevel(productId, warehouseId);
  
  if (!stockLevel) {
    return { available: false, currentStock: 0 };
  }

  return {
    available: stockLevel.quantity >= requiredQuantity,
    currentStock: stockLevel.quantity,
  };
}
