export const SPACE_TYPE = {
  PERSONAL: "personal",
  GROUP: "group",
} as const;

export type SpaceType = (typeof SPACE_TYPE)[keyof typeof SPACE_TYPE];

export const spaceTypeValues = Object.values(SPACE_TYPE);

export function isSpaceType(value: string): value is SpaceType {
  return spaceTypeValues.includes(value as SpaceType);
}
