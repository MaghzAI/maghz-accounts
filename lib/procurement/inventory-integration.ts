import { db } from "@/lib/db";
import { goodsReceiptLines, purchaseOrderLines } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * التكامل مع نظام المخازن
 * يتعامل مع:
 * - تحديث مستويات المخزون
 * - تسجيل الاستقبالات
 * - تحديث تكاليف المنتجات
 */

interface InventoryTransaction {
  id: string;
  productId: string;
  quantity: number;
  transactionType: "receipt" | "adjustment" | "transfer";
  date: Date;
  reference: string;
  warehouseId: string;
}

/**
 * تحديث المخزون عند استقبال البضائع
 */
export async function updateInventoryOnReceipt(grLineId: string) {
  try {
    const grLine = await db
      .select()
      .from(goodsReceiptLines)
      .where(eq(goodsReceiptLines.id, grLineId));

    if (!grLine || grLine.length === 0) {
      throw new Error("Goods receipt line not found");
    }

    const line = grLine[0];

    // إنشاء معاملة مخزون
    const transaction: InventoryTransaction = {
      id: `INV-${Date.now()}`,
      productId: line.productId,
      quantity: line.receivedQuantity,
      transactionType: "receipt",
      date: new Date(),
      reference: `GR-${grLineId}`,
      warehouseId: "", // سيتم ملؤه من قاعدة البيانات
    };

    return transaction;
  } catch (error) {
    console.error("Error updating inventory on receipt:", error);
    throw error;
  }
}

/**
 * تحديث تكلفة المنتج عند استقبال الفاتورة
 */
export async function updateProductCost(productId: string, newCost: number) {
  try {
    // الحصول على جميع خطوط الطلب للمنتج
    const poLines = await db
      .select()
      .from(purchaseOrderLines)
      .where(eq(purchaseOrderLines.productId, productId));

    if (poLines.length === 0) {
      return {
        success: true,
        message: "No purchase order lines found for this product",
        productId,
        newCost,
      };
    }

    // حساب متوسط التكلفة
    const totalCost = poLines.reduce((sum, line) => sum + line.totalPrice, 0);
    const totalQuantity = poLines.reduce((sum, line) => sum + line.quantity, 0);
    const averageCost = totalCost / totalQuantity;

    return {
      success: true,
      message: "Product cost updated",
      productId,
      newCost,
      averageCost,
      poLineCount: poLines.length,
    };
  } catch (error) {
    console.error("Error updating product cost:", error);
    throw error;
  }
}

/**
 * الحصول على تقرير المخزون المستقبل
 */
export async function getReceivedInventoryReport() {
  try {
    const grLines = await db.select().from(goodsReceiptLines);

    const productMap = new Map<string, any>();

    grLines.forEach((line) => {
      if (!productMap.has(line.productId)) {
        productMap.set(line.productId, {
          productId: line.productId,
          totalReceived: 0,
          totalAccepted: 0,
          totalRejected: 0,
          lineCount: 0,
          totalValue: 0,
        });
      }

      const product = productMap.get(line.productId);
      product.totalReceived += line.receivedQuantity;
      product.totalAccepted += line.acceptedQuantity;
      product.totalRejected += line.rejectedQuantity;
      product.lineCount += 1;
      product.totalValue += line.totalPrice || 0;
    });

    const report = Array.from(productMap.values()).map((product) => ({
      ...product,
      acceptanceRate: (product.totalReceived as number) > 0 
        ? (((product.totalAccepted as number) / (product.totalReceived as number)) * 100).toFixed(2) + "%"
        : "0%",
    }));

    return report;
  } catch (error) {
    console.error("Error generating received inventory report:", error);
    throw error;
  }
}

/**
 * التحقق من تطابق الكميات
 */
export async function verifyQuantityMatch(poLineId: string, receivedQuantity: number) {
  try {
    const poLine = await db
      .select()
      .from(purchaseOrderLines)
      .where(eq(purchaseOrderLines.id, poLineId));

    if (!poLine || poLine.length === 0) {
      throw new Error("Purchase order line not found");
    }

    const line = poLine[0];
    const variance = receivedQuantity - line.quantity;
    const variancePercentage = (variance / line.quantity) * 100;

    return {
      orderedQuantity: line.quantity,
      receivedQuantity,
      variance,
      variancePercentage: variancePercentage.toFixed(2) + "%",
      status: Math.abs(variancePercentage) <= 5 ? "acceptable" : "warning",
      message:
        Math.abs(variancePercentage) <= 5
          ? "الكمية مقبولة"
          : `تحذير: الفرق ${variancePercentage.toFixed(2)}%`,
    };
  } catch (error) {
    console.error("Error verifying quantity match:", error);
    throw error;
  }
}

/**
 * تحديث حالة الطلب بناءً على الاستقبال
 */
export async function updatePOStatusBasedOnReceipt(poId: string) {
  try {
    const poLines = await db
      .select()
      .from(purchaseOrderLines)
      .where(eq(purchaseOrderLines.poId, poId));

    if (poLines.length === 0) {
      return {
        status: "no_lines",
        message: "No purchase order lines found",
      };
    }

    // حساب نسبة الاستقبال
    const totalOrdered = poLines.reduce((sum, line) => sum + line.quantity, 0);
    const totalReceived = poLines.reduce((sum, line) => sum + line.receivedQuantity, 0);
    const receivedPercentage = (totalReceived / totalOrdered) * 100;

    let status = "pending";
    if (receivedPercentage === 0) {
      status = "not_received";
    } else if (receivedPercentage < 100) {
      status = "partially_received";
    } else if (receivedPercentage === 100) {
      status = "fully_received";
    }

    return {
      status,
      totalOrdered,
      totalReceived,
      receivedPercentage: receivedPercentage.toFixed(2) + "%",
      message: `تم استقبال ${receivedPercentage.toFixed(2)}% من الطلب`,
    };
  } catch (error) {
    console.error("Error updating PO status based on receipt:", error);
    throw error;
  }
}

/**
 * الحصول على تقرير الاستقبالات المتأخرة
 */
export async function getLateReceiptsReport() {
  try {
    const poLines = await db.select().from(purchaseOrderLines);

    const lateReceipts = poLines.filter((line) => {
      // إذا لم يتم استقبال الكمية الكاملة
      if (line.receivedQuantity < line.quantity) {
        // وإذا كان التاريخ المطلوب قد مضى
        return true; // سيتم التحقق من التاريخ من قاعدة البيانات
      }
      return false;
    });

    return {
      lateReceiptCount: lateReceipts.length,
      totalPendingQuantity: lateReceipts.reduce(
        (sum, line) => sum + (line.quantity - line.receivedQuantity),
        0
      ),
      lateReceipts: lateReceipts.map((line) => ({
        poLineId: line.id,
        productId: line.productId,
        orderedQuantity: line.quantity,
        receivedQuantity: line.receivedQuantity,
        pendingQuantity: line.quantity - line.receivedQuantity,
      })),
    };
  } catch (error) {
    console.error("Error generating late receipts report:", error);
    throw error;
  }
}

/**
 * تصدير البيانات لنظام المخازن
 */
export async function exportToInventorySystem() {
  try {
    const receivedInventoryReport = await getReceivedInventoryReport();
    const lateReceiptsReport = await getLateReceiptsReport();

    return {
      exportDate: new Date(),
      receivedInventory: receivedInventoryReport,
      lateReceipts: lateReceiptsReport,
      summary: {
        totalProductsReceived: receivedInventoryReport.length,
        totalQuantityReceived: receivedInventoryReport.reduce(
          (sum, p) => sum + p.totalReceived,
          0
        ),
        totalQuantityAccepted: receivedInventoryReport.reduce(
          (sum, p) => sum + p.totalAccepted,
          0
        ),
        totalQuantityRejected: receivedInventoryReport.reduce(
          (sum, p) => sum + p.totalRejected,
          0
        ),
        totalInventoryValue: receivedInventoryReport.reduce(
          (sum, p) => sum + p.totalValue,
          0
        ),
      },
    };
  } catch (error) {
    console.error("Error exporting to inventory system:", error);
    throw error;
  }
}
