import type { NextRequest } from "next/server";
import {
  createItem,
  listItems,
  parseCreateItemRequest,
  parseListItemsRequest,
} from "@/lib/api-runtime";
import {
  AgentInputError,
  createAgentRuntimeContextResolver,
  handleAgentRoute,
} from "@/lib/agents";
import { getListItemsQueryFromSearchParams } from "@/app/api/_shared/route-contracts";

function zodMessage(error: { issues: Array<{ message: string }> }) {
  return error.issues.map((issue) => issue.message).join(", ");
}

export async function GET(request: NextRequest): Promise<Response> {
  return handleAgentRoute(
    request,
    {
      action: "items.list",
      scope: "items:read",
      resourceType: "item",
    },
    async (context) => {
      const parsed = parseListItemsRequest({
        query: getListItemsQueryFromSearchParams(new URL(request.url).searchParams),
      });

      if (!parsed.success) {
        throw new AgentInputError(zodMessage(parsed.error));
      }

      const response = await listItems(
        request,
        parsed.data,
        createAgentRuntimeContextResolver(context),
      );

      return {
        body: response.body,
        status: response.status,
      };
    },
  );
}

export async function POST(request: NextRequest): Promise<Response> {
  return handleAgentRoute(
    request,
    {
      action: "items.create",
      scope: "items:write",
      resourceType: "item",
    },
    async (context) => {
      const body = await request.json().catch(() => {
        throw new AgentInputError("Invalid JSON body");
      });
      const parsed = parseCreateItemRequest({ body });

      if (!parsed.success) {
        throw new AgentInputError(zodMessage(parsed.error));
      }

      const response = await createItem(
        request,
        parsed.data,
        createAgentRuntimeContextResolver(context),
      );

      return {
        body: response.body,
        status: response.status,
      };
    },
  );
}
