import { getEventAction } from '@/app/(app)/admin/events/actions';
import { EventDetail } from '@/components/events/EventDetail';
import { notFound } from 'next/navigation';

interface EventDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EventDetailsPage({ params }: EventDetailsPageProps) {
  const { id } = await params;
  const result = await getEventAction({ id });

  if (!result.success) {
    notFound();
  }

  return (
    <div className="p-6">
      <EventDetail event={result.data} />
    </div>
  );
}