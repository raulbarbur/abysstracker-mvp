import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-middleware';
import { createAuditLog } from '@/lib/audit';

const createProductSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100, "Máximo 100 caracteres"),
  variants: z.array(z.object({
    name: z.string().min(1, "Nombre de variante requerido"),
    costPrice: z.number().min(0, "Costo inválido"),
    currentPrice: z.number().min(0.01, "Precio de venta inválido"),
    minimumStock: z.number().int().min(0),
  })).optional()
});

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const activeParam = searchParams.get('active');
    
    let whereClause = {};
    if (activeParam === 'true') {
      whereClause = { active: true };
    } else if (activeParam === 'false') {
      whereClause = { active: false };
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: { variants: true }
    });

    return NextResponse.json({ products }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Ocurrió un error en el servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });
    }

    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Datos inválidos" }, { status: 400 });
    }

    const { name, variants } = parsed.data;

    const existingProduct = await prisma.product.findUnique({ where: { name } });
    if (existingProduct) {
      return NextResponse.json({ error: "El nombre del producto ya existe" }, { status: 409 });
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        active: true,
        variants: variants && variants.length > 0 ? {
          create: variants.map(v => ({
            name: v.name,
            costPrice: v.costPrice,
            currentPrice: v.currentPrice,
            minimumStock: v.minimumStock,
            active: true
          }))
        } : undefined
      },
      include: { variants: true }
    });

    await createAuditLog(prisma, {
      entity: 'Product',
      entityId: newProduct.id,
      action: 'CREATE',
      userId: authUser.userId
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ocurrió un error en el servidor" }, { status: 500 });
  }
}


export const dynamic = 'force-dynamic';
