import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-middleware';
import { generateSalesExport } from '@/lib/exports';
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

    const where: { date?: { gte?: Date; lte?: Date }; userId?: string; lines?: { some: { variant: { productId: string } } } } = {};
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }
    if (userId) where.userId = userId;
    if (productId) where.lines = { some: { variant: { productId } } };

    const count = await prisma.sale.count({ where });
    if (count > 10000) {
      return NextResponse.json({ error: "La exportación supera el límite de 10.000 registros. Acote los filtros." }, { status: 400 });
    }

    const buffer = await generateSalesExport({ dateFrom, dateTo, userId, productId });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="ventas.xlsx"',
      }
    });
  } catch {
    return NextResponse.json({ error: "Ocurrió un error en el servidor" }, { status: 500 });
  }
}
