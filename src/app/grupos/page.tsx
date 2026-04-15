import { GruposPage } from '@/features/grupos/ui/grupos-page';
import { getGroupViewAction } from '@/features/grupos/actions/group-view-action';
import { SEED_GROUP_IDS } from '@/dev-data/seed';

export default async function GruposRoute() {
  const result = await getGroupViewAction(SEED_GROUP_IDS.alpha);
  return <GruposPage items={result.items} />;
}
