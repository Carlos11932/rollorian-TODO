/**
 * Serializable view types for ItemOutput — safe to cross the server/client boundary.
 * Dates are ISO strings. Used by API routes and Server Actions.
 */
import type { EventItemOutput, ItemOutput, TaskItemOutput } from '@/application/commands/shared';
import type {
  EventLifecycle,
  EventTemporal,
  TaskLifecycle,
  TaskTemporal,
} from '@/domain/item';
import { ITEM_TYPE, SPACE_TYPE, type Priority } from '@/domain/shared';

export interface ItemViewBase {
  id: string;
  title: string;
  notes: string | null;
  spaceId: string;
  spaceType: 'personal' | 'group';
  ownerId: string | null;
  groupId: string | null;
  priority: Priority;
  postponeCount: number;
  status: string;
  assigneeIds: string[];
  labels: { value: string }[];
  versionToken: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskItemView extends ItemViewBase {
  itemType: 'task';
  lifecycle: TaskLifecycle;
  temporal: TaskTemporal;
}

export interface EventItemView extends ItemViewBase {
  itemType: 'event';
  lifecycle: EventLifecycle;
  temporal: EventTemporal;
}

export type ItemView = TaskItemView | EventItemView;

export function toItemView(output: ItemOutput): ItemView {
  const base: ItemViewBase = {
    id: output.id,
    title: output.title,
    notes: output.notes,
    spaceId: output.spaceId,
    spaceType: output.spaceType === SPACE_TYPE.PERSONAL ? 'personal' : 'group',
    ownerId: output.ownerId,
    groupId: output.groupId,
    priority: output.priority,
    postponeCount: output.postponeCount,
    status: output.status,
    assigneeIds: [...output.assigneeIds],
    labels: output.labels.map((l) => ({ value: l.value })),
    versionToken: String(output.versionToken),
    createdAt: output.createdAt.toISOString(),
    updatedAt: output.updatedAt.toISOString(),
  };

  if (output.itemType === ITEM_TYPE.TASK) {
    const task = output as TaskItemOutput;
    return { ...base, itemType: 'task', lifecycle: task.lifecycle, temporal: task.temporal };
  }

  const event = output as EventItemOutput;
  return { ...base, itemType: 'event', lifecycle: event.lifecycle, temporal: event.temporal };
}
