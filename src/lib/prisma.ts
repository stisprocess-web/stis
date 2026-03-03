/**
 * @module lib/prisma
 * Singleton Prisma client instance.
 *
 * In development, the client is cached on `globalThis` to survive HMR reloads
 * without opening excess database connections.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** Shared Prisma client — import this everywhere instead of creating new instances. */
export const prisma: PrismaClient = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
