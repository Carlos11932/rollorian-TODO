import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { config as loadDotenv } from "dotenv";

import { seedDatabase } from "../../../prisma/seed";
const TRUNCATE_ALL_RUNTIME_TABLES_SQL = [
  'TRUNCATE TABLE',
  '"group_audit_changes",',
  '"group_audit_entries",',
  '"item_labels",',
  '"item_assignees",',
  '"items",',
  '"labels",',
  '"memberships",',
  '"spaces",',
  '"groups",',
  '"users"',
  'RESTART IDENTITY CASCADE;',
].join(" ");

const REQUIRED_NEON_SEARCH_PARAMS = {
  channel_binding: "disable",
  sslaccept: "accept_invalid_certs",
} as const;

loadDotenv({ path: new URL("../../../.env.local", import.meta.url).pathname });

function appendRequiredNeonParams(rawUrl: string): string {
  const url = new URL(rawUrl);

  for (const [key, value] of Object.entries(REQUIRED_NEON_SEARCH_PARAMS)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

function resolveConfiguredDatasourceUrl(): string {
  const directUrl = process.env["DATABASE_URL_UNPOOLED"] ?? process.env["DIRECT_URL"];
  const fallbackUrl = process.env["DATABASE_URL"];
  const candidateUrl = directUrl ?? fallbackUrl;

  if (candidateUrl === undefined || candidateUrl.length === 0) {
    throw new Error(
      "Prisma phase-4 integration harness requires DATABASE_URL_UNPOOLED, DIRECT_URL, or DATABASE_URL in .env.local.",
    );
  }

  return appendRequiredNeonParams(candidateUrl);
}

export function hasConfiguredDatasourceUrl(): boolean {
  const directUrl = process.env["DATABASE_URL_UNPOOLED"] ?? process.env["DIRECT_URL"];
  const fallbackUrl = process.env["DATABASE_URL"];
  const candidateUrl = directUrl ?? fallbackUrl;

  return candidateUrl !== undefined && candidateUrl.length > 0;
}

export interface DockerPrismaHarness {
  readonly databaseUrl: string;
  readonly prisma: PrismaClient;
  resetDatabase(): Promise<void>;
  stop(): Promise<void>;
}

export async function createDockerPrismaHarness(): Promise<DockerPrismaHarness> {
  const databaseUrl = resolveConfiguredDatasourceUrl();
  const adapter = new PrismaPg({ connectionString: databaseUrl });

  process.env["DATABASE_URL"] = databaseUrl;
  process.env["DIRECT_URL"] = databaseUrl;
  process.env["DATABASE_URL_UNPOOLED"] = databaseUrl;

  const prisma = new PrismaClient({ adapter });

  async function resetDatabase(): Promise<void> {
    await prisma.$executeRawUnsafe(TRUNCATE_ALL_RUNTIME_TABLES_SQL);
    await seedDatabase(prisma);
  }

  await prisma.$connect();
  await resetDatabase();

  return {
    databaseUrl,
    prisma,
    resetDatabase,
    async stop(): Promise<void> {
      await prisma.$disconnect();
    },
  };
}
