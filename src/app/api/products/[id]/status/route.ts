import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-middleware';
import { createAuditLog } from '@/lib/audit';

const patchProductStatusSchema = z.object({
  active: z.boolean(),
});

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

    const parsed = patchProductStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const { active } = parsed.data;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { active }
    });

    if (product.active !== updatedProduct.active) {
      await createAuditLog(prisma, {
        entity: 'Product',
        entityId: updatedProduct.id,
        action: 'UPDATE',
        field: 'active',
        previousValue: String(product.active),
        newValue: String(updatedProduct.active),
        userId: authUser.userId
      });
    }

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Ocurrió un error en el servidor" }, { status: 500 });
  }
}
