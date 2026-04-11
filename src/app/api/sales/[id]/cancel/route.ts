import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-middleware';
import { createAuditLog, PrismaInstance } from '@/lib/audit';

const cancelSaleSchema = z.object({
  cancellationReason: z.string().min(1, "El motivo es requerido").max(500, "Máximo 500 caracteres"),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const id = params.id;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });
    }

    const parsed = cancelSaleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Datos inválidos" }, { status: 400 });
    }

    const { cancellationReason } = parsed.data;

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { saleLines: true }
    });

    if (!sale) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
    }

    if (sale.status !== 'ACTIVE') {
      return NextResponse.json({ error: "La venta ya se encuentra anulada" }, { status: 400 });
    }

    try {
      const resultSale = await prisma.$transaction(async (tx: PrismaInstance) => {
        const uniqueVariantIds = Array.from(new Set(sale.saleLines.map((l: { variantId: string }) => l.variantId))).sort();

        // Safe locks iteration
        for (const vId of uniqueVariantIds) {
          await tx.$queryRaw`SELECT 1 FROM "Variant" WHERE id = ${vId} FOR UPDATE`;
        }

        const updatedSale = await tx.sale.update({
          where: { id },
          data: {
            status: 'CANCELLED',
            cancellationReason,
            cancellationDate: new Date(),
            cancelledByUserId: authUser.userId
          }
        });

        for (const line of sale.saleLines) {
          await tx.stockMovement.create({
            data: {
              variantId: line.variantId,
              type: 'IN',
              quantity: line.quantity,
              referenceId: updatedSale.id,
              referenceType: 'SALE_CANCELLATION',
              userId: authUser.userId
            }
          });

          await tx.variant.update({
            where: { id: line.variantId },
            data: { currentStock: { increment: line.quantity } }
          });
        }

        return updatedSale;
      });

      await createAuditLog(prisma, {
        entity: "Sale",
        entityId: resultSale.id,
        action: "UPDATE",
        field: "status",
        previousValue: "ACTIVE",
        newValue: "CANCELLED",
        userId: authUser.userId
      });

      return NextResponse.json({ sale: resultSale }, { status: 200 });

    } catch {
      return NextResponse.json({ error: "Conflicto de stock, intente nuevamente" }, { status: 409 });
    }

  } catch {
    return NextResponse.json({ error: "Ocurrió un error en el servidor" }, { status: 500 });
  }
}
