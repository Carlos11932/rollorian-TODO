import {
  TASK_STATUS,
  isEventLifecycleOpen,
  isTaskLifecycleOpen,
  type Item,
} from "@/domain/item";
import { ITEM_TYPE } from "@/domain/shared";
import { ATTENTION_REASON, type AttentionProjection, type AttentionThresholds } from "./types";
import { projectDatedSpan } from "./dated-span-projector";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export interface ProjectAttentionInput {
  item: Item;
  referenceDate: Date;
  thresholds: AttentionThresholds;
}

function isOpenItem(item: Item): boolean {
  if (item.itemType === ITEM_TYPE.TASK) {
    return isTaskLifecycleOpen(item.lifecycle);
  }

  return isEventLifecycleOpen(item.lifecycle);
}

function isOverdue(item: Item, referenceDate: Date): boolean {
  const dueAt = projectDatedSpan(item).dueAt;

  return dueAt !== null && dueAt.getTime() <= referenceDate.getTime();
}

function isBlocked(item: Item): boolean {
  return item.itemType === ITEM_TYPE.TASK && item.lifecycle.status === TASK_STATUS.BLOCKED;
}

function isPostponedDue(item: Item, referenceDate: Date): boolean {
  return (
    item.itemType === ITEM_TYPE.TASK &&
    item.lifecycle.status === TASK_STATUS.POSTPONED &&
    item.lifecycle.postponedUntil.getTime() <= referenceDate.getTime()
  );
}

function isOpenTooLong(
  item: Item,
  referenceDate: Date,
  thresholdDays: number,
): boolean {
  return referenceDate.getTime() - item.createdAt.getTime() >= thresholdDays * MILLISECONDS_PER_DAY;
}

function isPostponedTooOften(item: Item, postponeCountThreshold: number): boolean {
  return item.postponeCount >= postponeCountThreshold;
}

export function projectAttentionReasons(
  input: ProjectAttentionInput,
): AttentionProjection {
  if (!isOpenItem(input.item)) {
    return {
      isOpen: false,
      reasons: [],
    };
  }

  const reasons = [
    isOverdue(input.item, input.referenceDate) ? ATTENTION_REASON.OVERDUE : null,
    isBlocked(input.item) ? ATTENTION_REASON.BLOCKED : null,
    isPostponedDue(input.item, input.referenceDate)
      ? ATTENTION_REASON.POSTPONED_DUE
      : null,
    isOpenTooLong(input.item, input.referenceDate, input.thresholds.openItemDays)
      ? ATTENTION_REASON.OPEN_TOO_LONG
      : null,
    isPostponedTooOften(input.item, input.thresholds.postponeCount)
      ? ATTENTION_REASON.POSTPONED_TOO_OFTEN
      : null,
  ].filter((reason): reason is NonNullable<typeof reason> => reason !== null);

  return {
    isOpen: true,
    reasons,
  };
}
