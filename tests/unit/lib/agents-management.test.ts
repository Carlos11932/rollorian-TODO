import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  prismaMock,
  createAgentTokenMock,
} = vi.hoisted(() => ({
  prismaMock: {
    agentClient: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    agentCredential: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    agentAuditEvent: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  createAgentTokenMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/agents/tokens", () => ({
  createAgentToken: createAgentTokenMock,
}));

import { AgentInputError } from "@/lib/agents/errors";
import {
  createAgentClientForUser,
  issueAgentCredentialForUser,
  revokeAgentCredentialForUser,
  revokeAgentClientForUser,
} from "@/lib/agents/management";

function makeClient(overrides: Record<string, unknown> = {}) {
  return {
    id: "agent-1",
    userId: "user-1",
    name: "Donna",
    kind: "PRIVATE_COMPANION",
    status: "ACTIVE",
    createdAt: new Date("2026-04-01T00:00:00.000Z"),
    updatedAt: new Date("2026-04-01T00:00:00.000Z"),
    lastUsedAt: null,
    credentials: [
      {
        id: "credential-1",
        tokenPrefix: "rta_test",
        scopes: ["items:read"],
        createdAt: new Date("2026-04-01T00:00:00.000Z"),
        expiresAt: null,
        revokedAt: null,
        lastUsedAt: null,
      },
    ],
    auditEvents: [
      {
        id: "event-1",
        action: "items.read",
        outcome: "SUCCESS",
        resourceType: "item",
        resourceId: "item-1",
        idempotencyKey: null,
        createdAt: new Date("2026-04-01T00:00:00.000Z"),
      },
    ],
    ...overrides,
  };
}

describe("agent management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createAgentTokenMock.mockReturnValue({
      plainToken: "plain-token",
      tokenHash: "hashed-token",
      tokenPrefix: "rta_test",
    });
    prismaMock.agentClient.create.mockResolvedValue(makeClient());
    prismaMock.agentClient.findFirst.mockResolvedValue(makeClient());
    prismaMock.agentCredential.create.mockResolvedValue({});
    prismaMock.agentCredential.findFirst.mockResolvedValue({
      id: "credential-1",
      revokedAt: null,
    });
    prismaMock.agentCredential.update.mockResolvedValue({});
    prismaMock.agentCredential.updateMany.mockResolvedValue({});
    prismaMock.agentAuditEvent.findMany.mockResolvedValue([]);
    prismaMock.$transaction.mockResolvedValue([]);
  });

  it("creates an agent client with deduplicated valid scopes and returns the plain token once", async () => {
    const result = await createAgentClientForUser("user-1", {
      name: " Donna ",
      kind: "PRIVATE_COMPANION",
      scopes: ["items:read", "items:read", "views:read"],
      expiresInDays: 7,
    });

    expect(prismaMock.agentClient.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: "user-1",
        name: "Donna",
        credentials: {
          create: expect.objectContaining({
            tokenHash: "hashed-token",
            tokenPrefix: "rta_test",
            scopes: ["items:read", "views:read"],
          }),
        },
      }),
    }));
    expect(result.plainToken).toBe("plain-token");
  });

  it("rejects invalid scopes before issuing a new credential", async () => {
    await expect(issueAgentCredentialForUser("user-1", "agent-1", {
      scopes: ["items:read", "nope:scope" as never],
      expiresInDays: 7,
    })).rejects.toThrowError(new AgentInputError("Invalid scopes: nope:scope"));
  });

  it("issues a credential and returns the refreshed client summary plus the plain token", async () => {
    const result = await issueAgentCredentialForUser("user-1", "agent-1", {
      scopes: ["items:read"],
      expiresInDays: 7,
    });

    expect(prismaMock.agentCredential.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        agentClientId: "agent-1",
        tokenHash: "hashed-token",
        tokenPrefix: "rta_test",
        scopes: ["items:read"],
      }),
    });
    expect(result).toEqual({
      client: expect.objectContaining({
        id: "agent-1",
        credentials: expect.any(Array),
        recentEvents: expect.any(Array),
      }),
      plainToken: "plain-token",
    });
  });

  it("revokes a credential and returns the refreshed client summary", async () => {
    const result = await revokeAgentCredentialForUser("user-1", "agent-1", "credential-1");

    expect(prismaMock.agentCredential.update).toHaveBeenCalledWith({
      where: { id: "credential-1" },
      data: { revokedAt: expect.any(Date) },
    });
    expect(result).toEqual(expect.objectContaining({
      id: "agent-1",
      credentials: expect.any(Array),
      recentEvents: expect.any(Array),
    }));
  });

  it("revokes a client and all active credentials in one transaction", async () => {
    const result = await revokeAgentClientForUser("user-1", "agent-1");

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.agentClient.update).toHaveBeenCalledWith({
      where: { id: "agent-1" },
      data: { status: "REVOKED" },
    });
    expect(prismaMock.agentCredential.updateMany).toHaveBeenCalledWith({
      where: { agentClientId: "agent-1", revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(result).toEqual(expect.objectContaining({
      id: "agent-1",
      credentials: expect.any(Array),
      recentEvents: expect.any(Array),
    }));
  });
});
