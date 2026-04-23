import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
  revokeAgentCredentialForUserMock: vi.fn(),
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
    revokeAgentCredentialForUser: mocks.revokeAgentCredentialForUserMock,
    listRecentAgentAuditEventsForUser: mocks.listRecentAgentAuditEventsForUserMock,
  };
});

import { POST } from "@/app/api/agent-clients/[agentClientId]/credentials/[credentialId]/revoke/route";

describe("agent credential revoke route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthMock.mockResolvedValue({ userId: "user-1" });
    mocks.revokeAgentCredentialForUserMock.mockResolvedValue({ id: "agent-1" });
    mocks.listRecentAgentAuditEventsForUserMock.mockResolvedValue([{ id: "event-4" }]);
  });

  it("returns the refreshed client plus recent events", async () => {
    const response = await POST(new Request("http://localhost/api/agent-clients/agent-1/credentials/credential-1/revoke", {
      method: "POST",
    }), {
      params: Promise.resolve({ agentClientId: "agent-1", credentialId: "credential-1" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      client: { id: "agent-1" },
      recentEvents: [{ id: "event-4" }],
    });
    expect(mocks.listRecentAgentAuditEventsForUserMock).toHaveBeenCalledWith("user-1");
  });
});
