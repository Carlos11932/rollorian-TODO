export const PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
} as const;

export type Priority = (typeof PRIORITY)[keyof typeof PRIORITY];

export const priorityValues = Object.values(PRIORITY);

export const DEFAULT_PRIORITY: Priority = PRIORITY.MEDIUM;

export function isPriority(value: string): value is Priority {
  return priorityValues.includes(value as Priority);
}
