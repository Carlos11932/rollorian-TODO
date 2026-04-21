import { NextResponse } from "next/server";
import { UnauthorizedError } from "@/lib/auth/require-auth";
import { getGroupView, parseGetGroupViewRequest } from "@/lib/api-runtime";
import {
  fromZodError,
  getViewFiltersFromSearchParams,
  unauthorized,
} from "@/app/api/_shared/route-contracts";

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

  try {
    const response = await getGroupView(request, parsed.data);
    return NextResponse.json(response.body, { status: response.status });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorized();
    }

    throw error;
  }
}
