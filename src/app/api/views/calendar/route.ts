import { NextResponse } from "next/server";
import { getCalendarView, parseGetCalendarViewRequest } from "@/lib/api-runtime";
import { fromZodError, getViewFiltersFromSearchParams } from "@/app/api/_shared/route-contracts";

export async function GET(request: Request) {
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
    return fromZodError(parsed.error);
  }

  const response = await getCalendarView(request, parsed.data);
  return NextResponse.json(response.body, { status: response.status });
}
