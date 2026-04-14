export const TASK_TEMPORAL_KIND = {
  UNDATED: "undated",
  DUE_DATE: "due_date",
  START_DATE: "start_date",
  START_AND_END: "start_and_end",
  START_AND_DUE: "start_and_due",
  START_END_AND_DUE: "start_end_and_due",
} as const;

export type TaskTemporalKind =
  (typeof TASK_TEMPORAL_KIND)[keyof typeof TASK_TEMPORAL_KIND];

export const EVENT_TEMPORAL_KIND = {
  START: "start",
  START_AND_END: "start_and_end",
} as const;

export type EventTemporalKind =
  (typeof EVENT_TEMPORAL_KIND)[keyof typeof EVENT_TEMPORAL_KIND];

export interface TaskUndatedTemporal {
  kind: typeof TASK_TEMPORAL_KIND.UNDATED;
}

export interface TaskDueDateTemporal {
  kind: typeof TASK_TEMPORAL_KIND.DUE_DATE;
  dueAt: Date;
}

export interface TaskStartDateTemporal {
  kind: typeof TASK_TEMPORAL_KIND.START_DATE;
  startAt: Date;
}

export interface TaskStartAndEndTemporal {
  kind: typeof TASK_TEMPORAL_KIND.START_AND_END;
  startAt: Date;
  endAt: Date;
}

export interface TaskStartAndDueTemporal {
  kind: typeof TASK_TEMPORAL_KIND.START_AND_DUE;
  startAt: Date;
  dueAt: Date;
}

export interface TaskStartEndAndDueTemporal {
  kind: typeof TASK_TEMPORAL_KIND.START_END_AND_DUE;
  startAt: Date;
  endAt: Date;
  dueAt: Date;
}

export type TaskTemporal =
  | TaskUndatedTemporal
  | TaskDueDateTemporal
  | TaskStartDateTemporal
  | TaskStartAndEndTemporal
  | TaskStartAndDueTemporal
  | TaskStartEndAndDueTemporal;

export interface EventStartTemporal {
  kind: typeof EVENT_TEMPORAL_KIND.START;
  startAt: Date;
}

export interface EventStartAndEndTemporal {
  kind: typeof EVENT_TEMPORAL_KIND.START_AND_END;
  startAt: Date;
  endAt: Date;
}

export type EventTemporal = EventStartTemporal | EventStartAndEndTemporal;

export type ItemTemporal = TaskTemporal | EventTemporal;

export interface CalendarSpan {
  startAt: Date;
  endAt: Date;
}

export function createTaskUndatedTemporal(): TaskUndatedTemporal {
  return { kind: TASK_TEMPORAL_KIND.UNDATED };
}

export function createTaskDueDateTemporal(dueAt: Date): TaskDueDateTemporal {
  return {
    kind: TASK_TEMPORAL_KIND.DUE_DATE,
    dueAt,
  };
}

export function createTaskStartDateTemporal(
  startAt: Date,
): TaskStartDateTemporal {
  return {
    kind: TASK_TEMPORAL_KIND.START_DATE,
    startAt,
  };
}

export function createTaskStartAndEndTemporal(
  startAt: Date,
  endAt: Date,
): TaskStartAndEndTemporal {
  return {
    kind: TASK_TEMPORAL_KIND.START_AND_END,
    startAt,
    endAt,
  };
}

export function createTaskStartAndDueTemporal(
  startAt: Date,
  dueAt: Date,
): TaskStartAndDueTemporal {
  return {
    kind: TASK_TEMPORAL_KIND.START_AND_DUE,
    startAt,
    dueAt,
  };
}

export function createTaskStartEndAndDueTemporal(
  startAt: Date,
  endAt: Date,
  dueAt: Date,
): TaskStartEndAndDueTemporal {
  return {
    kind: TASK_TEMPORAL_KIND.START_END_AND_DUE,
    startAt,
    endAt,
    dueAt,
  };
}

export function createEventStartTemporal(startAt: Date): EventStartTemporal {
  return {
    kind: EVENT_TEMPORAL_KIND.START,
    startAt,
  };
}

export function createEventStartAndEndTemporal(
  startAt: Date,
  endAt: Date,
): EventStartAndEndTemporal {
  return {
    kind: EVENT_TEMPORAL_KIND.START_AND_END,
    startAt,
    endAt,
  };
}

export function getTaskCalendarSpan(temporal: TaskTemporal): CalendarSpan | null {
  switch (temporal.kind) {
    case TASK_TEMPORAL_KIND.UNDATED:
      return null;
    case TASK_TEMPORAL_KIND.DUE_DATE:
      return { startAt: temporal.dueAt, endAt: temporal.dueAt };
    case TASK_TEMPORAL_KIND.START_DATE:
      return { startAt: temporal.startAt, endAt: temporal.startAt };
    case TASK_TEMPORAL_KIND.START_AND_END:
      return { startAt: temporal.startAt, endAt: temporal.endAt };
    case TASK_TEMPORAL_KIND.START_AND_DUE:
      return { startAt: temporal.startAt, endAt: temporal.dueAt };
    case TASK_TEMPORAL_KIND.START_END_AND_DUE:
      return { startAt: temporal.startAt, endAt: temporal.endAt };
  }
}

export function getEventCalendarSpan(temporal: EventTemporal): CalendarSpan {
  switch (temporal.kind) {
    case EVENT_TEMPORAL_KIND.START:
      return { startAt: temporal.startAt, endAt: temporal.startAt };
    case EVENT_TEMPORAL_KIND.START_AND_END:
      return { startAt: temporal.startAt, endAt: temporal.endAt };
  }
}
