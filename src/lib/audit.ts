import { PrismaClient } from '@prisma/client';

export type PrismaInstance = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export async function createAuditLog(
  prisma: PrismaInstance,
  params: {
    entity: string;
    entityId: string;
    action: "CREATE" | "UPDATE" | "DELETE";
    field?: string;
    previousValue?: string;
    newValue?: string;
    userId: string;
  }
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      entity: params.entity,
      entityId: params.entityId,
      action: params.action,
      field: params.field || null,
      previousValue: params.previousValue || null,
      newValue: params.newValue || null,
      userId: params.userId,
      timestamp: new Date(),
    },
  });
}
