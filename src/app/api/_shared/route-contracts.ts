import { NextResponse } from "next/server";
import type { ZodError } from "zod";

function readBooleanParam(value: string | null): boolean | undefined {
  if (value === null) {
    return undefined;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
}

function readOptionalString(searchParams: URLSearchParams, key: string): string | undefined {
  return searchParams.get(key) ?? undefined;
}

export function badRequest(error: unknown) {
  return NextResponse.json({ error }, { status: 400 });
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function fromZodError(error: ZodError) {
  return badRequest(error.flatten());
}

export function getItemScopeFromSearchParams(searchParams: URLSearchParams) {
  const spaceType = searchParams.get("spaceType");

  return spaceType === "group"
    ? {
        groupId: searchParams.get("groupId"),
        spaceId: searchParams.get("spaceId"),
        spaceType,
      }
    : {
        ownerId: searchParams.get("ownerId"),
        spaceId: searchParams.get("spaceId"),
        spaceType,
      };
}

export function getListItemsQueryFromSearchParams(searchParams: URLSearchParams) {
  return {
    assigneeId: readOptionalString(searchParams, "assigneeId"),
    datedState: readOptionalString(searchParams, "datedState"),
    groupId: readOptionalString(searchParams, "groupId"),
    includeCompletedEvents: readBooleanParam(searchParams.get("includeCompletedEvents")),
    itemType: readOptionalString(searchParams, "itemType"),
    label: readOptionalString(searchParams, "label"),
    ownerId: readOptionalString(searchParams, "ownerId"),
    priority: readOptionalString(searchParams, "priority"),
    spaceType: readOptionalString(searchParams, "spaceType"),
    status: readOptionalString(searchParams, "status"),
  };
}

export function getViewFiltersFromSearchParams(searchParams: URLSearchParams) {
  return {
    assigneeId: readOptionalString(searchParams, "assigneeId"),
    datedState: readOptionalString(searchParams, "datedState"),
    includeCompletedEvents: readBooleanParam(searchParams.get("includeCompletedEvents")),
    itemType: readOptionalString(searchParams, "itemType"),
    label: readOptionalString(searchParams, "label"),
    priority: readOptionalString(searchParams, "priority"),
    status: readOptionalString(searchParams, "status"),
  };
}
