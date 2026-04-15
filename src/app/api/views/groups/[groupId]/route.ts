import { NextResponse } from "next/server";
import { getGroupView, parseGetGroupViewRequest } from "@/lib/api-runtime";
import { fromZodError, getViewFiltersFromSearchParams } from "@/app/api/_shared/route-contracts";

type RouteContext = { params: Promise<{ groupId: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const { groupId } = await params;
  const parsed = parseGetGroupViewRequest({
    params: { groupId },
    query: {
      filters: getViewFiltersFromSearchParams(new URL(request.url).searchParams),
    },
  });

  if (!parsed.success) {
    return fromZodError(parsed.error);
  }

  const response = await getGroupView(request, parsed.data);
  return NextResponse.json(response.body, { status: response.status });
}
