export const ITEM_TYPE = {
  TASK: "task",
  EVENT: "event",
} as const;

export type ItemType = (typeof ITEM_TYPE)[keyof typeof ITEM_TYPE];

export const itemTypeValues = Object.values(ITEM_TYPE);

export function isItemType(value: string): value is ItemType {
  return itemTypeValues.includes(value as ItemType);
}
