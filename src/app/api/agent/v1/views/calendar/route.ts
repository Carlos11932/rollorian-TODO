import type { NextRequest } from "next/server";
import { getCalendarView, parseGetCalendarViewRequest } from "@/lib/api-runtime";
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
      action: "views.calendar",
      scope: "views:read",
      resourceType: "view",
    },
    async (context) => {
      const searchParams = new URL(request.url).searchParams;
      const parsed = parseGetCalendarViewRequest({
        query: {
          filters: getViewFiltersFromSearchParams(searchParams),
          range: {
            endAt: searchParams.get("endAt"),
            startAt: searchParams.get("startAt"),
          },
          spaceFilter: searchParams.get("spaceFilter"),
        },
      });

      if (!parsed.success) {
        throw new AgentInputError(zodMessage(parsed.error));
      }

      const response = await getCalendarView(
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
