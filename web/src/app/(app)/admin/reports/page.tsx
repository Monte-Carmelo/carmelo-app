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

  const fetchReportsData = useCallback(async (selectedPeriod = period) => {
    setLoading(true);
    const supabase = getSupabaseBrowserClient();

    try {
      // Calculate date range
      const now = new Date();
      const daysAgo = new Date(now.getTime() - parseInt(selectedPeriod) * 24 * 60 * 60 * 1000);
      const startDate = daysAgo.toISOString();

      // Fetch metrics in parallel
      const [
        totalGcsResult,
        activeGcsResult,
        totalMembersResult,
        activeMembersResult,
        visitorsResult,
        convertedVisitorsResult,
        modeDistributionResult,
        topGCsResult
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
        supabase
          .from('visitors')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', startDate)
          .is('deleted_at', null),

        // Converted visitors
        supabase
          .from('visitors')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'converted')
          .gte('created_at', startDate)
          .is('deleted_at', null),

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
            growth_group_participants!inner(id)
          `)
          .eq('status', 'active')
          .is('deleted_at', null)
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

      // Generate growth data (simplified for now - in real implementation would use date grouping)
      const generateGrowthData = () => {
        const months = [];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push({
            month: date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
            members: Math.floor(Math.random() * 50) + 100, // Mock data
            gcs: Math.floor(Math.random() * 5) + 15, // Mock data
          });
        }

        return months;
      };

      setGrowthData(generateGrowthData());

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
