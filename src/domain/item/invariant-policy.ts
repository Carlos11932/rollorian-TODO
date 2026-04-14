import { ITEM_TYPE } from "../shared";
import {
  EVENT_STATUS,
  TASK_STATUS,
  type EventLifecycle,
  type TaskLifecycle,
} from "./lifecycle";
import {
  EVENT_TEMPORAL_KIND,
  TASK_TEMPORAL_KIND,
  type EventTemporal,
  type TaskTemporal,
} from "./temporal";

export interface ItemInvariantCheckResult {
  isValid: boolean;
  violations: string[];
}

export interface TaskInvariantCheckInput {
  itemType: typeof ITEM_TYPE.TASK;
  lifecycle: TaskLifecycle;
  temporal: TaskTemporal;
  postponeCount: number;
}

export interface EventInvariantCheckInput {
  itemType: typeof ITEM_TYPE.EVENT;
  lifecycle: EventLifecycle;
  temporal: EventTemporal;
  postponeCount: number;
}

export type ItemInvariantCheckInput =
  | TaskInvariantCheckInput
  | EventInvariantCheckInput;

function isValidDate(value: Date): boolean {
  return !Number.isNaN(value.getTime());
}

function assertValidDate(value: Date, fieldName: string, violations: string[]): void {
  if (!isValidDate(value)) {
    violations.push(`${fieldName} must be a valid date.`);
  }
}

function assertNonNegativeInteger(
  value: number,
  fieldName: string,
  violations: string[],
): void {
  if (!Number.isInteger(value) || value < 0) {
    violations.push(`${fieldName} must be a non-negative integer.`);
  }
}

function validateTaskTemporal(
  temporal: TaskTemporal,
  violations: string[],
): void {
  switch (temporal.kind) {
    case TASK_TEMPORAL_KIND.UNDATED:
      return;
    case TASK_TEMPORAL_KIND.DUE_DATE:
      assertValidDate(temporal.dueAt, "Task dueAt", violations);
      return;
    case TASK_TEMPORAL_KIND.START_DATE:
      assertValidDate(temporal.startAt, "Task startAt", violations);
      return;
    case TASK_TEMPORAL_KIND.START_AND_END:
      assertValidDate(temporal.startAt, "Task startAt", violations);
      assertValidDate(temporal.endAt, "Task endAt", violations);

      if (temporal.endAt < temporal.startAt) {
        violations.push("Task endAt cannot be before startAt.");
      }

      return;
    case TASK_TEMPORAL_KIND.START_AND_DUE:
      assertValidDate(temporal.startAt, "Task startAt", violations);
      assertValidDate(temporal.dueAt, "Task dueAt", violations);

      if (temporal.dueAt < temporal.startAt) {
        violations.push("Task dueAt cannot be before startAt.");
      }

      return;
    case TASK_TEMPORAL_KIND.START_END_AND_DUE:
      assertValidDate(temporal.startAt, "Task startAt", violations);
      assertValidDate(temporal.endAt, "Task endAt", violations);
      assertValidDate(temporal.dueAt, "Task dueAt", violations);

      if (temporal.endAt < temporal.startAt) {
        violations.push("Task endAt cannot be before startAt.");
      }

      if (temporal.dueAt < temporal.startAt) {
        violations.push("Task dueAt cannot be before startAt.");
      }

      return;
  }
}

function validateEventTemporal(
  temporal: EventTemporal,
  violations: string[],
): void {
  switch (temporal.kind) {
    case EVENT_TEMPORAL_KIND.START:
      assertValidDate(temporal.startAt, "Event startAt", violations);
      return;
    case EVENT_TEMPORAL_KIND.START_AND_END:
      assertValidDate(temporal.startAt, "Event startAt", violations);
      assertValidDate(temporal.endAt, "Event endAt", violations);

      if (temporal.endAt < temporal.startAt) {
        violations.push("Event endAt cannot be before startAt.");
      }

      return;
  }
}

function validateTaskLifecycle(
  lifecycle: TaskLifecycle,
  postponeCount: number,
  violations: string[],
): void {
  switch (lifecycle.status) {
    case TASK_STATUS.PENDING:
    case TASK_STATUS.IN_PROGRESS:
    case TASK_STATUS.BLOCKED:
      return;
    case TASK_STATUS.POSTPONED:
      assertValidDate(
        lifecycle.postponedUntil,
        "Task postponedUntil",
        violations,
      );

      if (postponeCount === 0) {
        violations.push(
          "Task postponeCount must be at least 1 when status is postponed.",
        );
      }

      return;
    case TASK_STATUS.DONE:
      assertValidDate(lifecycle.completedAt, "Task completedAt", violations);
      return;
    case TASK_STATUS.CANCELED:
      assertValidDate(lifecycle.canceledAt, "Task canceledAt", violations);
      return;
  }
}

function validateEventLifecycle(
  lifecycle: EventLifecycle,
  postponeCount: number,
  violations: string[],
): void {
  if (postponeCount !== 0) {
    violations.push("Event postponeCount must stay 0.");
  }

  switch (lifecycle.status) {
    case EVENT_STATUS.SCHEDULED:
      return;
    case EVENT_STATUS.COMPLETED:
      assertValidDate(lifecycle.completedAt, "Event completedAt", violations);
      return;
    case EVENT_STATUS.CANCELED:
      assertValidDate(lifecycle.canceledAt, "Event canceledAt", violations);
      return;
  }
}

export function checkItemInvariants(
  input: ItemInvariantCheckInput,
): ItemInvariantCheckResult {
  const violations: string[] = [];

  assertNonNegativeInteger(input.postponeCount, "postponeCount", violations);

  if (input.itemType === ITEM_TYPE.TASK) {
    validateTaskTemporal(input.temporal, violations);
    validateTaskLifecycle(input.lifecycle, input.postponeCount, violations);
  }

  if (input.itemType === ITEM_TYPE.EVENT) {
    validateEventTemporal(input.temporal, violations);
    validateEventLifecycle(input.lifecycle, input.postponeCount, violations);
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
}

export function assertItemInvariants(input: ItemInvariantCheckInput): void {
  const result = checkItemInvariants(input);

  if (!result.isValid) {
    throw new Error(result.violations.join(" "));
  }
}
