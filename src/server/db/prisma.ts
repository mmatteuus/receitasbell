import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __receitasBellPrisma__: PrismaClient | undefined;
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getPrisma() {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required for multi-tenant Mercado Pago features.");
  }

  if (!globalThis.__receitasBellPrisma__) {
    globalThis.__receitasBellPrisma__ = createPrismaClient();
  }

  return globalThis.__receitasBellPrisma__;
}
