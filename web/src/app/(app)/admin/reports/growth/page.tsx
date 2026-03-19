import Link from 'next/link';
import { ArrowLeft, TrendingUp, Users, Building, Calendar } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { LineChart } from '@/components/admin/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminReportPeriodSelect } from '@/components/admin/AdminReportPeriodSelect';
import {
  GROWTH_REPORT_PERIOD_OPTIONS,
  getGrowthReportData,
  resolveReportPeriod,
} from '@/lib/admin/reports';

interface GrowthReportsPageProps {
  searchParams?: Promise<{ period?: string }>;
}

export default async function GrowthReportsPage({ searchParams }: GrowthReportsPageProps) {
  const resolvedSearchParams = await searchParams;
  const period = resolveReportPeriod(
    resolvedSearchParams?.period,
    GROWTH_REPORT_PERIOD_OPTIONS,
    '180',
  );
  const supabase = await createSupabaseServerClient();
  const { metrics, monthlyData } = await getGrowthReportData(supabase, period);

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
            <h1 className="text-3xl font-bold text-gray-900">Relatório de Crescimento</h1>
            <p className="text-gray-600 mt-1">
              Análise detalhada do crescimento de membros e GCs
            </p>
          </div>

          <AdminReportPeriodSelect
            period={period}
            options={GROWTH_REPORT_PERIOD_OPTIONS.map((option) => ({ ...option }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {metrics.totalMembers}
                </h3>
                <p className="text-sm text-gray-600">Total de Membros</p>
                <p className="text-xs text-green-600 mt-1">
                  +{metrics.newMembersThisMonth} este mês
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Building className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {metrics.totalGCs}
                </h3>
                <p className="text-sm text-gray-600">Total de GCs</p>
                <p className="text-xs text-green-600 mt-1">
                  +{metrics.newGCsThisMonth} este mês
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {metrics.growthRate}%
                </h3>
                <p className="text-sm text-gray-600">Taxa de Crescimento</p>
                <p className="text-xs text-gray-500 mt-1">
                  No período
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {metrics.totalMultiplications}
                </h3>
                <p className="text-sm text-gray-600">Multiplicações</p>
                <p className="text-xs text-green-600 mt-1">
                  +{metrics.multiplicationsThisMonth} este mês
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Crescimento de Membros</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={monthlyData}
              lines={[
                {
                  dataKey: 'totalMembers',
                  stroke: '#3b82f6',
                  name: 'Total de Membros',
                },
                {
                  dataKey: 'newMembers',
                  stroke: '#10b981',
                  name: 'Novos Membros',
                },
              ]}
              xAxisDataKey="month"
              height={250}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Crescimento de GCs</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={monthlyData}
              lines={[
                {
                  dataKey: 'totalGCs',
                  stroke: '#8b5cf6',
                  name: 'Total de GCs',
                },
                {
                  dataKey: 'newGCs',
                  stroke: '#f59e0b',
                  name: 'Novos GCs',
                },
              ]}
              xAxisDataKey="month"
              height={250}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Multiplicações no Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyData.filter((month) => month.multiplications > 0).length > 0 ? (
              monthlyData
                .filter((month) => month.multiplications > 0)
                .map((month, index) => (
                  <div key={`${month.month}-${index}`} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center">
                      <TrendingUp className="h-5 w-5 text-green-600 mr-3" />
                      <span className="font-medium text-green-900">{month.month}</span>
                    </div>
                    <span className="text-green-700 font-semibold">
                      {month.multiplications} multiplicação(ões)
                    </span>
                  </div>
                ))
            ) : (
              <p className="text-gray-500 text-center py-8">
                Nenhuma multiplicação registrada no período selecionado
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
