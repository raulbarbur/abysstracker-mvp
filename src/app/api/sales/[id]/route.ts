import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-middleware';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const id = params.id;

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        saleLines: {
          include: {
            variant: {
              include: { product: true }
            }
          }
        },
        user: true,
        invoice: { select: { id: true, invoiceNumber: true } }
      }
    });

    if (!sale) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ sale }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Ocurrió un error en el servidor" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { cancellationReason } = body;
    if (!cancellationReason || cancellationReason.trim().length === 0 || cancellationReason.length > 500) {
      return NextResponse.json({ error: "Debe proporcionar un motivo de anulación válido (máximo 500 caracteres)" }, { status: 400 });
    }

    const transactionResult = await prisma.$transaction(async (tx) => {
      // 1. Verificar si la venta existe y su estado actual
      const sale = await tx.sale.findUnique({
        where: { id },
        include: { saleLines: true }
      });

      if (!sale) {
        throw { type: 'NOT_FOUND' };
      }
      
      if (sale.status === 'CANCELLED') {
        throw { type: 'ALREADY_CANCELLED' };
      }

      // 2. Marcar como cancelada
      const updatedSale = await tx.sale.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancellationReason: cancellationReason.trim(),
          cancellationDate: new Date(),
          cancelledByUserId: authUser.userId
        }
      });

      // 3. Devolver el stock
      for (const line of sale.saleLines) {
        await tx.stockMovement.create({
          data: {
            variantId: line.variantId,
            type: 'IN',
            quantity: line.quantity,
            reason: `Anulación de venta: ${id}`,
            referenceId: id,
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

    return NextResponse.json({ sale: transactionResult }, { status: 200 });

  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'type' in e) {
      const err = e as { type: string };
      if (err.type === 'NOT_FOUND') return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
      if (err.type === 'ALREADY_CANCELLED') return NextResponse.json({ error: "La venta ya fue anulada previamente" }, { status: 400 });
    }
    return NextResponse.json({ error: "Ocurrió un error en el servidor al intentar anular la venta" }, { status: 500 });
  }
}
