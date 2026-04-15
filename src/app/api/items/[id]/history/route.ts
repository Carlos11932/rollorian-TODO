import { NextResponse } from "next/server";
import { getItemHistory, parseGetItemHistoryRequest } from "@/lib/api-runtime";
import { fromZodError, getItemScopeFromSearchParams } from "@/app/api/_shared/route-contracts";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const parsed = parseGetItemHistoryRequest({
    params: { itemId: id },
    query: getItemScopeFromSearchParams(new URL(request.url).searchParams),
  });

  if (!parsed.success) {
    return fromZodError(parsed.error);
  }

  const response = await getItemHistory(request, parsed.data);
  return NextResponse.json(response.body, { status: response.status });
}
