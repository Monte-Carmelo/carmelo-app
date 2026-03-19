import { notFound } from 'next/navigation';
import { AdminEventForm } from '@/components/admin/AdminEventForm';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getEventById } from '@/lib/events/queries';

interface EditEventPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const event = await getEventById(supabase, id);

  if (!event) {
    notFound();
  }

  return (
    <div className="p-6">
      <AdminEventForm event={event} mode="edit" />
    </div>
  );
}
