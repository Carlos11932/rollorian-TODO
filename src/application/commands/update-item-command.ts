import { authorizeSpaceAccess } from "@/domain/access";
import {
  noopGroupItemAuditRecorder,
  type GroupItemAuditRecorder,
} from "@/application/history";
import {
  createEventItem,
  createTaskItem,
  updateEventItem,
  updateTaskItem,
  validateItemAssignment,
  validateItemLabels,
  type Item,
} from "@/domain/item";
import { ITEM_TYPE, SPACE_TYPE, incrementVersionToken } from "@/domain/shared";
import {
  commandSuccess,
  createAccessDeniedError,
  createNotFoundError,
  createScopeMismatchError,
  createValidationError,
  createVersionConflictError,
  toItemOutput,
  validateRecordSpaceMatch,
  type CommandResult,
  type EventUpdateFields,
  type GroupItemRecord,
  type ItemCommandRepository,
  type ItemMutationInputBase,
  type ItemOutput,
  type ItemRecord,
  type TaskUpdateFields,
  type UpdateEventToTaskFields,
  type UpdateTaskToEventFields,
} from "./shared";

export interface UpdateItemCommandBase extends ItemMutationInputBase {
  expectedVersionToken?: import("@/domain/shared").VersionToken;
}

export type UpdateItemCommand = UpdateItemCommandBase &
  (
    | TaskUpdateFields
    | EventUpdateFields
    | UpdateTaskToEventFields
    | UpdateEventToTaskFields
  );

export type UpdateItemCommandResult = CommandResult<ItemOutput>;

function buildNextItem(item: Item, command: UpdateItemCommand): Item {
  if (item.itemType === ITEM_TYPE.TASK) {
    if (command.itemType === ITEM_TYPE.EVENT) {
      const eventFields = command as UpdateTaskToEventFields;

      return createEventItem({
        createdAt: item.createdAt,
        id: item.id,
        itemType: ITEM_TYPE.EVENT,
        lifecycle: eventFields.lifecycle,
        notes: command.notes === undefined ? item.notes : command.notes,
        priority: command.priority ?? item.priority,
        spaceId: item.spaceId,
        spaceType: item.spaceType,
        temporal: eventFields.temporal,
        title: command.title ?? item.title,
        updatedAt: command.updatedAt,
        versionToken: item.versionToken,
      });
    }

    const taskFields = command as TaskUpdateFields;

    return updateTaskItem(item, {
      lifecycle: taskFields.lifecycle,
      notes: command.notes,
      postponeCount: taskFields.postponeCount,
      priority: command.priority,
      temporal: taskFields.temporal,
      title: command.title,
      updatedAt: command.updatedAt,
      versionToken: item.versionToken,
    });
  }

  if (command.itemType === ITEM_TYPE.TASK) {
    const taskFields = command as UpdateEventToTaskFields;

    return createTaskItem({
      createdAt: item.createdAt,
      id: item.id,
      itemType: ITEM_TYPE.TASK,
      lifecycle: taskFields.lifecycle,
      notes: command.notes === undefined ? item.notes : command.notes,
      postponeCount: taskFields.postponeCount,
      priority: command.priority ?? item.priority,
      spaceId: item.spaceId,
      spaceType: item.spaceType,
      temporal: taskFields.temporal,
      title: command.title ?? item.title,
      updatedAt: command.updatedAt,
      versionToken: item.versionToken,
    });
  }

  const eventFields = command as EventUpdateFields;

  return updateEventItem(item, {
    lifecycle: eventFields.lifecycle,
    notes: command.notes,
    priority: command.priority,
    temporal: eventFields.temporal,
    title: command.title,
    updatedAt: command.updatedAt,
    versionToken: item.versionToken,
  });
}

function getNextAssigneeIds(
  command: UpdateItemCommand,
  record: ItemRecord,
): readonly import("@/domain/shared").UserId[] {
  return command.assigneeIds ?? record.assigneeIds;
}

function getNextLabels(
  command: UpdateItemCommand,
  record: ItemRecord,
): readonly string[] {
  return command.labels ?? record.labels.map((label) => label.value);
}

function toGroupItemAuditSnapshot(record: GroupItemRecord) {
  return {
    assigneeIds: record.assigneeIds,
    groupId: record.groupId,
    item: record.item,
    labels: record.labels,
  };
}

export class UpdateItemCommandHandler {
  public constructor(
    private readonly itemRepository: ItemCommandRepository,
    private readonly groupItemAuditRecorder: GroupItemAuditRecorder = noopGroupItemAuditRecorder,
  ) {}

  public async execute(
    command: UpdateItemCommand,
  ): Promise<UpdateItemCommandResult> {
    const record = await this.itemRepository.findById(command.itemId);

    if (record === null) {
      return createNotFoundError(command.itemId);
    }

    const spaceViolations = validateRecordSpaceMatch(record, command.space);

    if (spaceViolations.length > 0) {
      return createScopeMismatchError(spaceViolations);
    }

    const authorization = authorizeSpaceAccess({
      actor: command.actor,
      context: command.space.accessContext,
    });

    if (!authorization.canEdit) {
      return createAccessDeniedError();
    }

    if (record.spaceType === SPACE_TYPE.GROUP) {
      if (command.expectedVersionToken === undefined) {
        return createValidationError(
          "Shared item updates require an expected version token.",
          ["expectedVersionToken is required for shared items."],
        );
      }

      if (command.expectedVersionToken !== record.item.versionToken) {
        return createVersionConflictError(
          command.expectedVersionToken,
          record.item.versionToken,
        );
      }
    }

    const assignmentResult = validateItemAssignment({
      assigneeIds: getNextAssigneeIds(command, record),
      scope: command.space.scope,
    });

    if (!assignmentResult.isValid) {
      return createValidationError(
        "Item assignment violates the current space policy.",
        assignmentResult.violations,
      );
    }

    const labelResult = validateItemLabels({
      labels: getNextLabels(command, record),
      scope: command.space.scope,
    });

    if (!labelResult.isValid) {
      return createValidationError(
        "Item labels violate the current scope policy.",
        labelResult.violations,
      );
    }

    try {
      const nextItem = buildNextItem(record.item, command);
      const nextRecord: ItemRecord = {
        ...record,
        assigneeIds: assignmentResult.assigneeIds,
        item: {
          ...nextItem,
          versionToken: incrementVersionToken(record.item.versionToken),
        },
        labels: labelResult.labels,
      } as ItemRecord;

      await this.itemRepository.save(nextRecord);

      if (record.spaceType === SPACE_TYPE.GROUP && nextRecord.groupId !== null) {
        await this.groupItemAuditRecorder.record({
          actor: command.actor.metadata,
          after: toGroupItemAuditSnapshot(nextRecord),
          before: toGroupItemAuditSnapshot(record),
        });
      }

      return commandSuccess(toItemOutput(nextRecord));
    } catch (error) {
      return createValidationError("Item update violates domain invariants.", [
        error instanceof Error ? error.message : "Unknown item update error.",
      ]);
    }
  }
}
