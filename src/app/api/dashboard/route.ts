import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setUTCHours(23, 59, 59, 999);

    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [salesTodayData, monthlySalesData, topVariantsRaw, latestMovementsData, lowStockAlertsRaw] = await Promise.all([
      // a) salesToday
      prisma.sale.findMany({
        where: { status: 'ACTIVE', date: { gte: startOfDay, lte: endOfDay } },
        include: { saleLines: true }
      }),
      // a.2) monthlySales
      prisma.sale.findMany({
        where: { status: 'ACTIVE', date: { gte: startOfMonth, lte: endOfDay } },
        include: { saleLines: { include: { variant: true } } }
      }),
      // b) topVariants
      prisma.$queryRaw<{variantId: string; variantName: string; productName: string; totalQuantitySold: unknown}[]>`
        SELECT v.id as "variantId", v.name as "variantName", p.name as "productName", SUM(sl.quantity) as "totalQuantitySold"
        FROM "SaleLine" sl
        JOIN "Sale" s ON s.id = sl."saleId"
        JOIN "Variant" v ON v.id = sl."variantId"
        JOIN "Product" p ON p.id = v."productId"
        WHERE s.status = 'ACTIVE' AND s.date >= ${sevenDaysAgo}
        GROUP BY v.id, v.name, p.name
        ORDER BY "totalQuantitySold" DESC
        LIMIT 5
      `,
      // c) latestMovements
      prisma.stockMovement.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { 
          variant: {
            include: { product: true }
          }, 
          user: true 
        }
      }),
      // d) lowStockAlerts
      prisma.$queryRaw<{variantId: string; variantName: string; productName: string; currentStock: unknown; minimumStock: unknown}[]>`
        SELECT v.id as "variantId", v.name as "variantName", p.name as "productName", v."currentStock" as "currentStock", v."minimumStock" as "minimumStock"
        FROM "Variant" v
        JOIN "Product" p ON p.id = v."productId"
        WHERE v."minimumStock" > 0 AND v."currentStock" < v."minimumStock"
        ORDER BY (v."currentStock" - v."minimumStock") ASC
        LIMIT 10
      `
    ]);

    let totalAmount = 0;
    salesTodayData.forEach((sale: any) => {
      sale.saleLines.forEach((line: any) => {
        totalAmount += Number(line.unitPrice) * line.quantity;
      });
    });
    const salesToday = { count: salesTodayData.length, totalAmount };

    let monthlyRevenue = 0;
    let monthlyCost = 0;
    monthlySalesData.forEach(sale => {
      sale.saleLines.forEach(line => {
        const qty = line.quantity;
        const price = Number(line.unitPrice);
        const cost = Number(line.variant.costPrice);
        monthlyRevenue += price * qty;
        monthlyCost += cost * qty;
      });
    });
    const monthlyStats = {
      revenue: monthlyRevenue,
      profit: monthlyRevenue - monthlyCost,
      count: monthlySalesData.length
    };

    const topVariants = topVariantsRaw.map((r: any) => ({
      variantId: r.variantId,
      variantName: r.variantName,
      productName: r.productName,
      totalQuantitySold: Number(r.totalQuantitySold)
    }));

    const latestMovements = latestMovementsData.map((m: any) => ({
      id: m.id,
      type: m.type,
      quantity: m.quantity,
      variantName: m.variant.name,
      productName: m.variant.product.name,
      username: m.user.username,
      createdAt: m.createdAt
    }));

    const lowStockAlerts = lowStockAlertsRaw.map((r: any) => ({
      variantId: r.variantId,
      variantName: r.variantName,
      productName: r.productName,
      currentStock: Number(r.currentStock),
      minimumStock: Number(r.minimumStock)
    }));

    return NextResponse.json({
      salesToday,
      monthlyStats,
      topVariants,
      latestMovements,
      lowStockAlerts
    }, { status: 200 });

  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Ocurrió un error en el servidor" }, { status: 500 });
  }
}


export const dynamic = 'force-dynamic';
