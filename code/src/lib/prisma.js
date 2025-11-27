/**
 * Prisma Client Singleton
 *
 * Ensures a single instance of PrismaClient is used throughout the application
 * to prevent connection pool exhaustion in development with hot reloading.
 */

// code/src/lib/prisma.js

import { PrismaClient } from "@prisma/client";

/**
 * @type {PrismaClient}
 */
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Graceful shutdown handler
 */
export async function disconnectPrisma() {
  await prisma.$disconnect();
}
