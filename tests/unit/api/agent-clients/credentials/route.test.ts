import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
  issueAgentCredentialForUserMock: vi.fn(),
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
    issueAgentCredentialForUser: mocks.issueAgentCredentialForUserMock,
    listRecentAgentAuditEventsForUser: mocks.listRecentAgentAuditEventsForUserMock,
  };
});

import { POST } from "@/app/api/agent-clients/[agentClientId]/credentials/route";

describe("agent credential issue route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthMock.mockResolvedValue({ userId: "user-1" });
    mocks.issueAgentCredentialForUserMock.mockResolvedValue({
      client: { id: "agent-1" },
      plainToken: "rotated-token",
    });
    mocks.listRecentAgentAuditEventsForUserMock.mockResolvedValue([{ id: "event-2" }]);
  });

  it("returns the rotated token plus refreshed recent events", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/agent-clients/agent-1/credentials", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scopes: ["items:read"] }),
      }),
      { params: Promise.resolve({ agentClientId: "agent-1" }) },
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      client: { id: "agent-1" },
      plainToken: "rotated-token",
      recentEvents: [{ id: "event-2" }],
    });
    expect(mocks.listRecentAgentAuditEventsForUserMock).toHaveBeenCalledWith("user-1");
  });
});
