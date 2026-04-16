import { notFound } from 'next/navigation';
import { TareaDetailPage } from '@/features/tarea/ui/tarea-detail-page';
import { getItemByIdAction } from '@/features/shared/actions/item-actions';
import { getHistoryEntries } from '@/lib/item-command-factory';
import { auditEntryToHistoryDto } from '@/interfaces/ui/audit-entry-mapper';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import type { HistoryEntryDto, GroupMemberDto } from '@/interfaces/ui/history-entry-dto';
import type { ItemView } from '@/interfaces/views/item-view';
import { SPACE_TYPE } from '@/domain/shared';

const IS_DEV = process.env.NODE_ENV !== 'production';

interface TareaDetailRouteProps {
  params: Promise<{ id: string }>;
}

export default async function TareaDetailRoute({ params }: TareaDetailRouteProps) {
  const { id } = await params;
  const result = await getItemByIdAction(id);
  if (!result.ok) notFound();

  const item = result.value;

  // Fetch real audit history
  const auditEntries = await getHistoryEntries(id);
  const history: HistoryEntryDto[] = auditEntries.flatMap(auditEntryToHistoryDto);

  // Fetch group members if this is a group item (needed for the assignee picker)
  let groupMembers: GroupMemberDto[] = [];
  if (!IS_DEV && item.spaceType === SPACE_TYPE.GROUP && item.groupId) {
    const memberships = await prisma.groupMembership.findMany({
      where: { groupId: item.groupId as string, isActive: true },
      include: { user: { select: { id: true, name: true, image: true } } },
    });
    groupMembers = memberships.map((m) => {
      const name = m.user.name ?? m.user.id;
      const initials = name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      return { id: m.user.id, name, initials, image: m.user.image };
    });
  }

  return <TareaDetailPage id={id} item={item} history={history} groupMembers={groupMembers} />;
}
