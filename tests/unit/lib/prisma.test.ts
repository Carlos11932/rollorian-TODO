import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const PRISMA_ENV_KEYS = [
  "DATABASE_URL_UNPOOLED",
  "DIRECT_URL",
  "DATABASE_URL",
] as const;

async function importPrismaModule() {
  vi.resetModules();
  return import("@/lib/prisma");
}

describe("prisma runtime bootstrap", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  it("does not throw during import when datasource env vars are missing", async () => {
    for (const key of PRISMA_ENV_KEYS) {
      delete process.env[key];
    }

    await expect(importPrismaModule()).resolves.toHaveProperty("prisma");
  });

  it("throws only when the proxy client is actually used without datasource env vars", async () => {
    for (const key of PRISMA_ENV_KEYS) {
      delete process.env[key];
    }

    const { prisma } = await importPrismaModule();

    expect(() => prisma.$transaction).toThrow(
      /Prisma runtime access requires DATABASE_URL, DIRECT_URL, or DATABASE_URL_UNPOOLED/,
    );
  });
});
