type Brand<TValue, TBrand extends string> = TValue & {
  readonly __brand: TBrand;
};

export type EntityId = Brand<string, "EntityId">;
export type ItemId = Brand<string, "ItemId">;
export type UserId = Brand<string, "UserId">;
export type GroupId = Brand<string, "GroupId">;
export type SpaceId = Brand<string, "SpaceId">;
export type MembershipId = Brand<string, "MembershipId">;

function assertNonEmptyId(value: string): string {
  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    throw new Error("ID cannot be empty.");
  }

  return normalizedValue;
}

export function createEntityId(value: string): EntityId {
  return assertNonEmptyId(value) as EntityId;
}

export function createItemId(value: string): ItemId {
  return assertNonEmptyId(value) as ItemId;
}

export function createUserId(value: string): UserId {
  return assertNonEmptyId(value) as UserId;
}

export function createGroupId(value: string): GroupId {
  return assertNonEmptyId(value) as GroupId;
}

export function createSpaceId(value: string): SpaceId {
  return assertNonEmptyId(value) as SpaceId;
}

export function createMembershipId(value: string): MembershipId {
  return assertNonEmptyId(value) as MembershipId;
}
