import { TareaDetailPage } from '@/features/tarea/ui/tarea-detail-page';

interface TareaDetailRouteProps {
  params: Promise<{ id: string }>;
}

export default async function TareaDetailRoute({ params }: TareaDetailRouteProps) {
  const { id } = await params;
  return <TareaDetailPage id={id} />;
}
