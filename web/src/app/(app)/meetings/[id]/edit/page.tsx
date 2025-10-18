import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { EditMeetingForm } from '@/components/meetings/EditMeetingForm';
import { getMeetingById } from '@/lib/supabase/queries/meetings';

export default async function EditMeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  // Verificar autenticação
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Buscar dados da reunião
  const { data: meeting, error: meetingError } = await getMeetingById(supabase, id);

  if (meetingError || !meeting) {
    redirect('/dashboard');
  }

  // Buscar lesson templates
  const { data: lessonTemplates } = await supabase
    .from('lessons')
    .select('id, title')
    .order('title', { ascending: true });

  return <EditMeetingForm meeting={meeting} lessonTemplates={lessonTemplates ?? []} />;
}
