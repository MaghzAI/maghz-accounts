import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sales, saleItems, products } from "@/lib/db/schema";
import { eq, sql, and, gte, lte, isNull } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const productId = searchParams.get("productId");
    const category = searchParams.get("category");

    // Build date conditions
    const dateConditions = [
      eq(sales.status, "confirmed"),
      isNull(sales.deletedAt)
    ];

    if (dateFrom) {
      dateConditions.push(gte(sales.date, new Date(dateFrom)));
    }
    if (dateTo) {
      dateConditions.push(lte(sales.date, new Date(dateTo)));
    }

    // Get sale items with product info
    const saleItemsData = await db
      .select({
        productId: saleItems.productId,
        productCode: products.code,
        productName: products.name,
        category: products.category,
        unit: products.unit,
        quantity: saleItems.quantity,
        unitPrice: saleItems.unitPrice,
        discount: saleItems.discount,
        tax: saleItems.tax,
        total: saleItems.total,
        costPrice: products.costPrice,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .innerJoin(products, eq(saleItems.productId, products.id))
      .where(and(...dateConditions));

    // Apply filters
    let filtered = saleItemsData;
    
    if (productId) {
      filtered = filtered.filter(item => item.productId === productId);
    }
    
    if (category) {
      filtered = filtered.filter(item => item.category === category);
    }

    // Group by product and calculate profitability
    interface ProfitabilityItem {
      productId: string;
      productCode: string;
      productName: string;
      category: string | null;
      unit: string;
      quantitySold: number;
      salesRevenue: number;
      costOfGoodsSold: number;
      grossProfit: number;
      profitMargin: number | string;
    }

    const profitabilityMap = filtered.reduce((acc, item) => {
      const key = item.productId;
      
      if (!acc[key]) {
        acc[key] = {
          productId: item.productId,
          productCode: item.productCode,
          productName: item.productName,
          category: item.category,
          unit: item.unit,
          quantitySold: 0,
          salesRevenue: 0,
          costOfGoodsSold: 0,
          grossProfit: 0,
          profitMargin: 0,
        };
      }

      const cogs = item.quantity * (item.averageCost || 0);
      const revenue = item.total;
      const profit = revenue - cogs;

      acc[key].quantitySold += item.quantity;
      acc[key].salesRevenue += revenue;
      acc[key].costOfGoodsSold += cogs;
      acc[key].grossProfit += profit;

      return acc;
    }, {} as Record<string, ProfitabilityItem>);

    // Calculate profit margin for each product
    const profitabilityData = Object.values(profitabilityMap).map((item) => ({
      ...item,
      profitMargin: item.salesRevenue > 0 
        ? ((item.grossProfit / item.salesRevenue) * 100).toFixed(2)
        : 0,
    }));

    // Sort by gross profit (highest first)
    profitabilityData.sort((a, b) => b.grossProfit - a.grossProfit);

    // Calculate summary
    const summary = {
      totalProducts: profitabilityData.length,
      totalQuantitySold: profitabilityData.reduce((sum, p) => sum + p.quantitySold, 0),
      totalRevenue: profitabilityData.reduce((sum, p) => sum + p.salesRevenue, 0),
      totalCOGS: profitabilityData.reduce((sum, p) => sum + p.costOfGoodsSold, 0),
      totalProfit: profitabilityData.reduce((sum, p) => sum + p.grossProfit, 0),
      averageMargin: 0,
    };

    summary.averageMargin = summary.totalRevenue > 0
      ? ((summary.totalProfit / summary.totalRevenue) * 100)
      : 0;

    // Group by category
    interface CategorySummary {
      revenue: number;
      cogs: number;
      profit: number;
      margin: number;
    }

    const byCategory = profitabilityData.reduce((acc, item) => {
      const cat = item.category || "Uncategorized";
      if (!acc[cat]) {
        acc[cat] = {
          revenue: 0,
          cogs: 0,
          profit: 0,
          margin: 0,
        };
      }
      acc[cat].revenue += item.salesRevenue;
      acc[cat].cogs += item.costOfGoodsSold;
      acc[cat].profit += item.grossProfit;
      acc[cat].margin = acc[cat].revenue > 0
        ? ((acc[cat].profit / acc[cat].revenue) * 100)
        : 0;
      return acc;
    }, {} as Record<string, CategorySummary>);

    return NextResponse.json({
      data: profitabilityData,
      summary,
      byCategory,
    });
  } catch (error) {
    console.error("Error generating profitability report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
