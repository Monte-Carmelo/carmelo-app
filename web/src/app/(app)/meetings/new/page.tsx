import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';
import { getLessonTemplates } from '@/lib/api/lessons';
import {
  listGrowthGroupAttendanceOptions,
  type AttendanceMemberOption,
  type AttendanceVisitorOption,
} from '@/lib/api/growth-group-attendance';
import { MeetingForm } from '@/components/meetings/meeting-form';
import { Loading } from '@/components/ui/spinner';

type SearchParams = {
  gcId?: string;
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

// Função auxiliar para calcular a próxima ocorrência de um dia da semana
function getNextWeekday(weekday: number): string {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Domingo, 6 = Sábado

  let daysUntilNext = weekday - currentDay;

  // Se o dia já passou nesta semana, ir para a próxima semana
  if (daysUntilNext <= 0) {
    daysUntilNext += 7;
  }

  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysUntilNext);

  return nextDate.toISOString().split('T')[0];
}

async function MeetingFormLoader({ searchParams }: { searchParams: SearchParams }) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = await createSupabaseServerClient();

  const [groupsResult, lessonTemplates] = await Promise.all([
    supabase
      .from('growth_groups')
      .select('id, name')
      .order('name', { ascending: true }),
    getLessonTemplates(supabase),
  ]);

  // Se gcId foi passado, buscar informações do GC
  let selectedGc = null;
  let defaultDate = new Date().toISOString().split('T')[0];
  let defaultTime = '19:30';
  let initialParticipants: AttendanceMemberOption[] = [];
  let initialVisitors: AttendanceVisitorOption[] = [];

  if (searchParams.gcId) {
    const { data: gc } = await supabase
      .from('growth_groups')
      .select('id, name, weekday, time')
      .eq('id', searchParams.gcId)
      .single();

    if (gc) {
      selectedGc = gc;

      // Calcular próxima data baseado no dia da semana
      if (gc.weekday !== null) {
        defaultDate = getNextWeekday(gc.weekday);
      }

      // Usar horário padrão do GC se disponível
      if (gc.time) {
        defaultTime = gc.time.substring(0, 5); // Formato HH:MM
      }

      const attendanceOptions = await listGrowthGroupAttendanceOptions(supabase, gc.id);
      initialParticipants = attendanceOptions.members;
      initialVisitors = attendanceOptions.visitors;
    }
  }

  return (
    <MeetingForm
      userId={user.id}
      groups={groupsResult.data ?? []}
      lessonTemplates={lessonTemplates}
      defaultGcId={selectedGc?.id}
      defaultGcName={selectedGc?.name}
      defaultDate={defaultDate}
      defaultTime={defaultTime}
      initialParticipants={initialParticipants}
      initialVisitors={initialVisitors}
    />
  );
}

export default async function NewMeetingPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;

  return (
    <Suspense fallback={<Loading />}>
      <MeetingFormLoader searchParams={resolvedParams} />
    </Suspense>
  );
}
