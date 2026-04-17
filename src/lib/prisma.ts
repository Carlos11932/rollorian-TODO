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

  const datasourceUrl = resolveDatasourceUrl();

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: datasourceUrl }),
  });
}

function resolveDatasourceUrl(): string {
  const datasourceUrl = PRISMA_DATASOURCE_ENV_KEYS.reduce<string | null>((resolved, key) => {
    if (resolved !== null) {
      return resolved;
    }

    const value = process.env[key];
    return typeof value === "string" && value.length > 0 ? value : null;
  }, null);

  if (datasourceUrl === null) {
    throw new Error("Prisma datasource URL could not be resolved from environment.");
  }

  const normalizedUrl = new URL(datasourceUrl);

  for (const [key, value] of Object.entries(REQUIRED_POSTGRES_SEARCH_PARAMS)) {
    normalizedUrl.searchParams.set(key, value);
  }

  return normalizedUrl.toString();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env["NODE_ENV"] !== "production" && hasPrismaDatasourceUrl()) {
  globalForPrisma.prisma = prisma;
}
