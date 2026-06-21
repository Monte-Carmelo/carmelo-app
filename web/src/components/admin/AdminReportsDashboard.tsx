'use client';

import { LineChart, PieChart, BarChart } from './charts';
import { KpiCard } from '@/components/ui/kpi-card';
import { ScreenHeader } from '@/components/ui/screen-header';
import { AdminReportPeriodSelect } from './AdminReportPeriodSelect';

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

/** Card branco do DS com cabeçalho em eyebrow. */
function ChartCard({
  eyebrow,
  children,
}: {
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-card bg-white p-5 shadow">
      <span className="eyebrow">{eyebrow}</span>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function AdminReportsDashboard({
  metrics,
  growthData,
  distributionData,
  topGCsData,
  period,
}: AdminReportsDashboardProps) {
  return (
    <div className="space-y-5">
      <ScreenHeader
        eyebrow="Relatórios"
        title="Saúde dos GCs"
        subtitle="Métricas e tendências dos Grupos de Crescimento"
        action={
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
        }
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <KpiCard
          label="GCs ativos"
          value={metrics.activeGcs}
          delta={`${metrics.totalGcs} no total`}
          deltaTone="neutral"
        />
        <KpiCard
          label="Membros ativos"
          value={metrics.activeMembers}
          delta={`${metrics.totalMembers} no total`}
          deltaTone="neutral"
        />
        <KpiCard
          label="Visitantes"
          value={metrics.totalVisitors}
          delta="no período"
          deltaTone="neutral"
        />
        <KpiCard
          label="Taxa de conversão"
          value={`${(metrics.conversionRate * 100).toFixed(1)}%`}
          delta="visitantes → membros"
          deltaTone="success"
          deltaDirection="up"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard eyebrow="Crescimento ao longo do tempo">
          <LineChart
            data={growthData.map((item) => ({
              month: item.month,
              members: item.members,
              gcs: item.gcs,
            }))}
            lines={[
              { dataKey: 'members', stroke: '#00A499', name: 'Membros' },
              { dataKey: 'gcs', stroke: '#1F4A45', name: 'GCs' },
            ]}
            xAxisDataKey="month"
            height={250}
          />
        </ChartCard>

        <ChartCard eyebrow="Distribuição por modo">
          <PieChart
            data={distributionData.map((item) => ({ name: item.name, value: item.value }))}
            height={250}
            colors={['#00A499', '#1F4A45', '#C68A2E']}
          />
        </ChartCard>
      </div>

      <ChartCard eyebrow="Top 10 GCs por número de membros">
        <BarChart
          data={topGCsData.map((item) => ({ name: item.name, members: item.members }))}
          bars={[{ dataKey: 'members', fill: '#00A499', name: 'Membros' }]}
          xAxisDataKey="name"
          height={300}
          layout="horizontal"
        />
      </ChartCard>
    </div>
  );
}
