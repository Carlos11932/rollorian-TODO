import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

const PRISMA_DATASOURCE_ENV_KEYS = [
  "DATABASE_URL_UNPOOLED",
  "DIRECT_URL",
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_URL",
] as const;

const REQUIRED_POSTGRES_SEARCH_PARAMS = {
  channel_binding: "disable",
  sslaccept: "accept_invalid_certs",
} as const;

function hasPrismaDatasourceUrl(): boolean {
  return PRISMA_DATASOURCE_ENV_KEYS.some((key) => {
    const value = process.env[key];
    return typeof value === "string" && value.length > 0;
  });
}

function createMissingDatasourceProxy(): PrismaClient {
  const message =
    "Prisma runtime access requires DATABASE_URL, DATABASE_URL_UNPOOLED, DIRECT_URL, or POSTGRES_* datasource variables. The module was imported in an environment without datasource configuration.";

  return new Proxy({} as PrismaClient, {
    get() {
      throw new Error(message);
    },
  });
}

function resolveDatasourceUrl(): string | undefined {
  const datasourceUrl = PRISMA_DATASOURCE_ENV_KEYS.reduce<string | undefined>((resolved, key) => {
    if (resolved !== undefined) {
      return resolved;
    }

    const value = process.env[key];
    return typeof value === "string" && value.length > 0 ? value : undefined;
  }, undefined);

  if (datasourceUrl === undefined) {
    return undefined;
  }

  const normalizedUrl = new URL(datasourceUrl);

  for (const [key, value] of Object.entries(REQUIRED_POSTGRES_SEARCH_PARAMS)) {
    normalizedUrl.searchParams.set(key, value);
  }

  return normalizedUrl.toString();
}

function createPrismaClient(): PrismaClient {
  const datasourceUrl = resolveDatasourceUrl();

  if (datasourceUrl === undefined) {
    return createMissingDatasourceProxy();
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: datasourceUrl }),
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env["NODE_ENV"] !== "production" && hasPrismaDatasourceUrl()) {
  globalForPrisma.prisma = prisma;
}
