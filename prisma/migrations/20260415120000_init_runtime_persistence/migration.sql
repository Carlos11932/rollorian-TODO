-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SpaceType" AS ENUM ('personal', 'group');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('task', 'event');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('pending', 'in_progress', 'blocked', 'postponed', 'done', 'canceled', 'scheduled', 'completed');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('owner', 'member');

-- CreateEnum
CREATE TYPE "ItemTemporalKind" AS ENUM ('undated', 'due_date', 'start_date', 'start_and_end', 'start_and_due', 'start_end_and_due', 'start');

-- CreateEnum
CREATE TYPE "GroupAuditChangeKind" AS ENUM ('assignees', 'cancellation', 'completion', 'dates', 'labels', 'priority', 'status', 'title');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "displayName" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'member',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spaces" (
    "id" TEXT NOT NULL,
    "type" "SpaceType" NOT NULL,
    "ownerId" TEXT,
    "groupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "spaceType" "SpaceType" NOT NULL,
    "ownerId" TEXT,
    "groupId" TEXT,
    "itemType" "ItemType" NOT NULL,
    "status" "ItemStatus" NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'medium',
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "temporalKind" "ItemTemporalKind" NOT NULL,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "postponedUntil" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "postponeCount" INTEGER NOT NULL DEFAULT 0,
    "versionToken" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_assignees" (
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "membershipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_assignees_pkey" PRIMARY KEY ("itemId","userId")
);

-- CreateTable
CREATE TABLE "labels" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "ownerId" TEXT,
    "groupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_labels" (
    "itemId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_labels_pkey" PRIMARY KEY ("itemId","labelId")
);

-- CreateTable
CREATE TABLE "group_audit_entries" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorDisplayName" TEXT,
    "actorEmail" TEXT,
    "versionToken" INTEGER NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_audit_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_audit_changes" (
    "entryId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "kind" "GroupAuditChangeKind" NOT NULL,
    "beforeStatus" "ItemStatus",
    "afterStatus" "ItemStatus",
    "beforePriority" "Priority",
    "afterPriority" "Priority",
    "beforeTitle" TEXT,
    "afterTitle" TEXT,
    "beforeAssigneeIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "afterAssigneeIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "beforeLabelValues" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "afterLabelValues" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "beforeTemporalKind" "ItemTemporalKind",
    "afterTemporalKind" "ItemTemporalKind",
    "beforeStartAt" TIMESTAMP(3),
    "afterStartAt" TIMESTAMP(3),
    "beforeEndAt" TIMESTAMP(3),
    "afterEndAt" TIMESTAMP(3),
    "beforeDueAt" TIMESTAMP(3),
    "afterDueAt" TIMESTAMP(3),
    "beforeCompletedAt" TIMESTAMP(3),
    "afterCompletedAt" TIMESTAMP(3),
    "beforeIsCompleted" BOOLEAN,
    "afterIsCompleted" BOOLEAN,
    "beforeCanceledAt" TIMESTAMP(3),
    "afterCanceledAt" TIMESTAMP(3),
    "beforeIsCanceled" BOOLEAN,
    "afterIsCanceled" BOOLEAN,

    CONSTRAINT "group_audit_changes_pkey" PRIMARY KEY ("entryId","position")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "groups_slug_key" ON "groups"("slug");

-- CreateIndex
CREATE INDEX "memberships_user_id_is_active_idx" ON "memberships"("userId", "isActive");

-- CreateIndex
CREATE INDEX "memberships_group_id_is_active_idx" ON "memberships"("groupId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_group_id_user_id_key" ON "memberships"("groupId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "spaces_owner_id_key" ON "spaces"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "spaces_group_id_key" ON "spaces"("groupId");

-- CreateIndex
CREATE INDEX "spaces_type_idx" ON "spaces"("type");

-- CreateIndex
CREATE INDEX "items_space_id_updated_at_idx" ON "items"("spaceId", "updatedAt");

-- CreateIndex
CREATE INDEX "items_owner_id_updated_at_idx" ON "items"("ownerId", "updatedAt");

-- CreateIndex
CREATE INDEX "items_group_id_updated_at_idx" ON "items"("groupId", "updatedAt");

-- CreateIndex
CREATE INDEX "items_space_type_item_type_status_idx" ON "items"("spaceType", "itemType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "items_id_version_token_key" ON "items"("id", "versionToken");

-- CreateIndex
CREATE INDEX "item_assignees_membership_id_idx" ON "item_assignees"("membershipId");

-- CreateIndex
CREATE UNIQUE INDEX "item_assignees_item_id_membership_id_key" ON "item_assignees"("itemId", "membershipId");

-- CreateIndex
CREATE INDEX "labels_value_idx" ON "labels"("value");

-- CreateIndex
CREATE UNIQUE INDEX "labels_owner_id_value_key" ON "labels"("ownerId", "value");

-- CreateIndex
CREATE UNIQUE INDEX "labels_group_id_value_key" ON "labels"("groupId", "value");

-- CreateIndex
CREATE INDEX "item_labels_label_id_idx" ON "item_labels"("labelId");

-- CreateIndex
CREATE INDEX "group_audit_entries_group_id_changed_at_idx" ON "group_audit_entries"("groupId", "changedAt");

-- CreateIndex
CREATE INDEX "group_audit_entries_item_id_changed_at_idx" ON "group_audit_entries"("itemId", "changedAt");

-- CreateIndex
CREATE UNIQUE INDEX "group_audit_entries_item_id_version_token_key" ON "group_audit_entries"("itemId", "versionToken");

-- CreateIndex
CREATE INDEX "group_audit_changes_kind_idx" ON "group_audit_changes"("kind");

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "spaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_assignees" ADD CONSTRAINT "item_assignees_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_assignees" ADD CONSTRAINT "item_assignees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_assignees" ADD CONSTRAINT "item_assignees_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "labels" ADD CONSTRAINT "labels_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "labels" ADD CONSTRAINT "labels_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_labels" ADD CONSTRAINT "item_labels_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_labels" ADD CONSTRAINT "item_labels_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "labels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_audit_entries" ADD CONSTRAINT "group_audit_entries_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_audit_entries" ADD CONSTRAINT "group_audit_entries_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_audit_entries" ADD CONSTRAINT "group_audit_entries_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_audit_changes" ADD CONSTRAINT "group_audit_changes_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "group_audit_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add row-level scope guards that Prisma cannot model directly.
ALTER TABLE "spaces"
  ADD CONSTRAINT "spaces_scope_owner_group_check"
  CHECK (
    ("type" = 'personal' AND "ownerId" IS NOT NULL AND "groupId" IS NULL)
    OR
    ("type" = 'group' AND "ownerId" IS NULL AND "groupId" IS NOT NULL)
  );

ALTER TABLE "items"
  ADD CONSTRAINT "items_scope_owner_group_check"
  CHECK (
    ("spaceType" = 'personal' AND "ownerId" IS NOT NULL AND "groupId" IS NULL)
    OR
    ("spaceType" = 'group' AND "ownerId" IS NULL AND "groupId" IS NOT NULL)
  );

-- Enforce item/space ownership alignment at the database boundary.
CREATE OR REPLACE FUNCTION "validate_item_space_ownership"()
RETURNS TRIGGER AS $$
DECLARE
  target_space RECORD;
BEGIN
  SELECT "type", "ownerId", "groupId"
  INTO target_space
  FROM "spaces"
  WHERE "id" = NEW."spaceId";

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item references unknown space %', NEW."spaceId";
  END IF;

  IF NEW."spaceType" <> target_space."type" THEN
    RAISE EXCEPTION 'Item spaceType % does not match space % type %', NEW."spaceType", NEW."spaceId", target_space."type";
  END IF;

  IF NEW."spaceType" = 'personal' THEN
    IF NEW."ownerId" IS NULL OR NEW."groupId" IS NOT NULL THEN
      RAISE EXCEPTION 'Personal items must have ownerId and no groupId';
    END IF;

    IF NEW."ownerId" IS DISTINCT FROM target_space."ownerId" THEN
      RAISE EXCEPTION 'Personal item owner % does not match space owner %', NEW."ownerId", target_space."ownerId";
    END IF;
  ELSE
    IF NEW."groupId" IS NULL OR NEW."ownerId" IS NOT NULL THEN
      RAISE EXCEPTION 'Group items must have groupId and no ownerId';
    END IF;

    IF NEW."groupId" IS DISTINCT FROM target_space."groupId" THEN
      RAISE EXCEPTION 'Group item group % does not match space group %', NEW."groupId", target_space."groupId";
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "items_validate_space_ownership"
  BEFORE INSERT OR UPDATE OF "spaceId", "spaceType", "ownerId", "groupId"
  ON "items"
  FOR EACH ROW
  EXECUTE FUNCTION "validate_item_space_ownership"();

-- Preserve append-only semantics for persisted audit history.
CREATE OR REPLACE FUNCTION "reject_audit_mutation"()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION '% rows are append-only', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "group_audit_entries_append_only"
  BEFORE UPDATE OR DELETE ON "group_audit_entries"
  FOR EACH ROW
  EXECUTE FUNCTION "reject_audit_mutation"();

CREATE TRIGGER "group_audit_changes_append_only"
  BEFORE UPDATE OR DELETE ON "group_audit_changes"
  FOR EACH ROW
  EXECUTE FUNCTION "reject_audit_mutation"();
