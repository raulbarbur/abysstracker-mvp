import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    const whereClause: { active: boolean; productId?: string } = { active: true };
    
    if (productId) {
      whereClause.productId = productId;
    }

    const variants = await prisma.variant.findMany({
      where: whereClause,
      include: {
        product: { select: { name: true } }
      }
    });

    const stock = variants.map(v => ({
      variantId: v.id,
      variantName: v.name,
      productName: v.product.name,
      currentStock: v.currentStock,
      minimumStock: v.minimumStock,
      currentPrice: Number(v.currentPrice)
    }));

    return NextResponse.json({ stock }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Ocurrió un error en el servidor" }, { status: 500 });
  }
}
