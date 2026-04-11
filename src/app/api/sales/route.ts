import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-middleware';
import { createAuditLog, PrismaInstance } from '@/lib/audit';

const saleLineSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().gt(0),
});

const postSaleSchema = z.object({
  lines: z.array(saleLineSchema).min(1, "La venta debe tener al menos una línea"),
});

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });
    }

    const parsed = postSaleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "La venta debe tener al menos una línea" }, { status: 400 });
    }

    const { lines } = parsed.data;

    let transactionResult;
    try {
      transactionResult = await prisma.$transaction(async (tx: PrismaInstance) => {
        const uniqueVariantIds = Array.from(new Set(lines.map(l => l.variantId))).sort();

        const lockedVariants = [];

        for (const vId of uniqueVariantIds) {
          // 1. Lock Row
          await tx.$queryRaw`SELECT 1 FROM "Variant" WHERE id = ${vId} FOR UPDATE`;
          
          const variant = await tx.variant.findUnique({
            where: { id: vId },
            include: { product: true }
          });

          // 2. Verified existence/active
          if (!variant || !variant.active) {
            throw { type: 'NOT_FOUND', id: vId };
          }
          
          // 3. Verify parent product active
          if (!variant.product.active) {
            throw { type: 'PRODUCT_INACTIVE', name: variant.name };
          }

          lockedVariants.push(variant);
        }

        // 4 & 5. Verify quantities across all lines
        const quantityNeeded: Record<string, number> = {};
        for (const line of lines) {
          quantityNeeded[line.variantId] = (quantityNeeded[line.variantId] || 0) + line.quantity;
        }

        for (const vId of Object.keys(quantityNeeded)) {
          const needed = quantityNeeded[vId];
          const varDb = lockedVariants.find(v => v.id === vId);
          if (varDb && varDb.currentStock < needed) {
            throw { type: 'INSUFFICIENT_STOCK', name: varDb.name };
          }
        }

        // 6. Create Sale
        const newSale = await tx.sale.create({
          data: {
            userId: authUser.userId,
            date: new Date(),
            status: 'ACTIVE'
          }
        });

        // 7, 8, 9. Action lines
        for (const line of lines) {
          const varDb = lockedVariants.find(v => v.id === line.variantId);
          if (!varDb) continue;

          await tx.saleLine.create({
            data: {
              saleId: newSale.id,
              variantId: line.variantId,
              quantity: line.quantity,
              unitPrice: varDb.currentPrice
            }
          });

          await tx.stockMovement.create({
            data: {
              variantId: line.variantId,
              type: 'OUT',
              quantity: line.quantity,
              referenceId: newSale.id,
              referenceType: 'SALE',
              userId: authUser.userId
            }
          });

          await tx.variant.update({
            where: { id: line.variantId },
            data: { currentStock: { decrement: line.quantity } }
          });
        }

        return newSale;
      });
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'type' in e) {
        const err = e as { type: string; id?: string; name?: string };
        if (err.type === 'NOT_FOUND') return NextResponse.json({ error: `La variante ${err.id} no fue encontrada o está inactiva` }, { status: 400 });
        if (err.type === 'PRODUCT_INACTIVE') return NextResponse.json({ error: `El producto de la variante ${err.name} está inactivo` }, { status: 400 });
        if (err.type === 'INSUFFICIENT_STOCK') return NextResponse.json({ error: `Stock insuficiente para ${err.name}` }, { status: 400 });
      }
      return NextResponse.json({ error: "Conflicto de stock, intente nuevamente" }, { status: 409 });
    }

    await createAuditLog(prisma, {
      entity: "Sale",
      entityId: transactionResult.id,
      action: "CREATE",
      userId: authUser.userId
    });

    const fullSale = await prisma.sale.findUnique({
      where: { id: transactionResult.id },
      include: { lines: true }
    });

    return NextResponse.json({ sale: fullSale, lines: fullSale?.lines }, { status: 201 });

  } catch (error) {
    return NextResponse.json({ error: "Ocurrió un error en el servidor" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const userId = searchParams.get('userId');

    const whereClause: {
      status?: "ACTIVE" | "CANCELLED";
      userId?: string;
      date?: { gte?: Date; lte?: Date };
    } = {};

    if (status === "ACTIVE" || status === "CANCELLED") {
      whereClause.status = status;
    }
    if (userId) {
      whereClause.userId = userId;
    }
    if (dateFrom || dateTo) {
      whereClause.date = {};
      if (dateFrom) whereClause.date.gte = new Date(dateFrom);
      if (dateTo) whereClause.date.lte = new Date(dateTo);
    }

    const sales = await prisma.sale.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      include: {
        lines: {
          include: {
            variant: { select: { name: true, currentPrice: true } }
          }
        },
        user: { select: { username: true } }
      }
    });

    return NextResponse.json({ sales }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Ocurrió un error en el servidor" }, { status: 500 });
  }
}
