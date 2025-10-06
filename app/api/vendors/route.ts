import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { vendors } from "@/lib/db/schema";
import { vendorSchema } from "@/lib/validations/vendor";
import { eq, isNull, or } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// GET /api/vendors - Get all vendors
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allVendors = await db
      .select()
      .from(vendors)
      .where(or(isNull(vendors.deletedAt)))
      .orderBy(vendors.name);

    return NextResponse.json(allVendors);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 }
    );
  }
}

// POST /api/vendors - Create new vendor
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedFields = vendorSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Invalid fields", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, phone, address, taxId, paymentTerms, notes, isActive } = validatedFields.data;

    // Check if vendor with same email already exists
    if (email) {
      const existingVendor = await db
        .select()
        .from(vendors)
        .where(eq(vendors.email, email))
        .limit(1)
        .then((rows) => rows[0]);

      if (existingVendor && !existingVendor.deletedAt) {
        return NextResponse.json(
          { error: "Vendor with this email already exists" },
          { status: 400 }
        );
      }
    }

    // Create vendor
    const newVendor = await db
      .insert(vendors)
      .values({
        id: randomUUID(),
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        taxId: taxId || null,
        paymentTerms: paymentTerms || null,
        notes: notes || null,
        isActive: isActive ?? true,
      })
      .returning()
      .then((rows) => rows[0]);

    return NextResponse.json(newVendor, { status: 201 });
  } catch (error) {
    console.error("Error creating vendor:", error);
    return NextResponse.json(
      { error: "Failed to create vendor" },
      { status: 500 }
    );
  }
}
