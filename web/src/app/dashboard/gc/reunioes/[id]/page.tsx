import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { AttendanceList } from '@/components/gc/attendance-list';
import { getGCMembers, getGCVisitors } from '@/lib/supabase/queries/gc-dashboard';
import {
  markMemberAttendance,
  unmarkMemberAttendance,
  markVisitorAttendance,
  unmarkVisitorAttendance,
} from '@/lib/supabase/mutations/attendance';
import { redirect } from 'next/navigation';

export default async function MeetingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  // Verificar autenticação
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Buscar informações da reunião
  const { data: meeting } = await supabase
    .from('meetings')
    .select('*, growth_groups(id, name)')
    .eq('id', id)
    .single();

  if (!meeting) {
    redirect('/dashboard/gc');
  }

  const gcId = meeting.gc_id;

  // Buscar membros e visitantes do GC
  const [members, visitors] = await Promise.all([
    getGCMembers(supabase, gcId),
    getGCVisitors(supabase, gcId),
  ]);

  // Buscar presenças registradas
  const { data: memberAttendance } = await supabase
    .from('meeting_member_attendance')
    .select('participant_id')
    .eq('meeting_id', id);

  const { data: visitorAttendance } = await supabase
    .from('meeting_visitor_attendance')
    .select('visitor_id')
    .eq('meeting_id', id);

  const initialMemberAttendance = memberAttendance?.map((row) => row.participant_id) ?? [];
  const initialVisitorAttendance = visitorAttendance?.map((row) => row.visitor_id) ?? [];

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header da reunião */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">{meeting.lesson_title}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {meeting.growth_groups && typeof meeting.growth_groups === 'object' && 'name' in meeting.growth_groups ? meeting.growth_groups.name : 'GC sem nome'} •{' '}
            {new Date(meeting.datetime).toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          {meeting.comments && (
            <p className="mt-2 text-sm text-slate-600">{meeting.comments}</p>
          )}
        </div>

        {/* Lista de presença */}
        <AttendanceList
          members={members}
          visitors={visitors}
          initialMemberAttendance={initialMemberAttendance}
          initialVisitorAttendance={initialVisitorAttendance}
          onToggleMemberAttendance={async (participantId, isPresent) => {
            'use server';
            const supabaseAction = await createSupabaseServerClient();
            if (isPresent) {
              return await markMemberAttendance(supabaseAction, {
                meetingId: id,
                participantId,
              });
            } else {
              return await unmarkMemberAttendance(supabaseAction, {
                meetingId: id,
                participantId,
              });
            }
          }}
          onToggleVisitorAttendance={async (visitorId, isPresent) => {
            'use server';
            const supabaseAction = await createSupabaseServerClient();
            if (isPresent) {
              return await markVisitorAttendance(supabaseAction, {
                meetingId: id,
                visitorId,
              });
            } else {
              return await unmarkVisitorAttendance(supabaseAction, {
                meetingId: id,
                visitorId,
              });
            }
          }}
        />
      </div>
    </div>
  );
}
