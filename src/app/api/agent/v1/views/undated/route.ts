import type { NextRequest } from "next/server";
import { getUndatedView, parseGetUndatedViewRequest } from "@/lib/api-runtime";
import {
  AgentInputError,
  createAgentRuntimeContextResolver,
  handleAgentRoute,
} from "@/lib/agents";
import { getViewFiltersFromSearchParams } from "@/app/api/_shared/route-contracts";

function zodMessage(error: { issues: Array<{ message: string }> }) {
  return error.issues.map((issue) => issue.message).join(", ");
}

export async function GET(request: NextRequest): Promise<Response> {
  return handleAgentRoute(
    request,
    {
      action: "views.undated",
      scope: "views:read",
      resourceType: "view",
    },
    async (context) => {
      const searchParams = new URL(request.url).searchParams;
      const parsed = parseGetUndatedViewRequest({
        query: {
          filters: getViewFiltersFromSearchParams(searchParams),
          spaceFilter: searchParams.get("spaceFilter"),
        },
      });

      if (!parsed.success) {
        throw new AgentInputError(zodMessage(parsed.error));
      }

      const response = await getUndatedView(
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
