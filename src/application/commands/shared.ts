import {
  isGroupSpaceAccessContext,
  isPersonalSpaceAccessContext,
  type GroupSpaceAccessContext,
  type PersonalSpaceAccessContext,
} from "@/domain/access";
import type { AuthorizationActor } from "@/domain/identity";
import {
  getItemStatus,
  isGroupItemScope,
  isPersonalItemScope,
  type EventItem,
  type EventLifecycle,
  type EventTemporal,
  type GroupItemScope,
  type Item,
  type ItemLabel,
  type PersonalItemScope,
  type TaskItem,
  type TaskLifecycle,
  type TaskTemporal,
} from "@/domain/item";
import {
  ITEM_TYPE,
  SPACE_TYPE,
  type GroupId,
  type ItemId,
  type Priority,
  type SpaceId,
  type UserId,
  type VersionToken,
} from "@/domain/shared";

export const ITEM_COMMAND_ERROR_CODE = {
  ACCESS_DENIED: "access_denied",
  NOT_FOUND: "not_found",
  SCOPE_MISMATCH: "scope_mismatch",
  VALIDATION_FAILED: "validation_failed",
  VERSION_CONFLICT: "version_conflict",
} as const;

export type ItemCommandErrorCode =
  (typeof ITEM_COMMAND_ERROR_CODE)[keyof typeof ITEM_COMMAND_ERROR_CODE];

export interface ItemCommandError {
  code: ItemCommandErrorCode;
  message: string;
  actualVersionToken?: VersionToken;
  expectedVersionToken?: VersionToken;
  violations?: readonly string[];
}

export interface CommandSuccess<TValue> {
  ok: true;
  value: TValue;
}

export interface CommandFailure {
  ok: false;
  error: ItemCommandError;
}

export type CommandResult<TValue> = CommandSuccess<TValue> | CommandFailure;

export interface PersonalCommandSpace {
  accessContext: PersonalSpaceAccessContext;
  scope: PersonalItemScope;
}

export interface GroupCommandSpace {
  accessContext: GroupSpaceAccessContext;
  scope: GroupItemScope;
}

export type ItemCommandSpace = PersonalCommandSpace | GroupCommandSpace;

export interface ItemRecordBase {
  item: Item;
  assigneeIds: readonly UserId[];
  labels: readonly ItemLabel[];
}

export interface PersonalItemRecord extends ItemRecordBase {
  ownerId: UserId;
  groupId: null;
  spaceType: typeof SPACE_TYPE.PERSONAL;
}

export interface GroupItemRecord extends ItemRecordBase {
  ownerId: null;
  groupId: GroupId;
  spaceType: typeof SPACE_TYPE.GROUP;
}

export type ItemRecord = PersonalItemRecord | GroupItemRecord;

export interface ItemCommandRepository {
  findById(itemId: ItemId): Promise<ItemRecord | null>;
  save(record: ItemRecord): Promise<void>;
}

export interface ItemCommandActorInput {
  actor: AuthorizationActor;
}

export interface ItemMutationInputBase extends ItemCommandActorInput {
  assigneeIds?: readonly UserId[];
  itemId: ItemId;
  labels?: readonly string[];
  notes?: string | null;
  priority?: Priority;
  space: ItemCommandSpace;
  title?: string;
  updatedAt?: Date;
}

export interface TaskUpdateFields {
  itemType?: typeof ITEM_TYPE.TASK;
  lifecycle?: TaskLifecycle;
  postponeCount?: number;
  temporal?: TaskTemporal;
}

export interface EventUpdateFields {
  itemType?: typeof ITEM_TYPE.EVENT;
  lifecycle?: EventLifecycle;
  temporal?: EventTemporal;
}

export interface UpdateTaskToEventFields {
  itemType: typeof ITEM_TYPE.EVENT;
  lifecycle?: EventLifecycle;
  temporal: EventTemporal;
}

export interface UpdateEventToTaskFields {
  itemType: typeof ITEM_TYPE.TASK;
  lifecycle?: TaskLifecycle;
  postponeCount?: number;
  temporal: TaskTemporal;
}

export type UpdateItemChanges =
  | TaskUpdateFields
  | EventUpdateFields
  | UpdateTaskToEventFields
  | UpdateEventToTaskFields;

export interface TaskCreateFields {
  itemType: typeof ITEM_TYPE.TASK;
  lifecycle?: TaskLifecycle;
  postponeCount?: number;
  temporal: TaskTemporal;
}

export interface EventCreateFields {
  itemType: typeof ITEM_TYPE.EVENT;
  lifecycle?: EventLifecycle;
  temporal: EventTemporal;
}

export interface ItemOutputBase {
  assigneeIds: readonly UserId[];
  createdAt: Date;
  groupId: GroupId | null;
  id: ItemId;
  labels: readonly ItemLabel[];
  notes: string | null;
  ownerId: UserId | null;
  postponeCount: number;
  priority: Priority;
  spaceId: SpaceId;
  spaceType: typeof SPACE_TYPE.PERSONAL | typeof SPACE_TYPE.GROUP;
  status: string;
  title: string;
  updatedAt: Date;
  versionToken: VersionToken;
}

export interface TaskItemOutput extends ItemOutputBase {
  itemType: typeof ITEM_TYPE.TASK;
  lifecycle: TaskLifecycle;
  temporal: TaskTemporal;
}

export interface EventItemOutput extends ItemOutputBase {
  itemType: typeof ITEM_TYPE.EVENT;
  lifecycle: EventLifecycle;
  temporal: EventTemporal;
}

export type ItemOutput = TaskItemOutput | EventItemOutput;

export function commandFailure(error: ItemCommandError): CommandFailure {
  return {
    ok: false,
    error,
  };
}

export function commandSuccess<TValue>(value: TValue): CommandSuccess<TValue> {
  return {
    ok: true,
    value,
  };
}

export function createValidationError(
  message: string,
  violations: readonly string[],
): CommandFailure {
  return commandFailure({
    code: ITEM_COMMAND_ERROR_CODE.VALIDATION_FAILED,
    message,
    violations,
  });
}

export function createScopeMismatchError(violations: readonly string[]): CommandFailure {
  return commandFailure({
    code: ITEM_COMMAND_ERROR_CODE.SCOPE_MISMATCH,
    message: "Command space does not match the target item scope.",
    violations,
  });
}

export function createNotFoundError(itemId: ItemId): CommandFailure {
  return commandFailure({
    code: ITEM_COMMAND_ERROR_CODE.NOT_FOUND,
    message: `Item not found: ${itemId}.`,
  });
}

export function createAccessDeniedError(): CommandFailure {
  return commandFailure({
    code: ITEM_COMMAND_ERROR_CODE.ACCESS_DENIED,
    message: "Actor is not allowed to access this item.",
  });
}

export function createVersionConflictError(
  expectedVersionToken: VersionToken,
  actualVersionToken: VersionToken,
): CommandFailure {
  return commandFailure({
    code: ITEM_COMMAND_ERROR_CODE.VERSION_CONFLICT,
    message: "Shared item version does not match the expected version.",
    expectedVersionToken,
    actualVersionToken,
  });
}

export function toItemOutput(record: ItemRecord): ItemOutput {
  const base: ItemOutputBase = {
    assigneeIds: record.assigneeIds,
    createdAt: record.item.createdAt,
    groupId: record.groupId,
    id: record.item.id,
    labels: record.labels,
    notes: record.item.notes,
    ownerId: record.ownerId,
    postponeCount: record.item.postponeCount,
    priority: record.item.priority,
    spaceId: record.item.spaceId,
    spaceType: record.spaceType,
    status: getItemStatus(record.item),
    title: record.item.title,
    updatedAt: record.item.updatedAt,
    versionToken: record.item.versionToken,
  };

  if (record.item.itemType === ITEM_TYPE.TASK) {
    const task = record.item as TaskItem;

    return {
      ...base,
      itemType: ITEM_TYPE.TASK,
      lifecycle: task.lifecycle,
      temporal: task.temporal,
    };
  }

  const event = record.item as EventItem;

  return {
    ...base,
    itemType: ITEM_TYPE.EVENT,
    lifecycle: event.lifecycle,
    temporal: event.temporal,
  };
}

export function validateCommandSpace(space: ItemCommandSpace): readonly string[] {
  if (space.scope.spaceType !== space.accessContext.spaceType) {
    return ["Command scope and access context must use the same space type."];
  }

  if (isPersonalItemScope(space.scope) && isPersonalSpaceAccessContext(space.accessContext)) {
    return space.scope.ownerId === space.accessContext.ownerId
      ? []
      : ["Personal command space must use the same owner in scope and access context."];
  }

  const violations: string[] = [];

  if (!isGroupItemScope(space.scope) || !isGroupSpaceAccessContext(space.accessContext)) {
    return ["Group command space must use group scope and group access context."];
  }

  if (space.scope.groupId !== space.accessContext.groupId) {
    violations.push(
      "Group command space must use the same group in scope and access context.",
    );
  }

  if (space.scope.memberships !== space.accessContext.memberships) {
    violations.push(
      "Group command space must reuse the same membership collection in scope and access context.",
    );
  }

  return violations;
}

export function validateRecordSpaceMatch(
  record: ItemRecord,
  space: ItemCommandSpace,
): readonly string[] {
  const violations = [...validateCommandSpace(space)];

  if (record.item.spaceId !== space.accessContext.spaceId) {
    violations.push("Command access context must target the same space as the item.");
  }

  if (record.spaceType !== space.accessContext.spaceType) {
    violations.push("Command space type must match the stored item space type.");
  }

  if (record.spaceType === SPACE_TYPE.PERSONAL) {
    if (space.accessContext.spaceType !== SPACE_TYPE.PERSONAL) {
      violations.push("Personal items require a personal command space.");
      return violations;
    }

    if (record.ownerId !== space.accessContext.ownerId) {
      violations.push("Personal item owner does not match the provided command space.");
    }

    return violations;
  }

  if (space.accessContext.spaceType !== SPACE_TYPE.GROUP) {
    violations.push("Group items require a group command space.");
    return violations;
  }

  if (record.groupId !== space.accessContext.groupId) {
    violations.push("Group item group does not match the provided command space.");
  }

  return violations;
}
