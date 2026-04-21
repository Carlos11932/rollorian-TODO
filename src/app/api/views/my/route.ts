import { NextResponse } from "next/server";
import { UnauthorizedError } from "@/lib/auth/require-auth";
import { getMyView, parseGetMyViewRequest } from "@/lib/api-runtime";
import {
  fromZodError,
  getViewFiltersFromSearchParams,
  unauthorized,
} from "@/app/api/_shared/route-contracts";

export async function GET(request: Request) {
  const parsed = parseGetMyViewRequest({
    query: {
      filters: getViewFiltersFromSearchParams(new URL(request.url).searchParams),
    },
  });

  if (!parsed.success) {
    return fromZodError(parsed.error);
  }

  try {
    const response = await getMyView(request, parsed.data);
    return NextResponse.json(response.body, { status: response.status });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorized();
    }

    throw error;
  }
}
