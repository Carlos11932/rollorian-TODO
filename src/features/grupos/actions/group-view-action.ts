'use server';

import { ensureDevSeed, getGroupViewHandler } from '@/lib/item-command-factory';
import { getActorContext } from '@/lib/session-actor';
import { createGroupId } from '@/domain/shared';
import type { ItemCardDto } from '@/interfaces/ui/item-card-dto';
import { toItemCard } from '@/interfaces/ui/item-card-mapper';

export interface GroupViewResult {
  items: ItemCardDto[];
}

export async function getGroupViewAction(groupId: string): Promise<GroupViewResult> {
  await ensureDevSeed();
  const actorContext = await getActorContext();

  const gid = createGroupId(groupId);

  const result = await getGroupViewHandler.execute({
    ...actorContext,
    groupId: gid,
  });

  return { items: result.items.map(toItemCard) };
}
