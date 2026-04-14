import type { UserId } from "../shared";

export interface UserIdentity {
  id: UserId;
  displayName: string | null;
  email: string | null;
}

export interface UserIdentityInput {
  id: UserId;
  displayName?: string | null;
  email?: string | null;
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return null;
  }

  return normalizedValue;
}

export function createUserIdentity(input: UserIdentityInput): UserIdentity {
  return {
    id: input.id,
    displayName: normalizeOptionalText(input.displayName),
    email: normalizeOptionalText(input.email),
  };
}
