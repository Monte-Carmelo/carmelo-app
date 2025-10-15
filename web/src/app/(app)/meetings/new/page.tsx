import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { MeetingForm } from '@/components/meetings/MeetingForm';

async function MeetingFormLoader() {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const [{ data: groups }, { data: lessons }] = await Promise.all([
    supabase
      .from('growth_groups')
      .select('id, name')
      .order('name', { ascending: true }),
    supabase
      .from('lessons')
      .select('id, title')
      .order('title', { ascending: true }),
  ]);

  return (
    <MeetingForm
      userId={session.user.id}
      groups={groups ?? []}
      lessonTemplates={lessons ?? []}
    />
  );
}

export default function NewMeetingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Carregando...</div>}>
      <MeetingFormLoader />
    </Suspense>
  );
}
