'use server';

import { ensureDevSeed, getGroupViewHandler } from '@/lib/item-command-factory';
import { MOCK_USER_ID } from '@/dev-data/actor';
import { SEED_GROUP_IDS } from '@/dev-data/seed';
import { createGroupId } from '@/domain/shared';
import type { ItemCardDto } from '@/interfaces/ui/item-card-dto';
import { toItemCard } from '@/interfaces/ui/item-card-mapper';

const ACTOR_CONTEXT = {
  actorUserId: MOCK_USER_ID,
  visibleGroupIds: [SEED_GROUP_IDS.alpha, SEED_GROUP_IDS.producto] as const,
} as const;

export interface GroupViewResult {
  items: ItemCardDto[];
}

export async function getGroupViewAction(groupId: string): Promise<GroupViewResult> {
  await ensureDevSeed();

  const gid = createGroupId(groupId);

  const result = await getGroupViewHandler.execute({
    ...ACTOR_CONTEXT,
    groupId: gid,
  });

  return { items: result.items.map(toItemCard) };
}
