import { notFound } from 'next/navigation';
import { TareaDetailPage } from '@/features/tarea/ui/tarea-detail-page';
import { getItemByIdAction } from '@/features/shared/actions/item-actions';
import type { ItemView } from '@/interfaces/views/item-view';

interface TareaDetailRouteProps {
  params: Promise<{ id: string }>;
}

export default async function TareaDetailRoute({ params }: TareaDetailRouteProps) {
  const { id } = await params;
  const result = await getItemByIdAction(id);
  if (!result.ok) notFound();
  return <TareaDetailPage id={id} item={result.value} />;
}
