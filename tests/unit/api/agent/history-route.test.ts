import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  handleAgentRouteMock: vi.fn(),
  createAgentRuntimeContextResolverMock: vi.fn(),
  getItemHistoryMock: vi.fn(),
}));

vi.mock("@/lib/agents", async () => {
  const actual = await vi.importActual<typeof import("@/lib/agents")>("@/lib/agents");
  return {
    ...actual,
    handleAgentRoute: mocks.handleAgentRouteMock,
    createAgentRuntimeContextResolver: mocks.createAgentRuntimeContextResolverMock,
  };
});

vi.mock("@/lib/api-runtime", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-runtime")>("@/lib/api-runtime");
  return {
    ...actual,
    getItemHistory: mocks.getItemHistoryMock,
  };
});

import { GET } from "@/app/api/agent/v1/items/[id]/history/route";

describe("agent item history route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createAgentRuntimeContextResolverMock.mockReturnValue(async () => ({
      actor: { userId: "user-1" },
      visibleGroupIds: [],
    }));
    mocks.getItemHistoryMock.mockResolvedValue({ body: { data: { itemId: "item-1", entries: [] } }, status: 200 });
    mocks.handleAgentRouteMock.mockImplementation(async (_request, _config, handler) => {
      const result = await handler({
        userId: "user-1",
        owner: { userId: "user-1", email: "carlo@example.com", name: "Carlo" },
        agentClientId: "agent-1",
        credentialId: "credential-1",
        agentName: "Donna",
        agentKind: "PRIVATE_COMPANION",
        scopes: ["history:read"],
        tokenPrefix: "rta_test",
      }, { idempotencyKey: null });

      return Response.json(result.body, { status: result.status ?? 200 });
    });
  });

  it("reads item history through the shared runtime", async () => {
    const response = await GET(
      new Request("http://localhost/api/agent/v1/items/item-1/history?groupId=group-1&spaceId=space-group-1&spaceType=group") as never,
      { params: Promise.resolve({ id: "item-1" }) },
    );

    expect(response.status).toBe(200);
    expect(mocks.getItemHistoryMock).toHaveBeenCalledOnce();
  });
});
