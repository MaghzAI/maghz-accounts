import { db } from "@/lib/db";
import {
  purchaseOrders,
  purchaseOrderLines,
  goodsReceipts,
  goodsReceiptLines,
  purchaseInvoices,
  purchaseInvoiceLines,
  purchasePayments,
} from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

// ============================================
// PURCHASE ORDERS
// ============================================

export async function createPurchaseOrder(data: {
  vendorId: string;
  warehouseId: string;
  poDate: Date;
  requiredDate?: Date;
  paymentTerms?: string;
  shippingMethod?: string;
  notes?: string;
  createdBy: string;
}) {
  const id = nanoid();
  const poNumber = `PO-${Date.now()}`;

  const result = await db
    .insert(purchaseOrders)
    .values({
      id,
      poNumber,
      vendorId: data.vendorId,
      warehouseId: data.warehouseId,
      poDate: new Date(data.poDate),
      requiredDate: data.requiredDate ? new Date(data.requiredDate) : undefined,
      paymentTerms: data.paymentTerms,
      shippingMethod: data.shippingMethod,
      notes: data.notes,
      createdBy: data.createdBy,
    })
    .returning();

  return result[0];
}

export async function getPurchaseOrders(filters?: {
  status?: string;
  vendorId?: string;
  warehouseId?: string;
  search?: string;
}) {
  let query = db.select().from(purchaseOrders);

  if (filters?.status) {
    query = query.where(eq(purchaseOrders.status, filters.status));
  }

  if (filters?.vendorId) {
    query = query.where(eq(purchaseOrders.vendorId, filters.vendorId));
  }

  if (filters?.warehouseId) {
    query = query.where(eq(purchaseOrders.warehouseId, filters.warehouseId));
  }

  const result = await query.orderBy(desc(purchaseOrders.createdAt));
  return result;
}

export async function getPurchaseOrderById(id: string) {
  const result = await db
    .select()
    .from(purchaseOrders)
    .where(eq(purchaseOrders.id, id));

  return result[0];
}

export async function updatePurchaseOrder(
  id: string,
  data: Partial<typeof purchaseOrders.$inferInsert>
) {
  const result = await db
    .update(purchaseOrders)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(purchaseOrders.id, id))
    .returning();

  return result[0];
}

export async function deletePurchaseOrder(id: string) {
  await db
    .update(purchaseOrders)
    .set({ deletedAt: new Date() })
    .where(eq(purchaseOrders.id, id));
}

export async function approvePurchaseOrder(
  id: string,
  approvedBy: string
) {
  const result = await db
    .update(purchaseOrders)
    .set({
      status: "approved",
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(purchaseOrders.id, id))
    .returning();

  return result[0];
}

// ============================================
// PURCHASE ORDER LINES
// ============================================

export async function addPurchaseOrderLine(data: {
  poId: string;
  lineNumber: number;
  productId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}) {
  const id = nanoid();
  const totalPrice = data.quantity * data.unitPrice;

  const result = await db
    .insert(purchaseOrderLines)
    .values({
      id,
      poId: data.poId,
      lineNumber: data.lineNumber,
      productId: data.productId,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      totalPrice,
      notes: data.notes,
    })
    .returning();

  return result[0];
}

export async function getPurchaseOrderLines(poId: string) {
  const result = await db
    .select()
    .from(purchaseOrderLines)
    .where(eq(purchaseOrderLines.poId, poId));

  return result;
}

// ============================================
// GOODS RECEIPTS
// ============================================

export async function createGoodsReceipt(data: {
  poId: string;
  vendorId: string;
  warehouseId: string;
  grDate: Date;
  notes?: string;
  createdBy: string;
}) {
  const id = nanoid();
  const grNumber = `GR-${Date.now()}`;

  const result = await db
    .insert(goodsReceipts)
    .values({
      id,
      grNumber,
      poId: data.poId,
      vendorId: data.vendorId,
      warehouseId: data.warehouseId,
      grDate: new Date(data.grDate),
      notes: data.notes,
      createdBy: data.createdBy,
    })
    .returning();

  return result[0];
}

export async function getGoodsReceipts(filters?: {
  status?: string;
  poId?: string;
  vendorId?: string;
}) {
  let query = db.select().from(goodsReceipts);

  if (filters?.status) {
    query = query.where(eq(goodsReceipts.status, filters.status));
  }

  if (filters?.poId) {
    query = query.where(eq(goodsReceipts.poId, filters.poId));
  }

  if (filters?.vendorId) {
    query = query.where(eq(goodsReceipts.vendorId, filters.vendorId));
  }

  const result = await query.orderBy(desc(goodsReceipts.createdAt));
  return result;
}

export async function getGoodsReceiptById(id: string) {
  const result = await db
    .select()
    .from(goodsReceipts)
    .where(eq(goodsReceipts.id, id));

  return result[0];
}

export async function acceptGoodsReceipt(
  id: string,
  acceptedBy: string
) {
  const result = await db
    .update(goodsReceipts)
    .set({
      status: "accepted",
      acceptedBy,
      acceptedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(goodsReceipts.id, id))
    .returning();

  return result[0];
}

// ============================================
// GOODS RECEIPT LINES
// ============================================

export async function addGoodsReceiptLine(data: {
  grId: string;
  poLineId: string;
  productId: string;
  lineNumber: number;
  orderedQuantity: number;
  receivedQuantity: number;
  unitPrice: number;
  notes?: string;
}) {
  const id = nanoid();
  const totalPrice = data.receivedQuantity * data.unitPrice;

  const result = await db
    .insert(goodsReceiptLines)
    .values({
      id,
      grId: data.grId,
      poLineId: data.poLineId,
      productId: data.productId,
      lineNumber: data.lineNumber,
      orderedQuantity: data.orderedQuantity,
      receivedQuantity: data.receivedQuantity,
      unitPrice: data.unitPrice,
      totalPrice,
      notes: data.notes,
    })
    .returning();

  return result[0];
}

export async function getGoodsReceiptLines(grId: string) {
  const result = await db
    .select()
    .from(goodsReceiptLines)
    .where(eq(goodsReceiptLines.grId, grId));

  return result;
}

// ============================================
// PURCHASE INVOICES
// ============================================

export async function createPurchaseInvoice(data: {
  vendorId: string;
  poId?: string;
  grId?: string;
  invoiceDate: Date;
  dueDate?: Date;
  vendorInvoiceNumber?: string;
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount?: number;
  notes?: string;
  createdBy: string;
}) {
  const id = nanoid();
  const invoiceNumber = `INV-${Date.now()}`;

  const result = await db
    .insert(purchaseInvoices)
    .values({
      id,
      invoiceNumber,
      vendorId: data.vendorId,
      poId: data.poId,
      grId: data.grId,
      invoiceDate: new Date(data.invoiceDate),
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      vendorInvoiceNumber: data.vendorInvoiceNumber,
      subtotal: data.subtotal,
      taxAmount: data.taxAmount,
      discountAmount: data.discountAmount,
      totalAmount: data.totalAmount,
      notes: data.notes,
      createdBy: data.createdBy,
    })
    .returning();

  return result[0];
}

export async function getPurchaseInvoices(filters?: {
  status?: string;
  vendorId?: string;
  matchingStatus?: string;
}) {
  let query = db.select().from(purchaseInvoices);

  if (filters?.status) {
    query = query.where(eq(purchaseInvoices.status, filters.status));
  }

  if (filters?.vendorId) {
    query = query.where(eq(purchaseInvoices.vendorId, filters.vendorId));
  }

  if (filters?.matchingStatus) {
    query = query.where(
      eq(purchaseInvoices.matchingStatus, filters.matchingStatus)
    );
  }

  const result = await query.orderBy(desc(purchaseInvoices.createdAt));
  return result;
}

export async function getPurchaseInvoiceById(id: string) {
  const result = await db
    .select()
    .from(purchaseInvoices)
    .where(eq(purchaseInvoices.id, id));

  return result[0];
}

export async function updatePurchaseInvoice(
  id: string,
  data: Partial<typeof purchaseInvoices.$inferInsert>
) {
  const result = await db
    .update(purchaseInvoices)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(purchaseInvoices.id, id))
    .returning();

  return result[0];
}

// ============================================
// PURCHASE INVOICE LINES
// ============================================

export async function addPurchaseInvoiceLine(data: {
  invoiceId: string;
  poLineId?: string;
  grLineId?: string;
  productId: string;
  lineNumber: number;
  description?: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}) {
  const id = nanoid();
  const totalPrice = data.quantity * data.unitPrice;

  const result = await db
    .insert(purchaseInvoiceLines)
    .values({
      id,
      invoiceId: data.invoiceId,
      poLineId: data.poLineId,
      grLineId: data.grLineId,
      productId: data.productId,
      lineNumber: data.lineNumber,
      description: data.description,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      totalPrice,
      notes: data.notes,
    })
    .returning();

  return result[0];
}

export async function getPurchaseInvoiceLines(invoiceId: string) {
  const result = await db
    .select()
    .from(purchaseInvoiceLines)
    .where(eq(purchaseInvoiceLines.invoiceId, invoiceId));

  return result;
}

// ============================================
// PURCHASE PAYMENTS
// ============================================

export async function createPurchasePayment(data: {
  invoiceId: string;
  vendorId: string;
  paymentDate: Date;
  paymentMethod: "cash" | "check" | "bank_transfer" | "credit_card";
  amount: number;
  reference?: string;
  notes?: string;
  createdBy: string;
}) {
  const id = nanoid();
  const paymentNumber = `PAY-${Date.now()}`;

  const result = await db
    .insert(purchasePayments)
    .values({
      id,
      paymentNumber,
      invoiceId: data.invoiceId,
      vendorId: data.vendorId,
      paymentDate: new Date(data.paymentDate),
      paymentMethod: data.paymentMethod,
      amount: data.amount,
      reference: data.reference,
      notes: data.notes,
      createdBy: data.createdBy,
    })
    .returning();

  return result[0];
}

export async function getPurchasePayments(filters?: {
  status?: string;
  vendorId?: string;
  invoiceId?: string;
}) {
  let query = db.select().from(purchasePayments);

  if (filters?.status) {
    query = query.where(eq(purchasePayments.status, filters.status));
  }

  if (filters?.vendorId) {
    query = query.where(eq(purchasePayments.vendorId, filters.vendorId));
  }

  if (filters?.invoiceId) {
    query = query.where(eq(purchasePayments.invoiceId, filters.invoiceId));
  }

  const result = await query.orderBy(desc(purchasePayments.createdAt));
  return result;
}

export async function getPurchasePaymentById(id: string) {
  const result = await db
    .select()
    .from(purchasePayments)
    .where(eq(purchasePayments.id, id));

  return result[0];
}

export async function approvePurchasePayment(
  id: string,
  approvedBy: string
) {
  const result = await db
    .update(purchasePayments)
    .set({
      status: "processed",
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(purchasePayments.id, id))
    .returning();

  return result[0];
}
