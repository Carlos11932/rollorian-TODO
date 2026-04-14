import { TASK_TEMPORAL_KIND, getItemCalendarSpan, type Item } from "@/domain/item";
import { ITEM_TYPE } from "@/domain/shared";
import type { DatedSpanProjection } from "./types";

function getDueAt(item: Item): Date | null {
  if (item.itemType !== ITEM_TYPE.TASK) {
    return null;
  }

  switch (item.temporal.kind) {
    case TASK_TEMPORAL_KIND.UNDATED:
    case TASK_TEMPORAL_KIND.START_DATE:
    case TASK_TEMPORAL_KIND.START_AND_END:
      return null;
    case TASK_TEMPORAL_KIND.DUE_DATE:
    case TASK_TEMPORAL_KIND.START_AND_DUE:
    case TASK_TEMPORAL_KIND.START_END_AND_DUE:
      return item.temporal.dueAt;
  }

  return null;
}

export function projectDatedSpan(item: Item): DatedSpanProjection {
  const calendarSpan = getItemCalendarSpan(item);

  return {
    calendarEndAt: calendarSpan?.endAt ?? null,
    calendarStartAt: calendarSpan?.startAt ?? null,
    dueAt: getDueAt(item),
    isDated: calendarSpan !== null,
  };
}
