import type { NextRequest } from "next/server";
import {
  getItemHistory,
  parseGetItemHistoryRequest,
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
      action: "history.read",
      scope: "history:read",
      resourceType: "item-history",
    },
    async (context) => {
      const parsed = parseGetItemHistoryRequest({
        params: { itemId: id },
        query: getItemScopeFromSearchParams(new URL(request.url).searchParams),
      });

      if (!parsed.success) {
        throw new AgentInputError(zodMessage(parsed.error));
      }

      const response = await getItemHistory(
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
