export const TASK_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  BLOCKED: "blocked",
  POSTPONED: "postponed",
  DONE: "done",
  CANCELED: "canceled",
} as const;

export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

export const EVENT_STATUS = {
  SCHEDULED: "scheduled",
  COMPLETED: "completed",
  CANCELED: "canceled",
} as const;

export type EventStatus = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS];

export const taskStatusValues = Object.values(TASK_STATUS);
export const eventStatusValues = Object.values(EVENT_STATUS);

export interface TaskPendingLifecycle {
  status: typeof TASK_STATUS.PENDING;
}

export interface TaskInProgressLifecycle {
  status: typeof TASK_STATUS.IN_PROGRESS;
}

export interface TaskBlockedLifecycle {
  status: typeof TASK_STATUS.BLOCKED;
}

export interface TaskPostponedLifecycle {
  status: typeof TASK_STATUS.POSTPONED;
  postponedUntil: Date;
}

export interface TaskDoneLifecycle {
  status: typeof TASK_STATUS.DONE;
  completedAt: Date;
}

export interface TaskCanceledLifecycle {
  status: typeof TASK_STATUS.CANCELED;
  canceledAt: Date;
}

export type TaskLifecycle =
  | TaskPendingLifecycle
  | TaskInProgressLifecycle
  | TaskBlockedLifecycle
  | TaskPostponedLifecycle
  | TaskDoneLifecycle
  | TaskCanceledLifecycle;

export interface EventScheduledLifecycle {
  status: typeof EVENT_STATUS.SCHEDULED;
}

export interface EventCompletedLifecycle {
  status: typeof EVENT_STATUS.COMPLETED;
  completedAt: Date;
}

export interface EventCanceledLifecycle {
  status: typeof EVENT_STATUS.CANCELED;
  canceledAt: Date;
}

export type EventLifecycle =
  | EventScheduledLifecycle
  | EventCompletedLifecycle
  | EventCanceledLifecycle;

export type ItemLifecycle = TaskLifecycle | EventLifecycle;

export function isTaskStatus(value: string): value is TaskStatus {
  return taskStatusValues.includes(value as TaskStatus);
}

export function isEventStatus(value: string): value is EventStatus {
  return eventStatusValues.includes(value as EventStatus);
}

export function createTaskPendingLifecycle(): TaskPendingLifecycle {
  return { status: TASK_STATUS.PENDING };
}

export function createTaskInProgressLifecycle(): TaskInProgressLifecycle {
  return { status: TASK_STATUS.IN_PROGRESS };
}

export function createTaskBlockedLifecycle(): TaskBlockedLifecycle {
  return { status: TASK_STATUS.BLOCKED };
}

export function createTaskPostponedLifecycle(
  postponedUntil: Date,
): TaskPostponedLifecycle {
  return {
    status: TASK_STATUS.POSTPONED,
    postponedUntil,
  };
}

export function createTaskDoneLifecycle(completedAt: Date): TaskDoneLifecycle {
  return {
    status: TASK_STATUS.DONE,
    completedAt,
  };
}

export function createTaskCanceledLifecycle(
  canceledAt: Date,
): TaskCanceledLifecycle {
  return {
    status: TASK_STATUS.CANCELED,
    canceledAt,
  };
}

export function createEventScheduledLifecycle(): EventScheduledLifecycle {
  return { status: EVENT_STATUS.SCHEDULED };
}

export function createEventCompletedLifecycle(
  completedAt: Date,
): EventCompletedLifecycle {
  return {
    status: EVENT_STATUS.COMPLETED,
    completedAt,
  };
}

export function createEventCanceledLifecycle(
  canceledAt: Date,
): EventCanceledLifecycle {
  return {
    status: EVENT_STATUS.CANCELED,
    canceledAt,
  };
}

export function isTaskLifecycleOpen(lifecycle: TaskLifecycle): boolean {
  return (
    lifecycle.status !== TASK_STATUS.DONE &&
    lifecycle.status !== TASK_STATUS.CANCELED
  );
}

export function isEventLifecycleOpen(lifecycle: EventLifecycle): boolean {
  return lifecycle.status === EVENT_STATUS.SCHEDULED;
}
