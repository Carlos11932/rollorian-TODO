import type { NextRequest } from "next/server";
import { getGroupView, parseGetGroupViewRequest } from "@/lib/api-runtime";
import {
  AgentInputError,
  createAgentRuntimeContextResolver,
  handleAgentRoute,
} from "@/lib/agents";
import { getViewFiltersFromSearchParams } from "@/app/api/_shared/route-contracts";

function zodMessage(error: { issues: Array<{ message: string }> }) {
  return error.issues.map((issue) => issue.message).join(", ");
}

type RouteContext = { params: Promise<{ groupId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext): Promise<Response> {
  const { groupId } = await params;

  return handleAgentRoute(
    request,
    {
      action: "views.group",
      scope: "views:read",
      resourceType: "view",
      },
    async (context) => {
      const parsed = parseGetGroupViewRequest({
        params: { groupId },
        query: {
          filters: getViewFiltersFromSearchParams(new URL(request.url).searchParams),
        },
      });

      if (!parsed.success) {
        throw new AgentInputError(zodMessage(parsed.error));
      }

      const response = await getGroupView(
        request,
        parsed.data,
        createAgentRuntimeContextResolver(context),
      );

      return {
        body: response.body,
        status: response.status,
        resourceId: groupId,
      };
    },
  );
}
