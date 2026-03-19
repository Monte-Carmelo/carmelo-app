import Link from 'next/link';
import { ArrowLeft, Users, TrendingUp, Clock, CheckCircle, UserCheck } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { LineChart, PieChart, BarChart } from '@/components/admin/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminReportPeriodSelect } from '@/components/admin/AdminReportPeriodSelect';
import {
  CONVERSION_REPORT_PERIOD_OPTIONS,
  getConversionsReportData,
  resolveReportPeriod,
} from '@/lib/admin/reports';

interface ConversionsReportsPageProps {
  searchParams?: Promise<{ period?: string }>;
}

export default async function ConversionsReportsPage({
  searchParams,
}: ConversionsReportsPageProps) {
  const resolvedSearchParams = await searchParams;
  const period = resolveReportPeriod(
    resolvedSearchParams?.period,
    CONVERSION_REPORT_PERIOD_OPTIONS,
    '180',
  );
  const supabase = await createSupabaseServerClient();
  const { metrics, monthlyData, gcConversionData, recentConversions } = await getConversionsReportData(
    supabase,
    period,
  );

  const conversionStages = [
    { name: 'Visitantes', value: metrics.totalVisitors - metrics.convertedVisitors, color: '#f59e0b' },
    { name: 'Convertidos', value: metrics.convertedVisitors, color: '#10b981' },
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
            <h1 className="text-3xl font-bold text-gray-900">Relatório de Conversões</h1>
            <p className="text-gray-600 mt-1">
              Análise detalhada da conversão de visitantes em membros
            </p>
          </div>

          <AdminReportPeriodSelect
            period={period}
            options={CONVERSION_REPORT_PERIOD_OPTIONS.map((option) => ({ ...option }))}
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
                  {metrics.totalVisitors}
                </h3>
                <p className="text-sm text-gray-600">Visitantes no Período</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {metrics.convertedVisitors}
                </h3>
                <p className="text-sm text-gray-600">Convertidos no Período</p>
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
                  {metrics.conversionRate}%
                </h3>
                <p className="text-sm text-gray-600">Taxa de Conversão</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {metrics.avgConversionTime} dias
                </h3>
                <p className="text-sm text-gray-600">Tempo Médio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Tendência de Conversões Mensais</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={monthlyData}
              lines={[
                {
                  dataKey: 'visitors',
                  stroke: '#3b82f6',
                  name: 'Visitantes',
                },
                {
                  dataKey: 'conversions',
                  stroke: '#10b981',
                  name: 'Conversões',
                },
                {
                  dataKey: 'conversionRate',
                  stroke: '#f59e0b',
                  name: 'Taxa (%)',
                },
              ]}
              xAxisDataKey="month"
              height={250}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Funil de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart
              data={conversionStages}
              height={250}
              colors={['#f59e0b', '#10b981']}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Taxa de Conversão por GC</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            data={gcConversionData}
            bars={[
              {
                dataKey: 'conversionRate',
                fill: '#10b981',
                name: 'Taxa de Conversão (%)',
              },
            ]}
            xAxisDataKey="gcName"
            height={250}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              Conversões Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentConversions.map((conversion, index) => (
                <div key={`${conversion.visitorName}-${index}`} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <h4 className="font-medium text-green-900">{conversion.visitorName}</h4>
                    <p className="text-sm text-green-700">{conversion.gcName}</p>
                    <p className="text-xs text-green-600">
                      Convertido em {conversion.conversionDate} • {conversion.timeAsVisitor} dias como visitante
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>GCs com Melhor Desempenho</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {gcConversionData
                .slice()
                .sort((a, b) => b.conversionRate - a.conversionRate)
                .slice(0, 5)
                .map((gc, index) => (
                  <div key={`${gc.gcName}-${index}`} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 truncate">{gc.gcName}</h4>
                      <p className="text-sm text-gray-600">
                        {gc.conversions} de {gc.totalVisitors} visitantes
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${
                        gc.conversionRate >= 30 ? 'text-green-600' :
                        gc.conversionRate >= 20 ? 'text-blue-600' :
                        gc.conversionRate >= 10 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {gc.conversionRate.toFixed(1)}%
                      </div>
                      <p className="text-xs text-gray-500">taxa</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Estatísticas Gerais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900">
                {metrics.totalConversionsAllTime}
              </h3>
              <p className="text-gray-600 mt-1">Total de Conversões (Todo o Período)</p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900">
                {metrics.conversionsThisMonth}
              </h3>
              <p className="text-gray-600 mt-1">Conversões Este Mês</p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900">
                {metrics.topConvertingGC}
              </h3>
              <p className="text-gray-600 mt-1">GC com Maior Taxa de Conversão</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
