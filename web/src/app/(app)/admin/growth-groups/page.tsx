import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { AdminBreadcrumbs } from '@/components/admin/AdminBreadcrumbs';
import { AdminGrowthGroupList, AdminGrowthGroupSummary } from '@/components/admin/AdminGrowthGroupList';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/spinner';

async function AdminGrowthGroupsContent() {
  const supabase = await createSupabaseServerClient();

  // Fetch all GCs with participants and meetings
  const { data: gcs, error } = await supabase
    .from('growth_groups')
    .select(`
      id,
      name,
      mode,
      status,
      weekday,
      time,
      address,
      created_at,
      growth_group_participants!inner (
        id,
        role,
        status,
        people (
          id,
          name,
          email,
          phone
        )
      ),
      meetings (
        id,
        datetime
      )
    `)
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  // Process data to group leaders, supervisors, and calculate metrics
  const gcSummaries: AdminGrowthGroupSummary[] = (gcs || []).map((gc) => {
    const participants = gc.growth_group_participants || [];

    // Extract leaders and supervisors
    const leaders = participants
      .filter((p) => p.role === 'leader' && p.people)
      .map((p) => p.people!.name);

    const supervisors = participants
      .filter((p) => p.role === 'supervisor' && p.people)
      .map((p) => p.people!.name);

    // Count active members
    const memberCount = participants.filter(
      (p) => p.role === 'member' && p.status === 'active'
    ).length;

    // Find last meeting date
    const meetings = gc.meetings || [];
    const lastMeetingDate = meetings.length > 0
      ? meetings.reduce((latest, meeting) => {
          return new Date(meeting.datetime) > new Date(latest)
            ? meeting.datetime
            : latest;
        }, meetings[0].datetime)
      : null;

    return {
      id: gc.id,
      name: gc.name,
      mode: gc.mode as 'in_person' | 'online' | 'hybrid',
      status: gc.status as 'active' | 'inactive' | 'multiplied',
      leaders,
      supervisors,
      memberCount,
      lastMeetingDate,
    };
  });

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Grupos de Crescimento</h1>
          <p className="text-slate-600 mt-1">Gerencie os GCs da igreja</p>
        </div>
        <Link href="/admin/growth-groups/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo GC
          </Button>
        </Link>
      </div>

      <AdminGrowthGroupList gcs={gcSummaries} />
    </div>
  );
}

export default function AdminGrowthGroupsPage() {
  return (
    <Suspense fallback={<Loading message="Carregando grupos..." />}>
      <AdminGrowthGroupsContent />
    </Suspense>
  );
}
