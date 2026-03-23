import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';
import { ParticipantEditForm } from '@/components/participants/ParticipantEditForm';
import { getParticipantManagementScope, listGrowthGroups } from '@/lib/api/participants';

interface ParticipantEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function ParticipantEditPage({ params }: ParticipantEditPageProps) {
  const resolvedParams = await params;
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = await createSupabaseServerClient();
  const scope = await getParticipantManagementScope(supabase, user.id);
  const groups = await listGrowthGroups(
    supabase,
    scope.isAdmin ? undefined : { gcIds: scope.managedGcIds },
  );
  const allowedGcIds = new Set(groups.map((group) => group.id));

  const participantResult = await supabase
    .from('growth_group_participants')
    .select(
      `id, gc_id, role, status,
       people:people!growth_group_participants_person_id_fkey ( id, name, email, phone, birth_date )`
    )
    .eq('id', resolvedParams.id)
    .is('deleted_at', null)
    .single();

  if (participantResult.error || !participantResult.data) {
    notFound();
  }

  const participantRow = participantResult.data;

  if (!allowedGcIds.has(participantRow.gc_id)) {
    notFound();
  }

  const participant = {
    participantId: participantRow.id,
    gcId: participantRow.gc_id,
    personId: participantRow.people?.id ?? '',
    role: participantRow.role,
    status: participantRow.status,
    name: participantRow.people?.name ?? 'Sem nome',
    email: participantRow.people?.email ?? null,
    phone: participantRow.people?.phone ?? null,
    birthDate: participantRow.people?.birth_date ?? null,
  };

  return (
    <div>
      <div className="mx-auto w-full max-w-3xl px-4 py-4">
        <Link href="/participants" className="text-sm text-primary hover:underline">
          ← Voltar para participantes
        </Link>
      </div>
      <ParticipantEditForm participant={participant} groups={groups} />
    </div>
  );
}
