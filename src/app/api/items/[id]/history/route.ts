import { NextResponse } from "next/server";
import { UnauthorizedError } from "@/lib/auth/require-auth";
import { getItemHistory, parseGetItemHistoryRequest } from "@/lib/api-runtime";
import {
  fromZodError,
  getItemScopeFromSearchParams,
  unauthorized,
} from "@/app/api/_shared/route-contracts";

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

  try {
    const response = await getItemHistory(request, parsed.data);
    return NextResponse.json(response.body, { status: response.status });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorized();
    }

    throw error;
  }
}
