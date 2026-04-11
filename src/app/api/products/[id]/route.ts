import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-middleware';
import { createAuditLog } from '@/lib/audit';

const updateProductSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100, "Máximo 100 caracteres"),
});

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const id = params.id;

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });
    }

    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Datos inválidos" }, { status: 400 });
    }

    const { name } = parsed.data;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    const existingProduct = await prisma.product.findUnique({ where: { name } });
    if (existingProduct && existingProduct.id !== id) {
      return NextResponse.json({ error: "El nombre del producto ya existe" }, { status: 409 });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { name }
    });

    if (product.name !== updatedProduct.name) {
      await createAuditLog(prisma, {
        entity: 'Product',
        entityId: updatedProduct.id,
        action: 'UPDATE',
        field: 'name',
        previousValue: product.name,
        newValue: updatedProduct.name,
        userId: authUser.userId
      });
    }

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Ocurrió un error en el servidor" }, { status: 500 });
  }
}
