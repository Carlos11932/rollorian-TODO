type VersionTokenBrand = number & {
  readonly __brand: "VersionToken";
};

export type VersionToken = VersionTokenBrand;

export const INITIAL_VERSION_TOKEN = 0 as VersionToken;

export function createVersionToken(value: number): VersionToken {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error("Version token must be a non-negative integer.");
  }

  return value as VersionToken;
}

export function incrementVersionToken(value: VersionToken): VersionToken {
  return createVersionToken(value + 1);
}
