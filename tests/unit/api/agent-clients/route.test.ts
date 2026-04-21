import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
  listAgentClientsForUserMock: vi.fn(),
  listRecentAgentAuditEventsForUserMock: vi.fn(),
  createAgentClientForUserMock: vi.fn(),
}));

vi.mock("@/lib/auth/require-auth", () => ({
  UnauthorizedError: class UnauthorizedError extends Error {},
  requireAuth: mocks.requireAuthMock,
}));

vi.mock("@/lib/agents", async () => {
  const actual = await vi.importActual<typeof import("@/lib/agents")>("@/lib/agents");
  return {
    ...actual,
    listAgentClientsForUser: mocks.listAgentClientsForUserMock,
    listRecentAgentAuditEventsForUser: mocks.listRecentAgentAuditEventsForUserMock,
    createAgentClientForUser: mocks.createAgentClientForUserMock,
  };
});

import { GET, POST } from "@/app/api/agent-clients/route";

describe("agent client routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthMock.mockResolvedValue({ userId: "user-1" });
    mocks.listAgentClientsForUserMock.mockResolvedValue([{ id: "agent-1" }]);
    mocks.listRecentAgentAuditEventsForUserMock.mockResolvedValue([{ id: "event-1" }]);
    mocks.createAgentClientForUserMock.mockResolvedValue({
      client: { id: "agent-1" },
      plainToken: "plain-token",
    });
  });

  it("returns the agent management payload for the signed-in user", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      clients: [{ id: "agent-1" }],
      recentEvents: [{ id: "event-1" }],
    });
  });

  it("creates a client and returns the issued token", async () => {
    const response = await POST(new Request("http://localhost/api/agent-clients", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        name: "Donna",
        kind: "PRIVATE_COMPANION",
        scopes: ["items:read"],
      }),
    }) as never);

    expect(response.status).toBe(201);
    expect(mocks.createAgentClientForUserMock).toHaveBeenCalledWith("user-1", {
      name: "Donna",
      kind: "PRIVATE_COMPANION",
      scopes: ["items:read"],
    });
  });
});
