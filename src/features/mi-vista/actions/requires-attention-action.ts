'use server';

import { ensureDevSeed, getRequiresAttentionHandler } from '@/lib/item-command-factory';
import { MOCK_USER_ID } from '@/dev-data/actor';
import { SEED_GROUP_IDS } from '@/dev-data/seed';
import { VIEW_SPACE_FILTER } from '@/application/queries/views';
import type { ItemCardDto } from '@/interfaces/ui/item-card-dto';
import { toItemCard } from '@/interfaces/ui/item-card-mapper';

const ACTOR_CONTEXT = {
  actorUserId: MOCK_USER_ID,
  visibleGroupIds: [SEED_GROUP_IDS.alpha, SEED_GROUP_IDS.producto] as const,
} as const;

export interface RequiresAttentionResult {
  items: ItemCardDto[];
}

export async function getRequiresAttentionAction(): Promise<RequiresAttentionResult> {
  await ensureDevSeed();

  const result = await getRequiresAttentionHandler.execute({
    ...ACTOR_CONTEXT,
    spaceFilter: VIEW_SPACE_FILTER.BOTH,
  });

  return { items: result.items.map(toItemCard) };
}
