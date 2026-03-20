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
    // Retorna null ou foca em lançar o erro apenas no uso
    return null as unknown as PrismaClient;
  }

  if (!globalThis.__receitasBellPrisma__) {
    globalThis.__receitasBellPrisma__ = createPrismaClient();
  }

  return globalThis.__receitasBellPrisma__;
}
