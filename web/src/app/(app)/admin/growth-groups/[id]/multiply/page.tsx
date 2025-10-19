import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { AdminBreadcrumbs } from '@/components/admin/AdminBreadcrumbs';
import { GCMultiplicationWizardClient } from './GCMultiplicationWizardClient';
import { Loading } from '@/components/ui/spinner';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function AdminGCMultiplyContent({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  // Fetch the GC with all participants
  const { data: gc, error: gcError } = await supabase
    .from('growth_groups')
    .select(`
      id,
      name,
      mode,
      address,
      growth_group_participants (
        person_id,
        role,
        status,
        people:person_id (
          id,
          name
        )
      )
    `)
    .eq('id', id)
    .eq('status', 'active')
    .single();

  if (gcError || !gc) {
    notFound();
  }

  // Format members for the wizard
  const members = (gc.growth_group_participants || [])
    .filter((p) => p.people && p.status === 'active')
    .map((p) => ({
      id: p.person_id,
      name: p.people!.name,
      role: p.role as 'leader' | 'co_leader' | 'supervisor' | 'member',
    }));

  const originalGC = {
    id: gc.id,
    name: gc.name,
    mode: gc.mode as 'in_person' | 'online' | 'hybrid',
    address: gc.address || undefined,
    members,
  };

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs />

      <div>
        <h1 className="text-3xl font-bold text-slate-900">Multiplicar Grupo de Crescimento</h1>
        <p className="text-slate-600 mt-1">
          Divida o GC <strong>{gc.name}</strong> em novos grupos
        </p>
      </div>

      <GCMultiplicationWizardClient originalGC={originalGC} />
    </div>
  );
}

export default function AdminGCMultiplyPage({ params }: PageProps) {
  return (
    <Suspense fallback={<Loading message="Carregando GC..." />}>
      <AdminGCMultiplyContent params={params} />
    </Suspense>
  );
}
