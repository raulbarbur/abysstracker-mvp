import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-middleware';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const id = params.id;

    const variant = await prisma.variant.findUnique({ where: { id } });
    if (!variant) return NextResponse.json({ error: "Variante no encontrada" }, { status: 404 });

    const history = await prisma.priceHistory.findMany({
      where: { variantId: id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ history }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Ocurrió un error en el servidor" }, { status: 500 });
  }
}
