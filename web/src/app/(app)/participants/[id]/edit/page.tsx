import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { ParticipantEditForm } from '@/components/participants/ParticipantEditForm';

interface ParticipantEditPageProps {
  params: { id: string };
}

export default async function ParticipantEditPage({ params }: ParticipantEditPageProps) {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const participantResult = await supabase
    .from('growth_group_participants')
    .select(
      `id, gc_id, role, status,
       people:people!growth_group_participants_person_id_fkey ( id, name, email, phone )`
    )
    .eq('id', params.id)
    .single();

  if (participantResult.error || !participantResult.data) {
    notFound();
  }

  const participantRow = participantResult.data;

  const groupsResult = await supabase
    .from('growth_groups')
    .select('id, name')
    .order('name', { ascending: true });

  const participant = {
    participantId: participantRow.id,
    gcId: participantRow.gc_id,
    personId: participantRow.people?.id ?? '',
    role: participantRow.role,
    status: participantRow.status,
    name: participantRow.people?.name ?? 'Sem nome',
    email: participantRow.people?.email ?? null,
    phone: participantRow.people?.phone ?? null,
  };

  return (
    <div>
      <div className="mx-auto w-full max-w-3xl px-4 py-4">
        <Link href="/participants" className="text-sm text-primary hover:underline">
          ← Voltar para participantes
        </Link>
      </div>
      <ParticipantEditForm participant={participant} groups={groupsResult.data ?? []} />
    </div>
  );
}
