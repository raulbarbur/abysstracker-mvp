import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-middleware';
import { createAuditLog, PrismaInstance } from '@/lib/audit';

const updateVariantSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100, "Máximo 100 caracteres").optional(),
  currentPrice: z.number().gt(0, "El precio debe ser mayor a 0").optional(),
  minimumStock: z.number().int().min(0, "El stock mínimo debe ser 0 o mayor").optional(),
}).refine(data => data.name !== undefined || data.currentPrice !== undefined || data.minimumStock !== undefined, {
  message: "Debes enviar al menos un campo para modificar"
});

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const parsed = updateVariantSchema.safeParse(body);
    if (!parsed.success) {
      const errMessage = parsed.error.issues[0]?.message || "Datos inválidos";
      return NextResponse.json({ error: errMessage === "Required" ? "Datos inválidos" : errMessage }, { status: 400 });
    }

    const { name, currentPrice, minimumStock } = parsed.data;

    const variant = await prisma.variant.findUnique({ where: { id } });
    if (!variant) return NextResponse.json({ error: "Variante no encontrada" }, { status: 404 });

    if (name !== undefined && name !== variant.name) {
      const existingName = await prisma.variant.findFirst({
        where: { productId: variant.productId, name }
      });
      if (existingName) {
        return NextResponse.json({ error: "El nombre ya existe en este producto" }, { status: 409 });
      }
    }

    if (currentPrice !== undefined) {
      if (Number(currentPrice) === Number(variant.currentPrice)) {
        return NextResponse.json({ error: "El precio es igual al actual" }, { status: 400 });
      }
    }

    if (minimumStock !== undefined) {
      if (minimumStock === variant.minimumStock) {
        return NextResponse.json({ error: "El stock mínimo es igual al actual" }, { status: 400 });
      }
    }

    const result = await prisma.$transaction(async (tx: PrismaInstance) => {
      // Locking the row to ensure we read and update sequentially 
      await tx.$queryRaw`SELECT 1 FROM "Variant" WHERE id = ${id} FOR UPDATE`;
      
      const updateData: { name?: string; minimumStock?: number; currentPrice?: number } = {};
      
      if (name !== undefined && name !== variant.name) updateData.name = name;
      if (minimumStock !== undefined && minimumStock !== variant.minimumStock) updateData.minimumStock = minimumStock;
      
      if (currentPrice !== undefined && Number(currentPrice) !== Number(variant.currentPrice)) {
        updateData.currentPrice = currentPrice;
        await tx.priceHistory.create({
          data: {
            variantId: id,
            previousPrice: variant.currentPrice,
            newPrice: currentPrice,
            userId: authUser.userId
          }
        });
      }

      if (Object.keys(updateData).length === 0) {
        return variant;
      }

      const updatedVariant = await tx.variant.update({
        where: { id },
        data: updateData
      });

      if (updateData.name !== undefined) {
        await createAuditLog(tx, { entity: 'Variant', entityId: id, action: 'UPDATE', field: 'name', previousValue: variant.name, newValue: updateData.name, userId: authUser.userId });
      }
      if (updateData.minimumStock !== undefined) {
        await createAuditLog(tx, { entity: 'Variant', entityId: id, action: 'UPDATE', field: 'minimumStock', previousValue: String(variant.minimumStock), newValue: String(updateData.minimumStock), userId: authUser.userId });
      }
      if (updateData.currentPrice !== undefined) {
        await createAuditLog(tx, { entity: 'Variant', entityId: id, action: 'UPDATE', field: 'currentPrice', previousValue: String(variant.currentPrice), newValue: String(updateData.currentPrice), userId: authUser.userId });
      }

      return updatedVariant;
    });

    return NextResponse.json(result, { status: 200 });

  } catch {
    return NextResponse.json({ error: "Ocurrió un error en el servidor" }, { status: 500 });
  }
}
