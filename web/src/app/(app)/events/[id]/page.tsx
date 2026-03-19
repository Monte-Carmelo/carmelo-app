import { notFound } from 'next/navigation';
import { EventDetail } from '@/components/events/EventDetail';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getEventById } from '@/lib/events/queries';

interface EventDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EventDetailsPage({ params }: EventDetailsPageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const event = await getEventById(supabase, id);

  if (!event) {
    notFound();
  }

  return (
    <div className="p-6">
      <EventDetail event={event} />
    </div>
  );
}
