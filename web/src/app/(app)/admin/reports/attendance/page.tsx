import Link from 'next/link';
import { ArrowLeft, Users, Calendar, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { BarChart, PieChart } from '@/components/admin/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminReportPeriodSelect } from '@/components/admin/AdminReportPeriodSelect';
import {
  ATTENDANCE_REPORT_PERIOD_OPTIONS,
  getAttendanceReportData,
  resolveReportPeriod,
} from '@/lib/admin/reports';

interface AttendanceReportsPageProps {
  searchParams?: Promise<{ period?: string }>;
}

export default async function AttendanceReportsPage({ searchParams }: AttendanceReportsPageProps) {
  const resolvedSearchParams = await searchParams;
  const period = resolveReportPeriod(
    resolvedSearchParams?.period,
    ATTENDANCE_REPORT_PERIOD_OPTIONS,
    '90',
  );
  const supabase = await createSupabaseServerClient();
  const { metrics, gcAttendanceData, memberAttendanceData } = await getAttendanceReportData(
    supabase,
    period,
  );

  const attendanceRateDistribution = [
    { name: 'Excelente (>90%)', value: gcAttendanceData.filter((gc) => gc.attendanceRate > 90).length },
    {
      name: 'Bom (75-90%)',
      value: gcAttendanceData.filter((gc) => gc.attendanceRate >= 75 && gc.attendanceRate <= 90).length,
    },
    {
      name: 'Regular (50-75%)',
      value: gcAttendanceData.filter((gc) => gc.attendanceRate >= 50 && gc.attendanceRate < 75).length,
    },
    { name: 'Baixo (<50%)', value: gcAttendanceData.filter((gc) => gc.attendanceRate < 50).length },
  ];

  return (
    <div className="container mx-auto py-8">
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

          <AdminReportPeriodSelect
            period={period}
            options={ATTENDANCE_REPORT_PERIOD_OPTIONS.map((option) => ({ ...option }))}
          />
        </div>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Frequência por GC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {gcAttendanceData.map((gc, index) => (
                <div key={`${gc.gcName}-${index}`} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
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

        <Card>
          <CardHeader>
            <CardTitle>Destaques de Frequência</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
                  Maior Frequência
                </h4>
                <div className="space-y-2">
                  {memberAttendanceData
                    .filter((member) => member.attendanceRate >= 90)
                    .slice(0, 3)
                    .map((member, index) => (
                      <div key={`${member.memberName}-${index}`} className="flex items-center justify-between p-2 bg-green-50 rounded">
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

              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <TrendingDown className="h-4 w-4 text-red-600 mr-2" />
                  Menor Frequência
                </h4>
                <div className="space-y-2">
                  {memberAttendanceData
                    .filter((member) => member.attendanceRate < 75)
                    .slice(0, 3)
                    .map((member, index) => (
                      <div key={`${member.memberName}-${index}`} className="flex items-center justify-between p-2 bg-red-50 rounded">
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
