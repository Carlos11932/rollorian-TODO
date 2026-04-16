import "server-only";

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

const PRISMA_DATASOURCE_ENV_KEYS = [
  "DATABASE_URL_UNPOOLED",
  "DIRECT_URL",
  "DATABASE_URL",
] as const;

function hasPrismaDatasourceUrl(): boolean {
  return PRISMA_DATASOURCE_ENV_KEYS.some((key) => {
    const value = process.env[key];
    return typeof value === "string" && value.length > 0;
  });
}

function createMissingDatasourceProxy(): PrismaClient {
  const message =
    "Prisma runtime access requires DATABASE_URL, DIRECT_URL, or DATABASE_URL_UNPOOLED. The module was imported in an environment without datasource configuration.";

  return new Proxy({} as PrismaClient, {
    get() {
      throw new Error(message);
    },
  });
}

function createPrismaClient(): PrismaClient {
  if (!hasPrismaDatasourceUrl()) {
    return createMissingDatasourceProxy();
  }

  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env["NODE_ENV"] !== "production" && hasPrismaDatasourceUrl()) {
  globalForPrisma.prisma = prisma;
}
