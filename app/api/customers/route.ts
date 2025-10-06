import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { customerSchema } from "@/lib/validations/customer";
import { eq, isNull, or } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// GET /api/customers - Get all customers
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allCustomers = await db
      .select()
      .from(customers)
      .where(or(isNull(customers.deletedAt)))
      .orderBy(customers.name);

    return NextResponse.json(allCustomers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create new customer
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedFields = customerSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Invalid fields", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, phone, address, taxId, creditLimit, notes, isActive } = validatedFields.data;

    // Check if customer with same email already exists
    if (email) {
      const existingCustomer = await db
        .select()
        .from(customers)
        .where(eq(customers.email, email))
        .limit(1)
        .then((rows) => rows[0]);

      if (existingCustomer && !existingCustomer.deletedAt) {
        return NextResponse.json(
          { error: "Customer with this email already exists" },
          { status: 400 }
        );
      }
    }

    // Create customer
    const newCustomer = await db
      .insert(customers)
      .values({
        id: randomUUID(),
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        taxId: taxId || null,
        creditLimit: creditLimit || null,
        notes: notes || null,
        isActive: isActive ?? true,
      })
      .returning()
      .then((rows) => rows[0]);

    return NextResponse.json(newCustomer, { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}
