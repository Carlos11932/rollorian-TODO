import { NextResponse } from "next/server";
import {
  getItem,
  parseGetItemByIdRequest,
  parseUpdateItemRequest,
  updateItem,
} from "@/lib/api-runtime";
import { badRequest, fromZodError, getItemScopeFromSearchParams } from "@/app/api/_shared/route-contracts";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;

  const parsed = parseGetItemByIdRequest({
    params: { itemId: id },
    query: getItemScopeFromSearchParams(new URL(request.url).searchParams),
  });

  if (!parsed.success) {
    return fromZodError(parsed.error);
  }

  const response = await getItem(request, parsed.data);
  return NextResponse.json(response.body, { status: response.status });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const parsed = parseUpdateItemRequest({
    body,
    params: { itemId: id },
  });

  if (!parsed.success) {
    return fromZodError(parsed.error);
  }

  const response = await updateItem(request, parsed.data);
  return NextResponse.json(response.body, { status: response.status });
}
