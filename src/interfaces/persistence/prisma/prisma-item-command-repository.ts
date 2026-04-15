import { Prisma, PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

import type { ItemCommandRepository, ItemRecord } from "@/application/commands";
import { createItemLabel } from "@/domain/item";
import { createVersionToken, SPACE_TYPE, type ItemId, type VersionToken } from "@/domain/shared";

import { mapPrismaItemAggregateToItemRecord } from "./item-record-mapper";
import { prismaItemAggregateArgs } from "./runtime-aggregates";

const prismaPersistedItemIdentitySelect = {
  groupId: true,
  id: true,
  ownerId: true,
  spaceId: true,
  spaceType: true,
  versionToken: true,
} as const satisfies Prisma.ItemSelect;

type PrismaPersistedItemIdentityRow = Prisma.ItemGetPayload<{
  select: typeof prismaPersistedItemIdentitySelect;
}>;

type PrismaItemCommandRepositoryClient = Pick<
  PrismaClient,
  "$transaction" | "item" | "itemAssignee" | "itemLabel" | "label" | "membership"
>;

type PrismaItemCommandRepositoryTransaction = Pick<
  Prisma.TransactionClient,
  "item" | "itemAssignee" | "itemLabel" | "label" | "membership"
>;

interface PersistedAssigneeLink {
  membershipId: string | null;
  userId: string;
}

interface PersistedLabelLink {
  id: string;
  value: string;
}

export class PrismaItemCommandRepositoryError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class PrismaItemCommandRepositoryValidationError extends PrismaItemCommandRepositoryError {}

export class PrismaItemVersionConflictError extends PrismaItemCommandRepositoryError {
  public constructor(
    public readonly expectedVersionToken: VersionToken,
    public readonly actualVersionToken: VersionToken,
  ) {
    super("Shared item version does not match the persisted version.");
  }
}

function buildScopedItemData(
  record: ItemRecord,
): Pick<Prisma.ItemUncheckedCreateInput, "groupId" | "ownerId" | "spaceId" | "spaceType"> {
  if (record.spaceType === SPACE_TYPE.PERSONAL) {
    return {
      groupId: null,
      ownerId: record.ownerId,
      spaceId: record.item.spaceId,
      spaceType: record.spaceType,
    };
  }

  return {
    groupId: record.groupId,
    ownerId: null,
    spaceId: record.item.spaceId,
    spaceType: record.spaceType,
  };
}

function buildTemporalData(record: ItemRecord): Pick<
  Prisma.ItemUncheckedCreateInput,
  "dueAt" | "endAt" | "startAt" | "temporalKind"
> {
  const { temporal } = record.item;

  return {
    dueAt: "dueAt" in temporal ? temporal.dueAt : null,
    endAt: "endAt" in temporal ? temporal.endAt : null,
    startAt: "startAt" in temporal ? temporal.startAt : null,
    temporalKind: temporal.kind,
  };
}

function buildLifecycleData(record: ItemRecord): Pick<
  Prisma.ItemUncheckedCreateInput,
  "canceledAt" | "completedAt" | "postponedUntil" | "status"
> {
  const { lifecycle } = record.item;

  return {
    canceledAt: "canceledAt" in lifecycle ? lifecycle.canceledAt : null,
    completedAt: "completedAt" in lifecycle ? lifecycle.completedAt : null,
    postponedUntil: "postponedUntil" in lifecycle ? lifecycle.postponedUntil : null,
    status: record.item.lifecycle.status,
  };
}

function buildItemCreateData(record: ItemRecord): Prisma.ItemUncheckedCreateInput {
  return {
    ...buildScopedItemData(record),
    ...buildTemporalData(record),
    ...buildLifecycleData(record),
    createdAt: record.item.createdAt,
    id: record.item.id,
    itemType: record.item.itemType,
    notes: record.item.notes,
    postponeCount: record.item.postponeCount,
    priority: record.item.priority,
    title: record.item.title,
    updatedAt: record.item.updatedAt,
    versionToken: record.item.versionToken,
  };
}

function buildItemUpdateData(record: ItemRecord): Prisma.ItemUncheckedUpdateInput {
  return {
    ...buildScopedItemData(record),
    ...buildTemporalData(record),
    ...buildLifecycleData(record),
    itemType: record.item.itemType,
    notes: record.item.notes,
    postponeCount: record.item.postponeCount,
    priority: record.item.priority,
    title: record.item.title,
    updatedAt: record.item.updatedAt,
    versionToken: record.item.versionToken,
  };
}

function normalizeAssigneeIds(record: ItemRecord): readonly string[] {
  return [...new Set(record.assigneeIds)];
}

function normalizeLabelValues(record: ItemRecord): readonly string[] {
  const labelsByValue = new Map<string, string>();

  for (const label of record.labels) {
    const normalized = createItemLabel(label.value).value;

    if (!labelsByValue.has(normalized)) {
      labelsByValue.set(normalized, normalized);
    }
  }

  return [...labelsByValue.values()];
}

function assertRecordMatchesPersistedScope(
  persisted: PrismaPersistedItemIdentityRow,
  record: ItemRecord,
): void {
  if (persisted.spaceId !== record.item.spaceId || persisted.spaceType !== record.spaceType) {
    throw new PrismaItemCommandRepositoryValidationError(
      "Persisted item scope does not match the record being saved.",
    );
  }

  if (record.spaceType === SPACE_TYPE.PERSONAL) {
    if (persisted.ownerId !== record.ownerId || persisted.groupId !== null) {
      throw new PrismaItemCommandRepositoryValidationError(
        "Persisted personal item scope does not match the record owner.",
      );
    }

    return;
  }

  if (persisted.groupId !== record.groupId || persisted.ownerId !== null) {
    throw new PrismaItemCommandRepositoryValidationError(
      "Persisted group item scope does not match the record group.",
    );
  }
}

export class PrismaItemCommandRepository implements ItemCommandRepository {
  public constructor(
    private readonly client: PrismaItemCommandRepositoryClient,
  ) {}

  public async findById(itemId: ItemId): Promise<ItemRecord | null> {
    const aggregate = await this.client.item.findUnique({
      ...prismaItemAggregateArgs,
      where: { id: itemId },
    });

    return aggregate === null ? null : mapPrismaItemAggregateToItemRecord(aggregate);
  }

  public async save(record: ItemRecord): Promise<void> {
    await this.client.$transaction(async (tx) => {
      const assignees = await this.resolveAssignees(tx, record);
      const labels = await this.resolveLabels(tx, record);
      const persistedItem = await tx.item.findUnique({
        select: prismaPersistedItemIdentitySelect,
        where: { id: record.item.id },
      });

      if (persistedItem === null) {
        await tx.item.create({
          data: buildItemCreateData(record),
        });
      } else {
        assertRecordMatchesPersistedScope(persistedItem, record);

        if (record.spaceType === SPACE_TYPE.GROUP) {
          await this.updateExistingGroupItem(tx, persistedItem, record);
        } else {
          const result = await tx.item.updateMany({
            data: buildItemUpdateData(record),
            where: { id: record.item.id },
          });

          if (result.count !== 1) {
            throw new PrismaItemCommandRepositoryValidationError(
              `Personal item update did not affect exactly one row for ${record.item.id}.`,
            );
          }
        }
      }

      await tx.itemAssignee.deleteMany({
        where: { itemId: record.item.id },
      });

      if (assignees.length > 0) {
        await tx.itemAssignee.createMany({
          data: assignees.map((assignee) => ({
            itemId: record.item.id,
            membershipId: assignee.membershipId,
            userId: assignee.userId,
          })),
        });
      }

      await tx.itemLabel.deleteMany({
        where: { itemId: record.item.id },
      });

      if (labels.length > 0) {
        await tx.itemLabel.createMany({
          data: labels.map((label) => ({
            itemId: record.item.id,
            labelId: label.id,
          })),
        });
      }
    });
  }

  private async resolveAssignees(
    tx: PrismaItemCommandRepositoryTransaction,
    record: ItemRecord,
  ): Promise<readonly PersistedAssigneeLink[]> {
    const assigneeIds = normalizeAssigneeIds(record);

    if (record.spaceType === SPACE_TYPE.PERSONAL) {
      const invalidAssigneeIds = assigneeIds.filter((assigneeId) => assigneeId !== record.ownerId);

      if (invalidAssigneeIds.length > 0) {
        throw new PrismaItemCommandRepositoryValidationError(
          "Personal items may only assign the personal owner.",
        );
      }

      return assigneeIds.map((userId) => ({
        membershipId: null,
        userId,
      }));
    }

    if (assigneeIds.length === 0) {
      return [];
    }

    const memberships = await tx.membership.findMany({
      select: {
        id: true,
        userId: true,
      },
      where: {
        groupId: record.groupId,
        isActive: true,
        userId: {
          in: [...assigneeIds],
        },
      },
    });

    const membershipsByUserId = new Map(
      memberships.map((membership) => [membership.userId, membership.id]),
    );
    const missingAssigneeIds = assigneeIds.filter(
      (assigneeId) => !membershipsByUserId.has(assigneeId),
    );

    if (missingAssigneeIds.length > 0) {
      throw new PrismaItemCommandRepositoryValidationError(
        `Group items may only assign active group members: ${missingAssigneeIds.join(", ")}.`,
      );
    }

    return assigneeIds.map((userId) => ({
      membershipId: membershipsByUserId.get(userId) ?? null,
      userId,
    }));
  }

  private async resolveLabels(
    tx: PrismaItemCommandRepositoryTransaction,
    record: ItemRecord,
  ): Promise<readonly PersistedLabelLink[]> {
    const labelValues = normalizeLabelValues(record);

    if (labelValues.length === 0) {
      return [];
    }

    const labels: PersistedLabelLink[] = [];

    for (const value of labelValues) {
      const label =
        record.spaceType === SPACE_TYPE.PERSONAL
          ? await tx.label.upsert({
              create: {
                groupId: null,
                id: `label-${randomUUID()}`,
                ownerId: record.ownerId,
                value,
              },
              update: {},
              where: {
                ownerId_value: {
                  ownerId: record.ownerId,
                  value,
                },
              },
            })
          : await tx.label.upsert({
              create: {
                groupId: record.groupId,
                id: `label-${randomUUID()}`,
                ownerId: null,
                value,
              },
              update: {},
              where: {
                groupId_value: {
                  groupId: record.groupId,
                  value,
                },
              },
            });

      labels.push({
        id: label.id,
        value: label.value,
      });
    }

    return labels;
  }

  private async updateExistingGroupItem(
    tx: PrismaItemCommandRepositoryTransaction,
    persistedItem: PrismaPersistedItemIdentityRow,
    record: ItemRecord,
  ): Promise<void> {
    if (record.item.versionToken < 1) {
      throw new PrismaItemCommandRepositoryValidationError(
        "Shared item updates must increment the version token before saving.",
      );
    }

    const previousVersionToken = createVersionToken(record.item.versionToken - 1);
    const result = await tx.item.updateMany({
      data: buildItemUpdateData(record),
      where: {
        id: record.item.id,
        versionToken: previousVersionToken,
      },
    });

    if (result.count === 1) {
      return;
    }

    throw new PrismaItemVersionConflictError(
      previousVersionToken,
      createVersionToken(persistedItem.versionToken),
    );
  }
}
