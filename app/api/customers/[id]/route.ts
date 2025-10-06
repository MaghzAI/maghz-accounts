import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { customers, auditLogs } from "@/lib/db/schema";
import { updateCustomerSchema } from "@/lib/validations/customer";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// GET /api/customers/[id] - Get single customer
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!customer || customer.deletedAt) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}

// PATCH /api/customers/[id] - Update customer
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedFields = updateCustomerSchema.safeParse({ ...body, id });

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Invalid fields", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    // Check if customer exists
    const existingCustomer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!existingCustomer || existingCustomer.deletedAt) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // If email is being changed, check for duplicates
    if (body.email && body.email !== existingCustomer.email) {
      const duplicateEmail = await db
        .select()
        .from(customers)
        .where(eq(customers.email, body.email))
        .limit(1)
        .then((rows) => rows[0]);

      if (duplicateEmail && !duplicateEmail.deletedAt) {
        return NextResponse.json(
          { error: "Customer with this email already exists" },
          { status: 400 }
        );
      }
    }

    // Update customer
    const updatedCustomer = await db
      .update(customers)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, id))
      .returning()
      .then((rows) => rows[0]);

    // Create audit log
    await db.insert(auditLogs).values({
      id: randomUUID(),
      userId: session.user.id,
      action: "update",
      entityType: "customer",
      entityId: id,
      changes: JSON.stringify({ before: existingCustomer, after: updatedCustomer }),
    });

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/[id] - Soft delete customer
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if customer exists
    const existingCustomer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!existingCustomer || existingCustomer.deletedAt) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Soft delete
    await db
      .update(customers)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(customers.id, id));

    // Create audit log
    await db.insert(auditLogs).values({
      id: randomUUID(),
      userId: session.user.id,
      action: "delete",
      entityType: "customer",
      entityId: id,
      changes: JSON.stringify({ customer: existingCustomer }),
    });

    return NextResponse.json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}
