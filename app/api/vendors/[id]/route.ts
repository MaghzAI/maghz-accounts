import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { vendors, auditLogs } from "@/lib/db/schema";
import { updateVendorSchema } from "@/lib/validations/vendor";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// GET /api/vendors/[id] - Get single vendor
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

    const vendor = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!vendor || vendor.deletedAt) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json(vendor);
  } catch (error) {
    console.error("Error fetching vendor:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor" },
      { status: 500 }
    );
  }
}

// PATCH /api/vendors/[id] - Update vendor
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
    const validatedFields = updateVendorSchema.safeParse({ ...body, id });

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Invalid fields", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    // Check if vendor exists
    const existingVendor = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!existingVendor || existingVendor.deletedAt) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // If email is being changed, check for duplicates
    if (body.email && body.email !== existingVendor.email) {
      const duplicateEmail = await db
        .select()
        .from(vendors)
        .where(eq(vendors.email, body.email))
        .limit(1)
        .then((rows) => rows[0]);

      if (duplicateEmail && !duplicateEmail.deletedAt) {
        return NextResponse.json(
          { error: "Vendor with this email already exists" },
          { status: 400 }
        );
      }
    }

    // Update vendor
    const updatedVendor = await db
      .update(vendors)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(vendors.id, id))
      .returning()
      .then((rows) => rows[0]);

    // Create audit log
    await db.insert(auditLogs).values({
      id: randomUUID(),
      userId: session.user.id,
      action: "update",
      entityType: "vendor",
      entityId: id,
      changes: JSON.stringify({ before: existingVendor, after: updatedVendor }),
    });

    return NextResponse.json(updatedVendor);
  } catch (error) {
    console.error("Error updating vendor:", error);
    return NextResponse.json(
      { error: "Failed to update vendor" },
      { status: 500 }
    );
  }
}

// DELETE /api/vendors/[id] - Soft delete vendor
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

    // Check if vendor exists
    const existingVendor = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, id))
      .limit(1)
      .then((rows) => rows[0]);

    if (!existingVendor || existingVendor.deletedAt) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // Soft delete
    await db
      .update(vendors)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(vendors.id, id));

    // Create audit log
    await db.insert(auditLogs).values({
      id: randomUUID(),
      userId: session.user.id,
      action: "delete",
      entityType: "vendor",
      entityId: id,
      changes: JSON.stringify({ vendor: existingVendor }),
    });

    return NextResponse.json({ message: "Vendor deleted successfully" });
  } catch (error) {
    console.error("Error deleting vendor:", error);
    return NextResponse.json(
      { error: "Failed to delete vendor" },
      { status: 500 }
    );
  }
}
