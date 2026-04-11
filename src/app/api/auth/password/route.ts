import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-middleware';
import { verifyPassword, hashPassword } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

const passwordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
  newPasswordConfirmation: z.string(),
});

export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    
    if (!authUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    let body;
    try {
      const bodyText = await request.text();
      body = JSON.parse(bodyText);
    } catch (e) {
      return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });
    }

    const parsed = passwordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const { currentPassword, newPassword, newPasswordConfirmation } = parsed.data;

    if (newPassword !== newPasswordConfirmation) {
      return NextResponse.json({ error: "Las contraseñas nuevas no coinciden" }, { status: 400 });
    }

    if (newPassword === currentPassword) {
      return NextResponse.json({ error: "La nueva contraseña debe ser diferente a la actual" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId }
    });

    if (!user || !user.active) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 400 });
    }

    const newPasswordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash }
    });

    await createAuditLog(prisma, {
      entity: 'User',
      entityId: user.id,
      action: 'UPDATE',
      field: 'passwordHash',
      previousValue: '[REDACTED]',
      newValue: '[REDACTED]',
      userId: user.id
    });

    return NextResponse.json({ message: "Contraseña actualizada" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Ocurrió un error en el servidor" }, { status: 500 });
  }
}
