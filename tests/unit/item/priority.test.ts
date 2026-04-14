import {
  DEFAULT_PRIORITY,
  ITEM_TYPE,
  PRIORITY,
  createItemId,
  createSpaceId,
  isPriority,
} from "@/domain/shared";
import { createTaskItem, createTaskUndatedTemporal } from "@/domain/item";

describe("priority", () => {
  it("exposes exactly the supported priority values", () => {
    expect(Object.values(PRIORITY)).toEqual(["low", "medium", "high", "urgent"]);
  });

  it("defaults new items to medium priority", () => {
    const task = createTaskItem({
      id: createItemId("task-priority-default"),
      itemType: ITEM_TYPE.TASK,
      title: "Review backlog",
      spaceId: createSpaceId("space-1"),
      spaceType: "personal",
      temporal: createTaskUndatedTemporal(),
    });

    expect(task.priority).toBe(DEFAULT_PRIORITY);
  });

  it("accepts each declared priority and rejects unknown values", () => {
    expect(isPriority(PRIORITY.LOW)).toBe(true);
    expect(isPriority(PRIORITY.MEDIUM)).toBe(true);
    expect(isPriority(PRIORITY.HIGH)).toBe(true);
    expect(isPriority(PRIORITY.URGENT)).toBe(true);
    expect(isPriority("critical")).toBe(false);
  });
});
