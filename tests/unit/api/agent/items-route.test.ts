import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  handleAgentRouteMock: vi.fn(),
  createAgentRuntimeContextResolverMock: vi.fn(),
  listItemsMock: vi.fn(),
  createItemMock: vi.fn(),
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
    listItems: mocks.listItemsMock,
    createItem: mocks.createItemMock,
  };
});

import { GET, POST } from "@/app/api/agent/v1/items/route";

describe("agent items route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createAgentRuntimeContextResolverMock.mockReturnValue(async () => ({
      actor: { userId: "user-1" },
      visibleGroupIds: [],
    }));
    mocks.listItemsMock.mockResolvedValue({ body: { data: { items: [], totalCount: 0, filters: {} } }, status: 200 });
    mocks.createItemMock.mockResolvedValue({ body: { data: { id: "item-1" } }, status: 201 });
    mocks.handleAgentRouteMock.mockImplementation(async (_request, _config, handler) => {
      const result = await handler({
        userId: "user-1",
        owner: { userId: "user-1", email: "carlo@example.com", name: "Carlo" },
        agentClientId: "agent-1",
        credentialId: "credential-1",
        agentName: "Donna",
        agentKind: "PRIVATE_COMPANION",
        scopes: ["items:read", "items:write"],
        tokenPrefix: "rta_test",
      }, { idempotencyKey: null });

      return Response.json(result.body, { status: result.status ?? 200 });
    });
  });

  it("lists items through the shared runtime", async () => {
    const response = await GET(new Request("http://localhost/api/agent/v1/items?spaceType=personal&ownerId=user-1") as never);

    expect(response.status).toBe(200);
    expect(mocks.listItemsMock).toHaveBeenCalledOnce();
  });

  it("creates items through the shared runtime", async () => {
    const response = await POST(new Request("http://localhost/api/agent/v1/items", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ownerId: "user-1",
        itemType: "task",
        spaceId: "space-personal-user-1",
        spaceType: "personal",
        temporal: { kind: "undated" },
        title: "Create from agent route",
      }),
    }) as never);

    expect(response.status).toBe(201);
    expect(mocks.createItemMock).toHaveBeenCalledOnce();
  });
});
