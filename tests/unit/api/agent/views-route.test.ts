import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  handleAgentRouteMock: vi.fn(),
  createAgentRuntimeContextResolverMock: vi.fn(),
  getMyViewMock: vi.fn(),
  getGroupViewMock: vi.fn(),
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
    getMyView: mocks.getMyViewMock,
    getGroupView: mocks.getGroupViewMock,
  };
});

import { GET as getMyViewRoute } from "@/app/api/agent/v1/views/my/route";
import { GET as getGroupViewRoute } from "@/app/api/agent/v1/views/groups/[groupId]/route";

describe("agent views routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createAgentRuntimeContextResolverMock.mockReturnValue(async () => ({
      actor: { userId: "user-1" },
      visibleGroupIds: [],
    }));
    mocks.getMyViewMock.mockResolvedValue({ body: { data: { items: [], totalCount: 0, filters: {} } }, status: 200 });
    mocks.getGroupViewMock.mockResolvedValue({ body: { data: { items: [], totalCount: 0, filters: {}, groupId: "group-1" } }, status: 200 });
    mocks.handleAgentRouteMock.mockImplementation(async (_request, _config, handler) => {
      const result = await handler({
        userId: "user-1",
        owner: { userId: "user-1", email: "carlo@example.com", name: "Carlo" },
        agentClientId: "agent-1",
        credentialId: "credential-1",
        agentName: "Donna",
        agentKind: "PRIVATE_COMPANION",
        scopes: ["views:read"],
        tokenPrefix: "rta_test",
      }, { idempotencyKey: null });

      return Response.json(result.body, { status: result.status ?? 200 });
    });
  });

  it("reads My View through the shared runtime", async () => {
    const response = await getMyViewRoute(new Request("http://localhost/api/agent/v1/views/my") as never);

    expect(response.status).toBe(200);
    expect(mocks.getMyViewMock).toHaveBeenCalledOnce();
  });

  it("reads Group View through the shared runtime", async () => {
    const response = await getGroupViewRoute(
      new Request("http://localhost/api/agent/v1/views/groups/group-1") as never,
      { params: Promise.resolve({ groupId: "group-1" }) },
    );

    expect(response.status).toBe(200);
    expect(mocks.getGroupViewMock).toHaveBeenCalledOnce();
  });
});
