import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
  revokeAgentClientForUserMock: vi.fn(),
  listRecentAgentAuditEventsForUserMock: vi.fn(),
}));

vi.mock("@/lib/auth/require-auth", () => ({
  UnauthorizedError: class UnauthorizedError extends Error {},
  requireAuth: mocks.requireAuthMock,
}));

vi.mock("@/lib/agents", async () => {
  const actual = await vi.importActual("@/lib/agents");
  return {
    ...actual,
    revokeAgentClientForUser: mocks.revokeAgentClientForUserMock,
    listRecentAgentAuditEventsForUser: mocks.listRecentAgentAuditEventsForUserMock,
  };
});

import { POST } from "@/app/api/agent-clients/[agentClientId]/revoke/route";

describe("agent client revoke route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthMock.mockResolvedValue({ userId: "user-1" });
    mocks.revokeAgentClientForUserMock.mockResolvedValue({ id: "agent-1", status: "REVOKED" });
    mocks.listRecentAgentAuditEventsForUserMock.mockResolvedValue([{ id: "event-3" }]);
  });

  it("returns the revoked client plus refreshed recent events", async () => {
    const response = await POST(new Request("http://localhost/api/agent-clients/agent-1/revoke", {
      method: "POST",
    }), {
      params: Promise.resolve({ agentClientId: "agent-1" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      client: { id: "agent-1", status: "REVOKED" },
      recentEvents: [{ id: "event-3" }],
    });
    expect(mocks.listRecentAgentAuditEventsForUserMock).toHaveBeenCalledWith("user-1");
  });
});
