'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { toast } from 'sonner';
import { BarChart, PieChart } from '@/components/admin/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Calendar, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface AttendanceMetrics {
  totalMeetings: number;
  totalAttendances: number;
  totalPossibleAttendances: number;
  overallAttendanceRate: number;
  mostAttendedGC: string;
  leastAttendedGC: string;
  topAttendee: string;
  lowAttendee: string;
}

interface GCAttendance {
  [key: string]: string | number;
  gcName: string;
  totalMeetings: number;
  totalAttendances: number;
  attendanceRate: number;
  membersCount: number;
}

interface MemberAttendance {
  memberName: string;
  gcName: string;
  attendedMeetings: number;
  totalMeetings: number;
  attendanceRate: number;
}

export default function AttendanceReportsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('90');
  const [metrics, setMetrics] = useState<AttendanceMetrics>({
    totalMeetings: 0,
    totalAttendances: 0,
    totalPossibleAttendances: 0,
    overallAttendanceRate: 0,
    mostAttendedGC: '',
    leastAttendedGC: '',
    topAttendee: '',
    lowAttendee: '',
  });
  const [gcAttendanceData, setGCAttendanceData] = useState<GCAttendance[]>([]);
  const [memberAttendanceData, setMemberAttendanceData] = useState<MemberAttendance[]>([]);

  const fetchAttendanceData = useCallback(async (selectedPeriod = period) => {
    setLoading(true);
    const supabase = getSupabaseBrowserClient();

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(selectedPeriod));

      const startDateIso = startDate.toISOString();

      // Fetch attendance data
      const [
        meetingsResult,
        attendancesResult,
        gcMembersResult,
        gcInfoResult
      ] = await Promise.all([
        // Total meetings in period
        supabase
          .from('meetings')
          .select('id, gc_id, datetime')
          .gte('datetime', startDateIso)
          .is('deleted_at', null),

        // Attendance records
        supabase
          .from('meeting_member_attendance')
          .select(`
            id,
            participant_id,
            meetings!inner(id, gc_id, datetime, deleted_at)
          `)
          .gte('meetings.datetime', startDateIso)
          .is('meetings.deleted_at', null),

        // GC members for calculating possible attendances
        supabase
          .from('growth_group_participants')
          .select(`
            id,
            gc_id,
            people ( name )
          `)
          .eq('status', 'active')
          .is('deleted_at', null),

        // GC info for names
        supabase
          .from('growth_groups')
          .select('id, name')
          .eq('status', 'active')
          .is('deleted_at', null),
      ]);

      if (meetingsResult.error || attendancesResult.error || gcMembersResult.error || gcInfoResult.error) {
        throw meetingsResult.error || attendancesResult.error || gcMembersResult.error || gcInfoResult.error;
      }

      const meetings = meetingsResult.data || [];
      const attendances = attendancesResult.data || [];
      const members = gcMembersResult.data || [];
      const gcs = gcInfoResult.data || [];

      const gcNameById = new Map(gcs.map((gc) => [gc.id, gc.name]));

      const meetingCountByGc = new Map<string, number>();
      meetings.forEach((meeting) => {
        if (!meeting.gc_id) return;
        meetingCountByGc.set(meeting.gc_id, (meetingCountByGc.get(meeting.gc_id) || 0) + 1);
      });

      const attendanceCountByGc = new Map<string, number>();
      const attendanceCountByParticipant = new Map<string, number>();

      attendances.forEach((attendance) => {
        const meeting = attendance.meetings;
        if (!meeting?.gc_id) return;
        attendanceCountByGc.set(meeting.gc_id, (attendanceCountByGc.get(meeting.gc_id) || 0) + 1);
        if (attendance.participant_id) {
          attendanceCountByParticipant.set(
            attendance.participant_id,
            (attendanceCountByParticipant.get(attendance.participant_id) || 0) + 1,
          );
        }
      });

      const membersByGc = new Map<string, number>();
      const memberInfoById = new Map<string, { name: string; gcId: string; gcName: string }>();

      members.forEach((member) => {
        if (!member.gc_id || !member.id) return;
        membersByGc.set(member.gc_id, (membersByGc.get(member.gc_id) || 0) + 1);
        memberInfoById.set(member.id, {
          name: member.people?.name || 'Membro',
          gcId: member.gc_id,
          gcName: gcNameById.get(member.gc_id) || 'GC desconhecido',
        });
      });

      const gcIds = new Set<string>([
        ...gcNameById.keys(),
        ...meetingCountByGc.keys(),
        ...membersByGc.keys(),
      ]);

      const gcAttendance = Array.from(gcIds).map((gcId) => {
        const totalMeetings = meetingCountByGc.get(gcId) || 0;
        const totalAttendances = attendanceCountByGc.get(gcId) || 0;
        const membersCount = membersByGc.get(gcId) || 0;
        const possible = totalMeetings * membersCount;
        return {
          gcName: gcNameById.get(gcId) || 'GC desconhecido',
          totalMeetings,
          totalAttendances,
          attendanceRate: possible > 0 ? (totalAttendances / possible) * 100 : 0,
          membersCount,
        };
      });

      const memberAttendance = Array.from(memberInfoById.entries()).map(([memberId, info]) => {
        const attendedMeetings = attendanceCountByParticipant.get(memberId) || 0;
        const totalMeetings = meetingCountByGc.get(info.gcId) || 0;
        return {
          memberName: info.name,
          gcName: info.gcName,
          attendedMeetings,
          totalMeetings,
          attendanceRate: totalMeetings > 0 ? (attendedMeetings / totalMeetings) * 100 : 0,
        };
      });

      const totalMeetings = meetings.length;
      const totalAttendances = attendances.length;
      const totalPossibleAttendances = Array.from(gcIds).reduce((acc, gcId) => {
        const possible = (membersByGc.get(gcId) || 0) * (meetingCountByGc.get(gcId) || 0);
        return acc + possible;
      }, 0);

      const filteredGcAttendance = gcAttendance.filter((gc) => gc.totalMeetings > 0 && gc.membersCount > 0);
      const mostAttendedGC = filteredGcAttendance
        .slice()
        .sort((a, b) => b.attendanceRate - a.attendanceRate)[0]?.gcName || '';
      const leastAttendedGC = filteredGcAttendance
        .slice()
        .sort((a, b) => a.attendanceRate - b.attendanceRate)[0]?.gcName || '';

      const membersWithMeetings = memberAttendance.filter((member) => member.totalMeetings > 0);
      const topAttendee = membersWithMeetings
        .slice()
        .sort((a, b) => b.attendanceRate - a.attendanceRate)[0]?.memberName || '';
      const lowAttendee = membersWithMeetings
        .slice()
        .sort((a, b) => a.attendanceRate - b.attendanceRate)[0]?.memberName || '';

      setMetrics({
        totalMeetings,
        totalAttendances,
        totalPossibleAttendances,
        overallAttendanceRate: totalPossibleAttendances > 0
          ? Math.round((totalAttendances / totalPossibleAttendances) * 1000) / 10
          : 0,
        mostAttendedGC,
        leastAttendedGC,
        topAttendee,
        lowAttendee,
      });

      setGCAttendanceData(gcAttendance);
      setMemberAttendanceData(memberAttendance);

    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast.error('Erro ao carregar dados de frequência');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  const handlePeriodChange = async (newPeriod: string) => {
    setPeriod(newPeriod);
    await fetchAttendanceData(newPeriod);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  const attendanceRateDistribution = [
    { name: 'Excelente (>90%)', value: gcAttendanceData.filter(gc => gc.attendanceRate > 90).length },
    { name: 'Bom (75-90%)', value: gcAttendanceData.filter(gc => gc.attendanceRate >= 75 && gc.attendanceRate <= 90).length },
    { name: 'Regular (50-75%)', value: gcAttendanceData.filter(gc => gc.attendanceRate >= 50 && gc.attendanceRate < 75).length },
    { name: 'Baixo (<50%)', value: gcAttendanceData.filter(gc => gc.attendanceRate < 50).length },
  ];

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/reports"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Relatórios
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Relatório de Frequência</h1>
            <p className="text-gray-600 mt-1">
              Análise detalhada da frequência nas reuniões
            </p>
          </div>

          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="180">Últimos 6 meses</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {metrics.totalMeetings}
                </h3>
                <p className="text-sm text-gray-600">Reuniões Realizadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {metrics.overallAttendanceRate}%
                </h3>
                <p className="text-sm text-gray-600">Taxa Geral</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {metrics.totalAttendances}
                </h3>
                <p className="text-sm text-gray-600">Presenças Totais</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {metrics.mostAttendedGC}
                </h3>
                <p className="text-sm text-gray-600">GC com Maior Frequência</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* GC Attendance Rates */}
        <Card>
          <CardHeader>
            <CardTitle>Taxa de Frequência por GC</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={gcAttendanceData}
              bars={[
                {
                  dataKey: 'attendanceRate',
                  fill: '#3b82f6',
                  name: 'Taxa de Frequência (%)',
                },
              ]}
              xAxisDataKey="gcName"
              height={300}
            />
          </CardContent>
        </Card>

        {/* Attendance Rate Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição das Taxas</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart
              data={attendanceRateDistribution}
              height={300}
              colors={['#10b981', '#3b82f6', '#f59e0b', '#ef4444']}
            />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GC Attendance Details */}
        <Card>
          <CardHeader>
            <CardTitle>Frequência por GC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {gcAttendanceData.map((gc, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 truncate">{gc.gcName}</h4>
                    <p className="text-sm text-gray-600">
                      {gc.totalAttendances}/{gc.totalMeetings * gc.membersCount} presenças
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${
                      gc.attendanceRate >= 90 ? 'text-green-600' :
                      gc.attendanceRate >= 75 ? 'text-blue-600' :
                      gc.attendanceRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {gc.attendanceRate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-gray-500">{gc.membersCount} membros</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top and Low Attendees */}
        <Card>
          <CardHeader>
            <CardTitle>Destaques de Frequência</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Top Attendees */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
                  Maior Frequência
                </h4>
                <div className="space-y-2">
                  {memberAttendanceData
                    .filter(m => m.attendanceRate >= 90)
                    .slice(0, 3)
                    .map((member, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                        <div>
                          <p className="font-medium text-green-900">{member.memberName}</p>
                          <p className="text-xs text-green-700">{member.gcName}</p>
                        </div>
                        <span className="text-green-700 font-semibold">
                          {member.attendanceRate.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Low Attendees */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <TrendingDown className="h-4 w-4 text-red-600 mr-2" />
                  Menor Frequência
                </h4>
                <div className="space-y-2">
                  {memberAttendanceData
                    .filter(m => m.attendanceRate < 75)
                    .slice(0, 3)
                    .map((member, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                        <div>
                          <p className="font-medium text-red-900">{member.memberName}</p>
                          <p className="text-xs text-red-700">{member.gcName}</p>
                        </div>
                        <span className="text-red-700 font-semibold">
                          {member.attendanceRate.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
