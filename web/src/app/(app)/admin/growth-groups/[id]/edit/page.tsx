import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { AdminGrowthGroupEditClient } from '../AdminGrowthGroupEditClient';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Loading } from '@/components/ui/spinner';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function AdminGrowthGroupEditContent({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  // Fetch the GC with participants
  const { data: gc, error: gcError } = await supabase
    .from('growth_groups')
    .select(`
      id,
      name,
      mode,
      status,
      address,
      weekday,
      time,
      growth_group_participants (
        id,
        role,
        status,
        person_id
      )
    `)
    .eq('id', id)
    .single();

  if (gcError || !gc) {
    notFound();
  }

  // Fetch all people for selects. GC leadership is stored directly by person_id.
  const { data: peopleData, error: peopleError } = await supabase
    .from('people')
    .select('id, name')
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if (peopleError) {
    throw peopleError;
  }

  const people = peopleData || [];

  // Extract leader and supervisor person_ids from participants
  const participants = gc.growth_group_participants || [];
  const leaderIds = participants
    .filter((p) => p.role === 'leader')
    .map((p) => p.person_id);
  const supervisorIds = participants
    .filter((p) => p.role === 'supervisor')
    .map((p) => p.person_id);

  const gcData = {
    id: gc.id,
    name: gc.name,
    mode: gc.mode as 'in_person' | 'online' | 'hybrid',
    address: gc.address || '',
    weekday: gc.weekday,
    time: gc.time || '',
    leaderIds,
    supervisorIds,
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/growth-groups/${id}`}
          className="mb-4 inline-flex items-center text-sm font-medium text-primary transition-colors hover:text-brand-hover"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para o GC
        </Link>
        <ScreenHeader
          eyebrow="Gestão"
          title={`Editar ${gc.name}`}
          subtitle="Atualize as informações do grupo de crescimento"
        />
      </div>

      <AdminGrowthGroupEditClient gc={gcData} people={people} />
    </div>
  );
}

export default function AdminGrowthGroupEditPage({ params }: PageProps) {
  return (
    <Suspense fallback={<Loading message="Carregando GC..." />}>
      <AdminGrowthGroupEditContent params={params} />
    </Suspense>
  );
}
