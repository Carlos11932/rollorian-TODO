import type { GroupId } from "../shared";

export interface GroupIdentity {
  id: GroupId;
  name: string;
  slug: string | null;
}

export interface GroupIdentityInput {
  id: GroupId;
  name: string;
  slug?: string | null;
}

function normalizeRequiredText(value: string, fieldName: string): string {
  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    throw new Error(`${fieldName} cannot be empty.`);
  }

  return normalizedValue;
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return null;
  }

  return normalizedValue;
}

export function createGroupIdentity(input: GroupIdentityInput): GroupIdentity {
  return {
    id: input.id,
    name: normalizeRequiredText(input.name, "Group name"),
    slug: normalizeOptionalText(input.slug),
  };
}
