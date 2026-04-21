import { authorizeSpaceAccess } from "@/domain/access";
import {
  createEventItem,
  createTaskItem,
  validateItemAssignment,
  validateItemLabels,
} from "@/domain/item";
import { SPACE_TYPE, type ItemId, type Priority, type UserId } from "@/domain/shared";
import type { AuthorizationActor } from "@/domain/identity";
import {
  commandSuccess,
  createAccessDeniedError,
  createScopeMismatchError,
  createValidationError,
  toItemOutput,
  validateCommandSpace,
  type CommandResult,
  type EventCreateFields,
  type ItemCommandRepository,
  type ItemCommandSpace,
  type ItemOutput,
  type TaskCreateFields,
} from "./shared";

export interface CreateItemCommandBase {
  actor: AuthorizationActor;
  assigneeIds?: readonly UserId[];
  itemId: ItemId;
  labels?: readonly string[];
  notes?: string | null;
  priority?: Priority;
  space: ItemCommandSpace;
  title: string;
  updatedAt?: Date;
}

export type CreateItemCommand =
  | (CreateItemCommandBase & TaskCreateFields)
  | (CreateItemCommandBase & EventCreateFields);

export type CreateItemCommandResult = CommandResult<ItemOutput>;

export class CreateItemCommandHandler {
  public constructor(private readonly itemRepository: ItemCommandRepository) {}

  public async execute(
    command: CreateItemCommand,
  ): Promise<CreateItemCommandResult> {
    const spaceViolations = validateCommandSpace(command.space);

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

    const assignmentResult = validateItemAssignment({
      scope: command.space.scope,
      assigneeIds: command.assigneeIds ?? [],
    });

    if (!assignmentResult.isValid) {
      return createValidationError(
        "Item assignment violates the current space policy.",
        assignmentResult.violations,
      );
    }

    const labelResult = validateItemLabels({
      scope: command.space.scope,
      labels: command.labels ?? [],
    });

    if (!labelResult.isValid) {
      return createValidationError(
        "Item labels violate the current scope policy.",
        labelResult.violations,
      );
    }

    try {
      const item =
        command.itemType === "task"
          ? createTaskItem({
              id: command.itemId,
              itemType: command.itemType,
              lifecycle: command.lifecycle,
              notes: command.notes,
              postponeCount: command.postponeCount,
              priority: command.priority,
              spaceId: command.space.accessContext.spaceId,
              spaceType: command.space.accessContext.spaceType,
              temporal: command.temporal,
              title: command.title,
              updatedAt: command.updatedAt,
            })
          : createEventItem({
              id: command.itemId,
              itemType: command.itemType,
              lifecycle: command.lifecycle,
              notes: command.notes,
              priority: command.priority,
              spaceId: command.space.accessContext.spaceId,
              spaceType: command.space.accessContext.spaceType,
              temporal: command.temporal,
              title: command.title,
              updatedAt: command.updatedAt,
            });

      const record =
        command.space.accessContext.spaceType === SPACE_TYPE.PERSONAL
          ? {
              assigneeIds: assignmentResult.assigneeIds,
              groupId: null,
              item,
              labels: labelResult.labels,
              ownerId: command.space.accessContext.ownerId,
              spaceType: SPACE_TYPE.PERSONAL,
            }
          : {
              assigneeIds: assignmentResult.assigneeIds,
              groupId: command.space.accessContext.groupId,
              item,
              labels: labelResult.labels,
              ownerId: null,
              spaceType: SPACE_TYPE.GROUP,
            };

      await this.itemRepository.save(record);

      return commandSuccess(toItemOutput(record));
    } catch (error) {
      return createValidationError("Item creation violates domain invariants.", [
        error instanceof Error ? error.message : "Unknown item creation error.",
      ]);
    }
  }
}
