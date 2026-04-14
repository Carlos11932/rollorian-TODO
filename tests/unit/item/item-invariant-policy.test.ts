import { ITEM_TYPE, createItemId, createSpaceId } from "@/domain/shared";
import {
  checkItemInvariants,
  createEventCanceledLifecycle,
  createEventItem,
  createEventStartAndEndTemporal,
  createTaskBlockedLifecycle,
  createTaskDoneLifecycle,
  createTaskItem,
  createTaskPostponedLifecycle,
  createTaskStartEndAndDueTemporal,
  createTaskUndatedTemporal,
  getItemCalendarSpan,
  TASK_STATUS,
} from "@/domain/item";
import { createEventStartTemporal } from "@/domain/item/temporal";

describe("item invariant policy", () => {
  it("accepts an undated task", () => {
    const item = createTaskItem({
      id: createItemId("task-1"),
      itemType: ITEM_TYPE.TASK,
      title: "Inbox cleanup",
      spaceId: createSpaceId("space-1"),
      spaceType: "personal",
      temporal: createTaskUndatedTemporal(),
    });

    expect(item.temporal.kind).toBe("undated");
    expect(getItemCalendarSpan(item)).toBeNull();
  });

  it("rejects an event with an invalid scheduled start", () => {
    const result = checkItemInvariants({
      itemType: ITEM_TYPE.EVENT,
      temporal: createEventStartTemporal(new Date("invalid")),
      lifecycle: createEventCanceledLifecycle(new Date()),
      postponeCount: 0,
    });

    expect(result.isValid).toBe(false);
    expect(result.violations).toContain("Event startAt must be a valid date.");
  });

  it("rejects a postponed task when postpone count is missing", () => {
    const result = checkItemInvariants({
      itemType: ITEM_TYPE.TASK,
      temporal: createTaskUndatedTemporal(),
      lifecycle: createTaskPostponedLifecycle(new Date("2026-04-20T09:00:00.000Z")),
      postponeCount: 0,
    });

    expect(result.isValid).toBe(false);
    expect(result.violations).toContain(
      "Task postponeCount must be at least 1 when status is postponed.",
    );
  });

  it("keeps blocked tasks open and incomplete", () => {
    const task = createTaskItem({
      id: createItemId("task-2"),
      itemType: ITEM_TYPE.TASK,
      title: "Coordinate release",
      spaceId: createSpaceId("space-1"),
      spaceType: "group",
      temporal: createTaskUndatedTemporal(),
      lifecycle: createTaskBlockedLifecycle(),
    });

    expect(task.lifecycle.status).toBe(TASK_STATUS.BLOCKED);
    expect("completedAt" in task.lifecycle).toBe(false);
    expect("canceledAt" in task.lifecycle).toBe(false);
  });

  it("rejects inverted task temporal ranges", () => {
    const result = checkItemInvariants({
      itemType: ITEM_TYPE.TASK,
      temporal: createTaskStartEndAndDueTemporal(
        new Date("2026-04-18T09:00:00.000Z"),
        new Date("2026-04-17T09:00:00.000Z"),
        new Date("2026-04-20T09:00:00.000Z"),
      ),
      lifecycle: createTaskDoneLifecycle(new Date("2026-04-21T09:00:00.000Z")),
      postponeCount: 0,
    });

    expect(result.isValid).toBe(false);
    expect(result.violations).toContain("Task endAt cannot be before startAt.");
  });

  it("projects task and event calendar spans from disciplined temporal unions", () => {
    const event = createEventItem({
      id: createItemId("event-1"),
      itemType: ITEM_TYPE.EVENT,
      title: "Workshop",
      spaceId: createSpaceId("space-2"),
      spaceType: "group",
      temporal: createEventStartAndEndTemporal(
        new Date("2026-04-14T09:00:00.000Z"),
        new Date("2026-04-14T11:00:00.000Z"),
      ),
    });

    const span = getItemCalendarSpan(event);

    expect(span).not.toBeNull();
    expect(span?.startAt.toISOString()).toBe("2026-04-14T09:00:00.000Z");
    expect(span?.endAt.toISOString()).toBe("2026-04-14T11:00:00.000Z");
  });
});
