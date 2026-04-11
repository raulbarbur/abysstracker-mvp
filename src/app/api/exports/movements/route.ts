import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-middleware';
import { generateMovementsExport } from '@/lib/exports';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;
    const userId = searchParams.get('userId') || undefined;
    const productId = searchParams.get('productId') || undefined;

    if (dateFrom && dateTo) {
      if (new Date(dateFrom) > new Date(dateTo)) {
        return NextResponse.json({ error: "El rango de fechas es inválido" }, { status: 400 });
      }
    }

    const where: { createdAt?: { gte?: Date; lte?: Date }; userId?: string; variant?: { productId: string } } = {};
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }
    if (userId) where.userId = userId;
    if (productId) where.variant = { productId };

    const count = await prisma.stockMovement.count({ where });
    if (count > 10000) {
      return NextResponse.json({ error: "La exportación supera el límite de 10.000 registros. Acote los filtros." }, { status: 400 });
    }

    const buffer = await generateMovementsExport({ dateFrom, dateTo, userId, productId });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="movimientos.xlsx"',
      }
    });
  } catch {
    return NextResponse.json({ error: "Ocurrió un error en el servidor" }, { status: 500 });
  }
}
