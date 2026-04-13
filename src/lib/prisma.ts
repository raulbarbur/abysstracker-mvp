import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { _prisma: PrismaClient | undefined };

// Lazy singleton — PrismaClient is only instantiated on the first actual
// database call, not at module-import time. This prevents Vercel's build
// phase from failing when DATABASE_URL is not available as a build secret.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!globalForPrisma._prisma) {
      globalForPrisma._prisma = new PrismaClient();
    }
    const client = globalForPrisma._prisma;
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(client) : value;
  },
});
