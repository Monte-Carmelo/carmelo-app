import { getEventAction } from '@/app/(app)/admin/events/actions';
import { AdminEventForm } from '@/components/admin/AdminEventForm';
import { notFound } from 'next/navigation';

interface EditEventPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id } = await params;
  const result = await getEventAction({ id });

  if (!result.success) {
    notFound();
  }

  return (
    <div className="p-6">
      <AdminEventForm event={result.data} mode="edit" />
    </div>
  );
}