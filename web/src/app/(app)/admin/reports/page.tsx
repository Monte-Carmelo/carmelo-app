'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { toast } from 'sonner';
import { AdminReportsDashboard } from '@/components/admin/AdminReportsDashboard';
import { Loading } from '@/components/ui/spinner';

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

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ReportsMetrics>({
    totalGcs: 0,
    activeGcs: 0,
    totalMembers: 0,
    activeMembers: 0,
    totalVisitors: 0,
    conversionRate: 0,
  });
  const [growthData, setGrowthData] = useState<GrowthData[]>([]);
  const [distributionData, setDistributionData] = useState<DistributionData[]>([]);
  const [topGCsData, setTopGCsData] = useState<TopGCData[]>([]);
  const [period, setPeriod] = useState('90');

  const formatMonthLabel = (date: Date) => {
    const formatted = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(date);
    return formatted.replace('.', '').replace(' de ', '/');
  };

  const getMonthKey = (date: Date) => (
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  );

  const buildMonthBuckets = (start: Date, end: Date) => {
    const buckets: { key: string; label: string; date: Date }[] = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const endCursor = new Date(end.getFullYear(), end.getMonth(), 1);

    while (cursor <= endCursor) {
      buckets.push({
        key: getMonthKey(cursor),
        label: formatMonthLabel(cursor),
        date: new Date(cursor),
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return buckets;
  };

  const fetchReportsData = useCallback(async (selectedPeriod = period) => {
    setLoading(true);
    const supabase = getSupabaseBrowserClient();

    try {
      const now = new Date();
      const isAllPeriod = selectedPeriod === 'all';
      const days = isAllPeriod ? null : parseInt(selectedPeriod);
      const startDate = isAllPeriod ? null : new Date(now.getTime() - (days ?? 0) * 24 * 60 * 60 * 1000);
      const startDateIso = startDate?.toISOString() ?? null;

      const membersPeriodQuery = supabase
        .from('growth_group_participants')
        .select('joined_at')
        .is('deleted_at', null);

      const gcsPeriodQuery = supabase
        .from('growth_groups')
        .select('created_at')
        .is('deleted_at', null);

      const visitorsQuery = supabase
        .from('visitors')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null);

      const convertedVisitorsQuery = supabase
        .from('visitors')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'converted')
        .is('deleted_at', null);

      if (startDateIso) {
        membersPeriodQuery.gte('joined_at', startDateIso);
        gcsPeriodQuery.gte('created_at', startDateIso);
        visitorsQuery.gte('created_at', startDateIso);
        convertedVisitorsQuery.gte('created_at', startDateIso);
      }

      // Fetch metrics in parallel
      const [
        totalGcsResult,
        activeGcsResult,
        totalMembersResult,
        activeMembersResult,
        visitorsResult,
        convertedVisitorsResult,
        modeDistributionResult,
        topGCsResult,
        membersPeriodResult,
        gcsPeriodResult,
      ] = await Promise.all([
        // Total GCs
        supabase
          .from('growth_groups')
          .select('id', { count: 'exact', head: true })
          .is('deleted_at', null),

        // Active GCs
        supabase
          .from('growth_groups')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active')
          .is('deleted_at', null),

        // Total members
        supabase
          .from('growth_group_participants')
          .select('id', { count: 'exact', head: true })
          .is('deleted_at', null),

        // Active members
        supabase
          .from('growth_group_participants')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active')
          .is('deleted_at', null),

        // Visitors in period
        visitorsQuery,

        // Converted visitors
        convertedVisitorsQuery,

        // Mode distribution
        supabase
          .from('growth_groups')
          .select('mode')
          .is('deleted_at', null),

        // Top GCs by members
        supabase
          .from('growth_groups')
          .select(`
            name,
            growth_group_participants!inner(id, status, deleted_at)
          `)
          .eq('status', 'active')
          .is('deleted_at', null)
          .eq('growth_group_participants.status', 'active')
          .is('growth_group_participants.deleted_at', null),

        // Members added in selected period
        membersPeriodQuery,

        // GCs created in selected period
        gcsPeriodQuery,
      ]);

      // Calculate metrics
      const totalGcs = totalGcsResult.count || 0;
      const activeGcs = activeGcsResult.count || 0;
      const totalMembers = totalMembersResult.count || 0;
      const activeMembers = activeMembersResult.count || 0;
      const totalVisitors = visitorsResult.count || 0;
      const convertedVisitors = convertedVisitorsResult.count || 0;

      const conversionRate = totalVisitors > 0 ? convertedVisitors / totalVisitors : 0;

      setMetrics({
        totalGcs,
        activeGcs,
        totalMembers,
        activeMembers,
        totalVisitors,
        conversionRate,
      });

      // Process mode distribution
      if (modeDistributionResult.data) {
        const modeCounts = modeDistributionResult.data.reduce((acc: Record<string, number>, gc: { mode?: string }) => {
          const mode = gc.mode || 'unknown';
          acc[mode] = (acc[mode] || 0) + 1;
          return acc;
        }, {});

        const distributionData: DistributionData[] = Object.entries(modeCounts).map(([mode, count]) => ({
          name: mode === 'in_person' ? 'Presencial' :
                mode === 'online' ? 'Online' :
                mode === 'hybrid' ? 'Híbrido' : 'Outro',
          value: count as number,
        }));

        setDistributionData(distributionData);
      }

      // Process top GCs
      if (topGCsResult.data) {
        const gcsWithMemberCount = topGCsResult.data.map((gc: { name?: string; growth_group_participants?: unknown[] }) => ({
          name: gc.name || 'Sem nome',
          members: gc.growth_group_participants?.length || 0,
        }));

        const topGCs = gcsWithMemberCount
          .sort((a, b) => b.members - a.members)
          .slice(0, 10);

        setTopGCsData(topGCs);
      }

      const memberDates = (membersPeriodResult.data || [])
        .map((row) => row.joined_at)
        .filter((date): date is string => Boolean(date));
      const gcDates = (gcsPeriodResult.data || [])
        .map((row) => row.created_at)
        .filter((date): date is string => Boolean(date));

      const resolveStartDate = () => {
        if (startDate) return startDate;
        const timestamps = [...memberDates, ...gcDates]
          .map((date) => new Date(date))
          .filter((date) => !Number.isNaN(date.getTime()))
          .map((date) => date.getTime());
        if (timestamps.length === 0) {
          return new Date(now.getFullYear(), now.getMonth(), 1);
        }
        return new Date(Math.min(...timestamps));
      };

      const growthStartDate = resolveStartDate();
      const monthBuckets = buildMonthBuckets(growthStartDate, now);
      const membersByMonth = new Map<string, number>();
      const gcsByMonth = new Map<string, number>();

      memberDates.forEach((date) => {
        const key = getMonthKey(new Date(date));
        membersByMonth.set(key, (membersByMonth.get(key) || 0) + 1);
      });

      gcDates.forEach((date) => {
        const key = getMonthKey(new Date(date));
        gcsByMonth.set(key, (gcsByMonth.get(key) || 0) + 1);
      });

      const baselineMembers = startDate ? Math.max(0, totalMembers - memberDates.length) : 0;
      const baselineGcs = startDate ? Math.max(0, totalGcs - gcDates.length) : 0;
      let runningMembers = baselineMembers;
      let runningGcs = baselineGcs;

      const computedGrowthData = monthBuckets.map((bucket) => {
        runningMembers += membersByMonth.get(bucket.key) || 0;
        runningGcs += gcsByMonth.get(bucket.key) || 0;
        return {
          month: bucket.label,
          members: runningMembers,
          gcs: runningGcs,
        };
      });

      setGrowthData(computedGrowthData);

    } catch (error) {
      console.error('Error fetching reports data:', error);
      toast.error('Erro ao carregar dados dos relatórios');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchReportsData();
  }, [fetchReportsData]);

  const handlePeriodChange = async (newPeriod: string) => {
    setPeriod(newPeriod);
    await fetchReportsData(newPeriod);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading message="Carregando relatórios..." />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <AdminReportsDashboard
        metrics={metrics}
        growthData={growthData}
        distributionData={distributionData}
        topGCsData={topGCsData}
        period={period}
        onPeriodChange={handlePeriodChange}
      />
    </div>
  );
}
