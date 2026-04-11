import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-middleware';
import { createAuditLog } from '@/lib/audit';

const createVariantSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100, "Máximo 100 caracteres"),
  currentPrice: z.number().gt(0, "El precio debe ser mayor a 0"),
  minimumStock: z.number().int().min(0, "El stock mínimo debe ser 0 o mayor").optional().default(0),
});

export async function POST(request: NextRequest, { params }: { params: { productId: string } }) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const productId = params.productId;

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });
    }

    const parsed = createVariantSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Datos inválidos" }, { status: 400 });
    }

    const { name, currentPrice, minimumStock } = parsed.data;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.active) {
      return NextResponse.json({ error: "Producto no encontrado o inactivo" }, { status: 404 });
    }

    const existingVariant = await prisma.variant.findFirst({
      where: { productId, name }
    });
    if (existingVariant) {
      return NextResponse.json({ error: "El nombre ya existe en este producto" }, { status: 409 });
    }

    const newVariant = await prisma.variant.create({
      data: {
        productId,
        name,
        currentPrice,
        currentStock: 0,
        minimumStock,
        active: true
      }
    });

    await createAuditLog(prisma, {
      entity: 'Variant',
      entityId: newVariant.id,
      action: 'CREATE',
      userId: authUser.userId
    });

    return NextResponse.json(newVariant, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Ocurrió un error en el servidor" }, { status: 500 });
  }
}
