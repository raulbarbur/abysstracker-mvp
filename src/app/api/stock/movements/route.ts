import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-middleware';
import { createAuditLog, PrismaInstance } from '@/lib/audit';

const postMovementSchema = z.object({
  variantId: z.string().min(1, "Variante requerida"),
  type: z.enum(["IN", "ADJUSTMENT", "LOSS", "OUT"]),
  quantity: z.number().int("La cantidad debe ser un entero"),
  reason: z.string().optional(),
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

    const parsed = postMovementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Datos inválidos" }, { status: 400 });
    }

    const { variantId, type, quantity, reason } = parsed.data;

    if (type === "OUT") {
      return NextResponse.json({ error: "El tipo OUT no puede crearse manualmente" }, { status: 400 });
    }

    if (type === "IN" || type === "LOSS") {
      if (quantity <= 0) {
        return NextResponse.json({ error: "La cantidad debe ser mayor a 0" }, { status: 400 });
      }
    }

    if (type === "ADJUSTMENT") {
      if (quantity === 0) {
        return NextResponse.json({ error: "El ajuste no puede ser 0" }, { status: 400 });
      }
    }

    if ((type === "LOSS" || type === "ADJUSTMENT") && (!reason || reason.trim() === "")) {
      return NextResponse.json({ error: "El motivo es requerido para este tipo de movimiento" }, { status: 400 });
    }

    try {
      const result = await prisma.$transaction(async (tx: PrismaInstance) => {
        const [variant] = await tx.$queryRaw<{id: string; active: boolean; currentStock: number}[]>`
          SELECT * FROM "Variant" WHERE id = ${variantId} FOR UPDATE
        `;

        if (!variant || !variant.active) {
          throw new Error('NOT_FOUND');
        }

        let newStock = variant.currentStock;

        if (type === "IN") {
          newStock += quantity;
        } else if (type === "ADJUSTMENT") {
          if (variant.currentStock + quantity < 0) {
            throw new Error('NEGATIVE_ADJUSTMENT');
          }
          newStock += quantity;
        } else if (type === "LOSS") {
          if (variant.currentStock - quantity < 0) {
            throw new Error('NEGATIVE_LOSS');
          }
          newStock -= quantity;
        }

        const movement = await tx.stockMovement.create({
          data: {
            variantId,
            type: type as "IN" | "ADJUSTMENT" | "LOSS",
            quantity,
            reason: reason || null,
            userId: authUser.userId
          }
        });

        await tx.variant.update({
          where: { id: variantId },
          data: { currentStock: newStock }
        });

        return { movement, currentStock: newStock };
      });

      await createAuditLog(prisma, {
        entity: 'StockMovement',
        entityId: result.movement.id,
        action: 'CREATE',
        userId: authUser.userId
      });

      return NextResponse.json(result, { status: 201 });

    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'message' in e) {
        const errorAsMessage = e as { message: string };
        if (errorAsMessage.message === 'NOT_FOUND') {
          return NextResponse.json({ error: "Variante no encontrada o inactiva" }, { status: 404 });
        }
        if (errorAsMessage.message === 'NEGATIVE_ADJUSTMENT') {
          return NextResponse.json({ error: "El ajuste resultaría en stock negativo" }, { status: 400 });
        }
        if (errorAsMessage.message === 'NEGATIVE_LOSS') {
          return NextResponse.json({ error: "Stock insuficiente para registrar la pérdida" }, { status: 400 });
        }
      }
      throw e;
    }

  } catch (error) {
    return NextResponse.json({ error: "Ocurrió un error en el servidor" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const variantId = searchParams.get('variantId');
    const type = searchParams.get('type');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const whereClause: {
      variantId?: string;
      type?: "IN" | "ADJUSTMENT" | "LOSS" | "OUT";
      createdAt?: { gte?: Date; lte?: Date };
    } = {};

    if (variantId) whereClause.variantId = variantId;
    if (type) whereClause.type = type as "IN" | "ADJUSTMENT" | "LOSS" | "OUT";

    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) whereClause.createdAt.gte = new Date(dateFrom);
      if (dateTo) whereClause.createdAt.lte = new Date(dateTo);
    }

    const movements = await prisma.stockMovement.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        variant: {
          include: {
            product: { select: { name: true } }
          }
        },
        user: { select: { username: true } }
      }
    });

    return NextResponse.json({ movements }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Ocurrió un error en el servidor" }, { status: 500 });
  }
}
