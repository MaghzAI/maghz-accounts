import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { products, stockLevels } from "@/lib/db/schema";
import { productSchema } from "@/lib/validations/inventory";
import { eq, isNull, or, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// GET /api/products - Get all products with stock info
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allProducts = await db
      .select({
        id: products.id,
        code: products.code,
        name: products.name,
        description: products.description,
        category: products.category,
        productType: products.productType,
        unit: products.unit,
        costPrice: products.costPrice,
        sellingPrice: products.sellingPrice,
        reorderLevel: products.reorderLevel,
        barcode: products.barcode,
        image: products.image,
        isComposite: products.isComposite,
        inventoryAccountId: products.inventoryAccountId,
        cogsAccountId: products.cogsAccountId,
        isActive: products.isActive,
        createdAt: products.createdAt,
        totalStock: sql<number>`COALESCE((SELECT SUM(quantity) FROM ${stockLevels} WHERE ${stockLevels.productId} = ${products.id}), 0)`,
        totalValue: sql<number>`COALESCE((SELECT SUM(total_value) FROM ${stockLevels} WHERE ${stockLevels.productId} = ${products.id}), 0)`,
        averageCost: sql<number>`CASE WHEN COALESCE((SELECT SUM(quantity) FROM ${stockLevels} WHERE ${stockLevels.productId} = ${products.id}), 0) > 0 THEN COALESCE((SELECT SUM(total_value) FROM ${stockLevels} WHERE ${stockLevels.productId} = ${products.id}), 0) / COALESCE((SELECT SUM(quantity) FROM ${stockLevels} WHERE ${stockLevels.productId} = ${products.id}), 1) ELSE 0 END`,
      })
      .from(products)
      .where(or(isNull(products.deletedAt)))
      .orderBy(products.code);

    return NextResponse.json(allProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/products - Create new product
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedFields = productSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Invalid fields", details: validatedFields.error.flatten() },
        { status: 400 }
      );
    }

    const {
      code,
      name,
      description,
      category,
      productType,
      unit,
      costPrice,
      sellingPrice,
      reorderLevel,
      barcode,
      image,
      isComposite,
      inventoryAccountId,
      cogsAccountId,
      isActive,
    } = validatedFields.data;

    // Check if product with same code already exists
    const existingProduct = await db
      .select()
      .from(products)
      .where(eq(products.code, code))
      .limit(1)
      .then((rows) => rows[0]);

    if (existingProduct && !existingProduct.deletedAt) {
      return NextResponse.json(
        { error: "Product with this code already exists" },
        { status: 400 }
      );
    }

    // Create product
    const newProduct = await db
      .insert(products)
      .values({
        id: randomUUID(),
        code,
        name,
        description: description || null,
        category: category || null,
        productType: productType || "sale",
        unit,
        costPrice,
        sellingPrice,
        reorderLevel: reorderLevel || 0,
        barcode: barcode || null,
        image: image || null,
        isComposite: isComposite ?? false,
        inventoryAccountId,
        cogsAccountId,
        isActive: isActive ?? true,
      })
      .returning()
      .then((rows) => rows[0]);

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
