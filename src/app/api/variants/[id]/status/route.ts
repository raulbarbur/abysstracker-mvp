import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-middleware';
import { createAuditLog } from '@/lib/audit';

const patchActiveSchema = z.object({
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

    const parsed = patchActiveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const { active } = parsed.data;

    const variant = await prisma.variant.findUnique({ where: { id } });
    if (!variant) return NextResponse.json({ error: "Variante no encontrada" }, { status: 404 });

    const updatedVariant = await prisma.variant.update({
      where: { id },
      data: { active }
    });

    if (variant.active !== updatedVariant.active) {
      await createAuditLog(prisma, {
        entity: 'Variant',
        entityId: updatedVariant.id,
        action: 'UPDATE',
        field: 'active',
        previousValue: String(variant.active),
        newValue: String(updatedVariant.active),
        userId: authUser.userId
      });
    }

    return NextResponse.json(updatedVariant, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Ocurrió un error en el servidor" }, { status: 500 });
  }
}


export const dynamic = 'force-dynamic';
