'use server';

import { ensureDevSeed, getRequiresAttentionHandler } from '@/lib/item-command-factory';
import { getActorContext } from '@/lib/session-actor';
import { VIEW_SPACE_FILTER } from '@/application/queries/views';
import type { ItemCardDto } from '@/interfaces/ui/item-card-dto';
import { toItemCard } from '@/interfaces/ui/item-card-mapper';

export interface RequiresAttentionResult {
  items: ItemCardDto[];
}

export async function getRequiresAttentionAction(): Promise<RequiresAttentionResult> {
  await ensureDevSeed();
  const actorContext = await getActorContext();

  const result = await getRequiresAttentionHandler.execute({
    ...actorContext,
    spaceFilter: VIEW_SPACE_FILTER.BOTH,
  });

  return { items: result.items.map(toItemCard) };
}
