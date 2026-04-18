import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGroupId, createUserId } from "@/domain/shared";

const mocks = vi.hoisted(() => ({
  authMock: vi.fn(),
  findActorByUserIdMock: vi.fn(),
  listVisibleGroupIdsForActorMock: vi.fn(),
  resolveMockActorMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/auth", () => ({
  auth: mocks.authMock,
}));

vi.mock("@/lib/item-command-factory", () => ({
  prismaMembershipResolver: {
    findActorByUserId: mocks.findActorByUserIdMock,
    listVisibleGroupIdsForActor: mocks.listVisibleGroupIdsForActorMock,
  },
}));

vi.mock("@/lib/mock/actor", () => ({
  resolveMockActor: mocks.resolveMockActorMock,
}));

import { UnauthorizedError } from "@/lib/auth/require-auth";
import { resolveSessionRuntimeContext } from "@/lib/api-runtime-context";

const env = process.env as Record<string, string | undefined>;
const originalNodeEnv = env["NODE_ENV"];

const actor = {
  metadata: {
    actorId: createUserId("user-1"),
    displayName: "Carlo",
    email: "carlo@example.com",
  },
  userId: createUserId("user-1"),
} as const;

describe("api-runtime-context", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findActorByUserIdMock.mockResolvedValue(actor);
    mocks.listVisibleGroupIdsForActorMock.mockResolvedValue([createGroupId("group-alpha")]);
    mocks.resolveMockActorMock.mockReturnValue(actor);
  });

  afterEach(() => {
    if (originalNodeEnv === undefined) {
      delete env["NODE_ENV"];
    } else {
      env["NODE_ENV"] = originalNodeEnv;
    }
  });

  it("uses the signed-in session in production and does not touch mock actor resolution", async () => {
    env["NODE_ENV"] = "production";
    mocks.authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });

    const context = await resolveSessionRuntimeContext(new Request("http://localhost/api/items"));

    expect(context.actor).toBe(actor);
    expect(context.visibleGroupIds).toEqual([createGroupId("group-alpha")]);
    expect(mocks.findActorByUserIdMock).toHaveBeenCalledWith(createUserId("user-1"));
    expect(mocks.resolveMockActorMock).not.toHaveBeenCalled();
  });

  it("uses mock actor resolution only in test mode", async () => {
    env["NODE_ENV"] = "test";

    const request = new Request("http://localhost/api/items", {
      headers: {
        "x-rollorian-actor-id": "user-1",
      },
    });

    const context = await resolveSessionRuntimeContext(request);

    expect(context.actor).toBe(actor);
    expect(mocks.resolveMockActorMock).toHaveBeenCalledWith(request);
    expect(mocks.listVisibleGroupIdsForActorMock).toHaveBeenCalledWith(actor.userId);
  });

  it("rejects production requests without a session", async () => {
    env["NODE_ENV"] = "production";
    mocks.authMock.mockResolvedValue(null);

    await expect(resolveSessionRuntimeContext(new Request("http://localhost/api/items"))).rejects.toThrowError(
      new UnauthorizedError(),
    );
  });
});
