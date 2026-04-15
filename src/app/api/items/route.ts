import { NextResponse } from "next/server";
import {
  createItem,
  listItems,
  parseCreateItemRequest,
  parseListItemsRequest,
} from "@/lib/api-runtime";
import { badRequest, fromZodError, getListItemsQueryFromSearchParams } from "@/app/api/_shared/route-contracts";

export async function GET(request: Request) {
  const parsed = parseListItemsRequest({
    query: getListItemsQueryFromSearchParams(new URL(request.url).searchParams),
  });

  if (!parsed.success) {
    return fromZodError(parsed.error);
  }

  const response = await listItems(request, parsed.data);
  return NextResponse.json(response.body, { status: response.status });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const parsed = parseCreateItemRequest({ body });

  if (!parsed.success) {
    return fromZodError(parsed.error);
  }

  const response = await createItem(request, parsed.data);
  return NextResponse.json(response.body, { status: response.status });
}
