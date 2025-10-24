import { db, warehouses, waves, outboundOrders, shipments, packingTasks, asn, asnStatusHistory, receivingTasks, receivingExceptions } from "@/lib/db";
import { eq, isNull, and, desc } from "drizzle-orm";

/**
 * Warehouse Repository
 * Centralized data access layer for warehouse operations
 */

export async function getWarehouses() {
  try {
    const data = await db
      .select()
      .from(warehouses)
      .where(isNull(warehouses.deletedAt))
      .orderBy(warehouses.createdAt);
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching warehouses:", error);
    return { success: false, error: "Failed to fetch warehouses" };
  }
}

export async function getWarehouseById(id: string) {
  try {
    const data = await db
      .select()
      .from(warehouses)
      .where(eq(warehouses.id, id))
      .limit(1);
    return { success: true, data: data[0] || null };
  } catch (error) {
    console.error("Error fetching warehouse:", error);
    return { success: false, error: "Failed to fetch warehouse" };
  }
}

export async function createWarehouse(payload: {
  code: string;
  name: string;
  location?: string | null;
  manager?: string | null;
  phone?: string | null;
  isActive?: boolean;
}) {
  try {
    const id = `WH-${Date.now()}`;
    const result = await db.insert(warehouses).values({
      id,
      code: payload.code,
      name: payload.name,
      location: payload.location || null,
      manager: payload.manager || null,
      phone: payload.phone || null,
      isActive: payload.isActive ?? true,
    });
    return { success: true, data: { id } };
  } catch (error) {
    console.error("Error creating warehouse:", error);
    if (
      error instanceof Error &&
      error.message.includes("UNIQUE constraint failed")
    ) {
      return { success: false, error: "Warehouse code already exists" };
    }
    return { success: false, error: "Failed to create warehouse" };
  }
}

export async function updateWarehouse(
  id: string,
  payload: {
    code?: string;
    name?: string;
    location?: string | null;
    manager?: string | null;
    phone?: string | null;
    isActive?: boolean;
  }
) {
  try {
    const result = await db
      .update(warehouses)
      .set({
        ...payload,
        updatedAt: new Date(),
      })
      .where(eq(warehouses.id, id));
    return { success: true };
  } catch (error) {
    console.error("Error updating warehouse:", error);
    if (
      error instanceof Error &&
      error.message.includes("UNIQUE constraint failed")
    ) {
      return { success: false, error: "Warehouse code already exists" };
    }
    return { success: false, error: "Failed to update warehouse" };
  }
}

export async function archiveWarehouse(id: string) {
  try {
    const result = await db
      .update(warehouses)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(warehouses.id, id));
    return { success: true };
  } catch (error) {
    console.error("Error archiving warehouse:", error);
    return { success: false, error: "Failed to archive warehouse" };
  }
}

/**
 * Wave Repository
 * Centralized data access layer for wave operations
 */

export async function getWaves() {
  try {
    const data = await db
      .select()
      .from(waves)
      .where(isNull(waves.deletedAt))
      .orderBy(desc(waves.createdAt));
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching waves:", error);
    return { success: false, error: "Failed to fetch waves" };
  }
}

export async function getWaveById(id: string) {
  try {
    const data = await db
      .select()
      .from(waves)
      .where(eq(waves.id, id))
      .limit(1);
    return { success: true, data: data[0] || null };
  } catch (error) {
    console.error("Error fetching wave:", error);
    return { success: false, error: "Failed to fetch wave" };
  }
}

export async function createWave(payload: {
  waveNumber: string;
  name: string;
  pickerTeam?: string | null;
  priorityFocus?: "Low" | "Balanced" | "High";
  startTime?: Date | null;
  notes?: string | null;
}) {
  try {
    const id = `WAVE-${Date.now()}`;
    const result = await db.insert(waves).values({
      id,
      waveNumber: payload.waveNumber,
      name: payload.name,
      pickerTeam: payload.pickerTeam || null,
      priorityFocus: payload.priorityFocus || "Balanced",
      startTime: payload.startTime || null,
      notes: payload.notes || null,
    });
    return { success: true, data: { id } };
  } catch (error) {
    console.error("Error creating wave:", error);
    if (
      error instanceof Error &&
      error.message.includes("UNIQUE constraint failed")
    ) {
      return { success: false, error: "Wave number already exists" };
    }
    return { success: false, error: "Failed to create wave" };
  }
}

export async function updateWave(
  id: string,
  payload: {
    name?: string;
    pickerTeam?: string | null;
    status?: "Draft" | "Scheduled" | "In Progress" | "Completed" | "Cancelled";
    priorityFocus?: "Low" | "Balanced" | "High";
    startTime?: Date | null;
    endTime?: Date | null;
    notes?: string | null;
  }
) {
  try {
    const result = await db
      .update(waves)
      .set({
        ...payload,
        updatedAt: new Date(),
      })
      .where(eq(waves.id, id));
    return { success: true };
  } catch (error) {
    console.error("Error updating wave:", error);
    return { success: false, error: "Failed to update wave" };
  }
}

export async function archiveWave(id: string) {
  try {
    const result = await db
      .update(waves)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(waves.id, id));
    return { success: true };
  } catch (error) {
    console.error("Error archiving wave:", error);
    return { success: false, error: "Failed to archive wave" };
  }
}

/**
 * Outbound Order Repository
 */

export async function getOutboundOrders() {
  try {
    const data = await db
      .select()
      .from(outboundOrders)
      .where(isNull(outboundOrders.deletedAt))
      .orderBy(desc(outboundOrders.createdAt));
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching outbound orders:", error);
    return { success: false, error: "Failed to fetch outbound orders" };
  }
}

export async function getOutboundOrderById(id: string) {
  try {
    const data = await db
      .select()
      .from(outboundOrders)
      .where(eq(outboundOrders.id, id))
      .limit(1);
    return { success: true, data: data[0] || null };
  } catch (error) {
    console.error("Error fetching outbound order:", error);
    return { success: false, error: "Failed to fetch outbound order" };
  }
}

export async function createOutboundOrder(payload: {
  orderNumber: string;
  customerId?: string | null;
  destination?: string | null;
  priority?: "Low" | "Medium" | "High";
  dueDate: Date;
  notes?: string | null;
}) {
  try {
    const id = `ORDER-${Date.now()}`;
    const result = await db.insert(outboundOrders).values({
      id,
      orderNumber: payload.orderNumber,
      customerId: payload.customerId || null,
      destination: payload.destination || null,
      priority: payload.priority || "Medium",
      dueDate: payload.dueDate,
      notes: payload.notes || null,
    });
    return { success: true, data: { id } };
  } catch (error) {
    console.error("Error creating outbound order:", error);
    return { success: false, error: "Failed to create outbound order" };
  }
}

export async function updateOutboundOrder(
  id: string,
  payload: {
    status?: "Draft" | "Waiting pick" | "Assigned" | "Ready for wave" | "Picking" | "Picked" | "Staged" | "Shipped";
    waveId?: string | null;
    priority?: "Low" | "Medium" | "High";
    notes?: string | null;
  }
) {
  try {
    const result = await db
      .update(outboundOrders)
      .set({
        ...payload,
        updatedAt: new Date(),
      })
      .where(eq(outboundOrders.id, id));
    return { success: true };
  } catch (error) {
    console.error("Error updating outbound order:", error);
    return { success: false, error: "Failed to update outbound order" };
  }
}

/**
 * Shipment Repository
 */

export async function getShipments() {
  try {
    const data = await db
      .select()
      .from(shipments)
      .where(isNull(shipments.deletedAt))
      .orderBy(desc(shipments.createdAt));
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching shipments:", error);
    return { success: false, error: "Failed to fetch shipments" };
  }
}

export async function createShipment(payload: {
  shipmentNumber: string;
  carrier: string;
  service: string;
  cartonCount?: number;
  weight?: number;
  plannedPickup?: Date | null;
  trackingNumber?: string | null;
  notes?: string | null;
}) {
  try {
    const id = `SHIP-${Date.now()}`;
    const result = await db.insert(shipments).values({
      id,
      shipmentNumber: payload.shipmentNumber,
      carrier: payload.carrier,
      service: payload.service,
      cartonCount: payload.cartonCount || 0,
      weight: payload.weight || 0,
      plannedPickup: payload.plannedPickup || null,
      trackingNumber: payload.trackingNumber || null,
      notes: payload.notes || null,
    });
    return { success: true, data: { id } };
  } catch (error) {
    console.error("Error creating shipment:", error);
    return { success: false, error: "Failed to create shipment" };
  }
}

export async function updateShipment(
  id: string,
  payload: {
    stage?: "Packing" | "Staged" | "Dispatched" | "In Transit" | "Delivered";
    actualPickup?: Date | null;
    trackingNumber?: string | null;
    notes?: string | null;
  }
) {
  try {
    const result = await db
      .update(shipments)
      .set({
        ...payload,
        updatedAt: new Date(),
      })
      .where(eq(shipments.id, id));
    return { success: true };
  } catch (error) {
    console.error("Error updating shipment:", error);
    return { success: false, error: "Failed to update shipment" };
  }
}

/**
 * ASN (Inbound) Repository
 * Centralized data access layer for inbound/ASN operations
 */

export async function getAsns() {
  try {
    const data = await db
      .select()
      .from(asn)
      .where(isNull(asn.deletedAt))
      .orderBy(desc(asn.createdAt));
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching ASNs:", error);
    return { success: false, error: "Failed to fetch ASNs" };
  }
}

export async function getAsnById(id: string) {
  try {
    const data = await db
      .select()
      .from(asn)
      .where(eq(asn.id, id))
      .limit(1);
    return { success: true, data: data[0] || null };
  } catch (error) {
    console.error("Error fetching ASN:", error);
    return { success: false, error: "Failed to fetch ASN" };
  }
}

export async function createAsn(payload: {
  asnNumber: string;
  reference: string;
  type: "Purchase Order" | "Inter-warehouse Transfer" | "Customer Return";
  partnerName: string;
  partnerId?: string | null;
  dock?: string | null;
  expectedDate: Date;
  appointmentStart?: Date | null;
  appointmentEnd?: Date | null;
  priority?: "Low" | "Medium" | "High";
  notes?: string | null;
}) {
  try {
    const id = `ASN-${Date.now()}`;
    const result = await db.insert(asn).values({
      id,
      asnNumber: payload.asnNumber,
      reference: payload.reference,
      type: payload.type,
      partnerName: payload.partnerName,
      partnerId: payload.partnerId || null,
      dock: payload.dock || null,
      expectedDate: payload.expectedDate,
      appointmentStart: payload.appointmentStart || null,
      appointmentEnd: payload.appointmentEnd || null,
      priority: payload.priority || "Medium",
      notes: payload.notes || null,
    });
    return { success: true, data: { id } };
  } catch (error) {
    console.error("Error creating ASN:", error);
    if (
      error instanceof Error &&
      error.message.includes("UNIQUE constraint failed")
    ) {
      return { success: false, error: "ASN number already exists" };
    }
    return { success: false, error: "Failed to create ASN" };
  }
}

export async function updateAsn(
  id: string,
  payload: {
    status?: "Scheduled" | "Arrived" | "Receiving" | "QC Hold" | "Completed" | "Cancelled";
    priority?: "Low" | "Medium" | "High";
    assignedTo?: string | null;
    notes?: string | null;
  }
) {
  try {
    const result = await db
      .update(asn)
      .set({
        ...payload,
        updatedAt: new Date(),
      })
      .where(eq(asn.id, id));
    return { success: true };
  } catch (error) {
    console.error("Error updating ASN:", error);
    return { success: false, error: "Failed to update ASN" };
  }
}

export async function archiveAsn(id: string) {
  try {
    const result = await db
      .update(asn)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(asn.id, id));
    return { success: true };
  } catch (error) {
    console.error("Error archiving ASN:", error);
    return { success: false, error: "Failed to archive ASN" };
  }
}

export async function addAsnStatusHistory(payload: {
  asnId: string;
  status: string;
  changedBy?: string | null;
  notes?: string | null;
}) {
  try {
    const id = `HISTORY-${Date.now()}`;
    const result = await db.insert(asnStatusHistory).values({
      id,
      asnId: payload.asnId,
      status: payload.status,
      changedAt: new Date(),
      changedBy: payload.changedBy || null,
      notes: payload.notes || null,
    });
    return { success: true };
  } catch (error) {
    console.error("Error adding ASN status history:", error);
    return { success: false, error: "Failed to add status history" };
  }
}

export async function getReceivingTasks(asnId?: string) {
  try {
    let query = db.select().from(receivingTasks);
    if (asnId) {
      query = query.where(eq(receivingTasks.asnId, asnId));
    }
    const data = await query.orderBy(desc(receivingTasks.createdAt));
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching receiving tasks:", error);
    return { success: false, error: "Failed to fetch receiving tasks" };
  }
}

export async function createReceivingTask(payload: {
  asnId: string;
  type: string;
  priority?: "Low" | "Medium" | "High";
  assignedTo?: string | null;
  dueTime?: Date | null;
  notes?: string | null;
}) {
  try {
    const id = `TASK-${Date.now()}`;
    const result = await db.insert(receivingTasks).values({
      id,
      asnId: payload.asnId,
      type: payload.type,
      priority: payload.priority || "Medium",
      assignedTo: payload.assignedTo || null,
      dueTime: payload.dueTime || null,
      notes: payload.notes || null,
    });
    return { success: true, data: { id } };
  } catch (error) {
    console.error("Error creating receiving task:", error);
    return { success: false, error: "Failed to create receiving task" };
  }
}

export async function updateReceivingTask(
  id: string,
  payload: {
    status?: "Pending" | "In Progress" | "Completed" | "On Hold";
    assignedTo?: string | null;
    notes?: string | null;
  }
) {
  try {
    const result = await db
      .update(receivingTasks)
      .set({
        ...payload,
        updatedAt: new Date(),
      })
      .where(eq(receivingTasks.id, id));
    return { success: true };
  } catch (error) {
    console.error("Error updating receiving task:", error);
    return { success: false, error: "Failed to update receiving task" };
  }
}

export async function getReceivingExceptions(asnId?: string) {
  try {
    let query = db.select().from(receivingExceptions);
    if (asnId) {
      query = query.where(eq(receivingExceptions.asnId, asnId));
    }
    const data = await query.orderBy(desc(receivingExceptions.createdAt));
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching receiving exceptions:", error);
    return { success: false, error: "Failed to fetch receiving exceptions" };
  }
}

export async function createReceivingException(payload: {
  asnId: string;
  type: string;
  message: string;
  severity?: "Low" | "Warning" | "Critical";
  reportedBy?: string | null;
  notes?: string | null;
  linkedTaskId?: string | null;
}) {
  try {
    const id = `EXC-${Date.now()}`;
    const result = await db.insert(receivingExceptions).values({
      id,
      asnId: payload.asnId,
      type: payload.type,
      message: payload.message,
      severity: payload.severity || "Warning",
      reportedBy: payload.reportedBy || null,
      timestamp: new Date(),
      notes: payload.notes || null,
      linkedTaskId: payload.linkedTaskId || null,
    });
    return { success: true, data: { id } };
  } catch (error) {
    console.error("Error creating receiving exception:", error);
    return { success: false, error: "Failed to create receiving exception" };
  }
}

export async function updateReceivingException(
  id: string,
  payload: {
    status?: "Open" | "Acknowledged" | "Resolved";
    notes?: string | null;
  }
) {
  try {
    const result = await db
      .update(receivingExceptions)
      .set({
        ...payload,
      })
      .where(eq(receivingExceptions.id, id));
    return { success: true };
  } catch (error) {
    console.error("Error updating receiving exception:", error);
    return { success: false, error: "Failed to update receiving exception" };
  }
}
