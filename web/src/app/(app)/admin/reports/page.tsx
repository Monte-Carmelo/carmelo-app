import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { AdminReportsDashboard } from '@/components/admin/AdminReportsDashboard';
import {
  ADMIN_REPORT_PERIOD_OPTIONS,
  getAdminReportsDashboardData,
  resolveReportPeriod,
} from '@/lib/admin/reports';

interface ReportsPageProps {
  searchParams?: Promise<{ period?: string }>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const resolvedSearchParams = await searchParams;
  const period = resolveReportPeriod(
    resolvedSearchParams?.period,
    ADMIN_REPORT_PERIOD_OPTIONS,
    '90',
  );
  const supabase = await createSupabaseServerClient();
  const reportData = await getAdminReportsDashboardData(supabase, period);

  return (
    <div className="container mx-auto py-8">
      <AdminReportsDashboard
        metrics={reportData.metrics}
        growthData={reportData.growthData}
        distributionData={reportData.distributionData}
        topGCsData={reportData.topGCsData}
        period={period}
      />
    </div>
  );
}
