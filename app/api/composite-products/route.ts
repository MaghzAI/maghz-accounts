import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { compositeProductComponents, products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

// GET /api/composite-products - Get all composite products with their components
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all composite products
    const compositeProducts = await db
      .select()
      .from(products)
      .where(eq(products.isComposite, true));

    // Get components for each composite product
    const productsWithComponents = await Promise.all(
      compositeProducts.map(async (product) => {
        const components = await db
          .select()
          .from(compositeProductComponents)
          .where(eq(compositeProductComponents.compositeProductId, product.id));

        // Get component product details
        const componentsWithDetails = await Promise.all(
          components.map(async (comp) => {
            const componentProduct = await db
              .select()
              .from(products)
              .where(eq(products.id, comp.componentProductId))
              .limit(1)
              .then((rows) => rows[0]);

            return {
              ...comp,
              product: componentProduct,
            };
          })
        );

        return {
          ...product,
          components: componentsWithDetails,
        };
      })
    );

    return NextResponse.json(productsWithComponents);
  } catch (error) {
    console.error("Error fetching composite products:", error);
    return NextResponse.json(
      { error: "Failed to fetch composite products" },
      { status: 500 }
    );
  }
}

// POST /api/composite-products - Add component to composite product
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { compositeProductId, componentProductId, quantity } = body;

    if (!compositeProductId || !componentProductId || !quantity) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newComponent = await db
      .insert(compositeProductComponents)
      .values({
        id: `comp_${Date.now()}`,
        compositeProductId,
        componentProductId,
        quantity: parseFloat(quantity),
      })
      .returning()
      .then((rows) => rows[0]);

    return NextResponse.json(newComponent, { status: 201 });
  } catch (error) {
    console.error("Error creating component:", error);
    return NextResponse.json(
      { error: "Failed to create component" },
      { status: 500 }
    );
  }
}
