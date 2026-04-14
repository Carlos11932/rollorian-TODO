import { authorizeSpaceAccess } from "@/domain/access";
import type { ItemId } from "@/domain/shared";
import {
  createAccessDeniedError,
  createNotFoundError,
  createScopeMismatchError,
  toItemOutput,
  validateRecordSpaceMatch,
  type CommandResult,
  type ItemCommandActorInput,
  type ItemCommandRepository,
  type ItemCommandSpace,
  type ItemOutput,
} from "./shared";

export interface ReadItemByIdCommand extends ItemCommandActorInput {
  itemId: ItemId;
  space: ItemCommandSpace;
}

export type ReadItemByIdCommandResult = CommandResult<ItemOutput>;

export class ReadItemByIdCommandHandler {
  public constructor(private readonly itemRepository: ItemCommandRepository) {}

  public async execute(
    command: ReadItemByIdCommand,
  ): Promise<ReadItemByIdCommandResult> {
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

    if (!authorization.canView) {
      return createAccessDeniedError();
    }

    return {
      ok: true,
      value: toItemOutput(record),
    };
  }
}
