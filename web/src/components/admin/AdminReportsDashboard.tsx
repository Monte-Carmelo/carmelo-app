'use client';

import { LineChart, PieChart, BarChart } from './charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminMetricsCard } from './AdminMetricsCard';
import { AdminReportPeriodSelect } from './AdminReportPeriodSelect';
import { Users, Building, TrendingUp } from 'lucide-react';

interface ReportsMetrics {
  totalGcs: number;
  activeGcs: number;
  totalMembers: number;
  activeMembers: number;
  totalVisitors: number;
  conversionRate: number;
}

interface GrowthData {
  month: string;
  members: number;
  gcs: number;
}

interface DistributionData {
  name: string;
  value: number;
}

interface TopGCData {
  name: string;
  members: number;
}

interface AdminReportsDashboardProps {
  metrics: ReportsMetrics;
  growthData: GrowthData[];
  distributionData: DistributionData[];
  topGCsData: TopGCData[];
  period: string;
}

export function AdminReportsDashboard({
  metrics,
  growthData,
  distributionData,
  topGCsData,
  period,
}: AdminReportsDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Header with Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios e Análises</h1>
          <p className="text-gray-600 mt-1">
            Visualize métricas e tendências dos Grupos de Crescimento
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="period-filter" className="text-sm font-medium text-gray-700">
            Período:
          </label>
          <AdminReportPeriodSelect
            period={period}
            options={[
              { value: '30', label: 'Últimos 30 dias' },
              { value: '90', label: 'Últimos 90 dias' },
              { value: '180', label: 'Últimos 6 meses' },
              { value: '365', label: 'Último ano' },
              { value: 'all', label: 'Todo o período' },
            ]}
          />
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminMetricsCard
          title="Total de GCs"
          value={metrics.totalGcs}
          icon={Building}
          description={`${metrics.activeGcs} ativos`}
        />
        <AdminMetricsCard
          title="Total de Membros"
          value={metrics.totalMembers}
          icon={Users}
          description={`${metrics.activeMembers} ativos`}
        />
        <AdminMetricsCard
          title="Total de Visitantes"
          value={metrics.totalVisitors}
          icon={Users}
          description="No período selecionado"
        />
        <AdminMetricsCard
          title="Taxa de Conversão"
          value={`${(metrics.conversionRate * 100).toFixed(1)}%`}
          icon={TrendingUp}
          description="Visitantes → Membros"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Crescimento ao Longo do Tempo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={growthData.map(item => ({
                month: item.month,
                members: item.members,
                gcs: item.gcs,
              }))}
              lines={[
                {
                  dataKey: 'members',
                  stroke: '#3b82f6',
                  name: 'Membros',
                },
                {
                  dataKey: 'gcs',
                  stroke: '#10b981',
                  name: 'GCs',
                },
              ]}
              xAxisDataKey="month"
              height={250}
            />
          </CardContent>
        </Card>

        {/* Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Distribuição por Modo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart
              data={distributionData.map(item => ({
                name: item.name,
                value: item.value,
              }))}
              height={250}
              colors={['#3b82f6', '#10b981', '#f59e0b']}
            />
          </CardContent>
        </Card>
      </div>

      {/* Top GCs Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top 10 GCs por Número de Membros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            data={topGCsData.map(item => ({
              name: item.name,
              members: item.members,
            }))}
            bars={[
              {
                dataKey: 'members',
                fill: '#3b82f6',
                name: 'Membros',
              },
            ]}
            xAxisDataKey="name"
            height={300}
            layout="horizontal"
          />
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {metrics.totalGcs}
                </h3>
                <p className="text-sm text-gray-600">Total de GCs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {metrics.totalMembers}
                </h3>
                <p className="text-sm text-gray-600">Total de Membros</p>
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
                  {(metrics.conversionRate * 100).toFixed(1)}%
                </h3>
                <p className="text-sm text-gray-600">Taxa de Conversão</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
