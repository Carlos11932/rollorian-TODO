import type { NextRequest } from "next/server";
import {
  getItem,
  parseGetItemByIdRequest,
  parseUpdateItemRequest,
  updateItem,
} from "@/lib/api-runtime";
import {
  AgentInputError,
  createAgentRuntimeContextResolver,
  handleAgentRoute,
} from "@/lib/agents";
import { getItemScopeFromSearchParams } from "@/app/api/_shared/route-contracts";

function zodMessage(error: { issues: Array<{ message: string }> }) {
  return error.issues.map((issue) => issue.message).join(", ");
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext): Promise<Response> {
  const { id } = await params;

  return handleAgentRoute(
    request,
    {
      action: "items.read",
      scope: "items:read",
      resourceType: "item",
    },
    async (context) => {
      const parsed = parseGetItemByIdRequest({
        params: { itemId: id },
        query: getItemScopeFromSearchParams(new URL(request.url).searchParams),
      });

      if (!parsed.success) {
        throw new AgentInputError(zodMessage(parsed.error));
      }

      const response = await getItem(
        request,
        parsed.data,
        createAgentRuntimeContextResolver(context),
      );

      return {
        body: response.body,
        status: response.status,
        resourceId: id,
      };
    },
  );
}

export async function PATCH(request: NextRequest, { params }: RouteContext): Promise<Response> {
  const { id } = await params;

  return handleAgentRoute(
    request,
    {
      action: "items.update",
      scope: "items:write",
      resourceType: "item",
    },
    async (context) => {
      const body = await request.json().catch(() => {
        throw new AgentInputError("Invalid JSON body");
      });
      const parsed = parseUpdateItemRequest({
        body,
        params: { itemId: id },
      });

      if (!parsed.success) {
        throw new AgentInputError(zodMessage(parsed.error));
      }

      const response = await updateItem(
        request,
        parsed.data,
        createAgentRuntimeContextResolver(context),
      );

      return {
        body: response.body,
        status: response.status,
        resourceId: id,
      };
    },
  );
}
