import { NextResponse } from "next/server";
import { getUndatedView, parseGetUndatedViewRequest } from "@/lib/api-runtime";
import { fromZodError, getViewFiltersFromSearchParams } from "@/app/api/_shared/route-contracts";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const parsed = parseGetUndatedViewRequest({
    query: {
      filters: getViewFiltersFromSearchParams(searchParams),
      spaceFilter: searchParams.get("spaceFilter"),
    },
  });

  if (!parsed.success) {
    return fromZodError(parsed.error);
  }

  const response = await getUndatedView(request, parsed.data);
  return NextResponse.json(response.body, { status: response.status });
}
