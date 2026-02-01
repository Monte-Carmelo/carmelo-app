'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { toast } from 'sonner';
import { LineChart } from '@/components/admin/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Users, Building, Calendar } from 'lucide-react';

interface MonthlyGrowth {
  [key: string]: string | number;
  month: string;
  newMembers: number;
  totalMembers: number;
  newGCs: number;
  totalGCs: number;
  multiplications: number;
}

interface GrowthMetrics {
  totalMembers: number;
  newMembersThisMonth: number;
  totalGCs: number;
  newGCsThisMonth: number;
  totalMultiplications: number;
  multiplicationsThisMonth: number;
  avgMembersPerGC: number;
  growthRate: number;
}

export default function GrowthReportsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('180');
  const [monthlyData, setMonthlyData] = useState<MonthlyGrowth[]>([]);
  const [metrics, setMetrics] = useState<GrowthMetrics>({
    totalMembers: 0,
    newMembersThisMonth: 0,
    totalGCs: 0,
    newGCsThisMonth: 0,
    totalMultiplications: 0,
    multiplicationsThisMonth: 0,
    avgMembersPerGC: 0,
    growthRate: 0,
  });

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
      buckets.push({ key: getMonthKey(cursor), label: formatMonthLabel(cursor), date: new Date(cursor) });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return buckets;
  };

  const fetchGrowthData = useCallback(async (selectedPeriod = period) => {
    setLoading(true);
    const supabase = getSupabaseBrowserClient();

    try {
      // Calculate date ranges
      const now = new Date();
      const days = parseInt(selectedPeriod);
      const periodStartDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      const periodStartIso = periodStartDate.toISOString();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Fetch growth data
      const [
        totalMembersResult,
        newMembersResult,
        totalGCsResult,
        newGCsResult,
        multiplicationsResult,
        newMultiplicationsResult,
        membersPeriodResult,
        gcsPeriodResult,
        multiplicationsPeriodResult,
      ] = await Promise.all([
        // Total members
        supabase
          .from('growth_group_participants')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active')
          .is('deleted_at', null),

        // New members this month
        supabase
          .from('growth_group_participants')
          .select('id', { count: 'exact', head: true })
          .gte('joined_at', thisMonthStart.toISOString())
          .eq('status', 'active')
          .is('deleted_at', null),

        // Total GCs
        supabase
          .from('growth_groups')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active')
          .is('deleted_at', null),

        // New GCs this month
        supabase
          .from('growth_groups')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', thisMonthStart.toISOString())
          .eq('status', 'active')
          .is('deleted_at', null),

        // Total multiplications
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from('gc_multiplication_events')
          .select('id', { count: 'exact', head: true }),

        // New multiplications this month
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from('gc_multiplication_events')
          .select('id', { count: 'exact', head: true })
          .gte('multiplied_at', thisMonthStart.toISOString()),

        // Members joined in selected period
        supabase
          .from('growth_group_participants')
          .select('joined_at')
          .eq('status', 'active')
          .gte('joined_at', periodStartIso)
          .is('deleted_at', null),

        // GCs created in selected period
        supabase
          .from('growth_groups')
          .select('created_at')
          .eq('status', 'active')
          .gte('created_at', periodStartIso)
          .is('deleted_at', null),

        // Multiplications in selected period
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from('gc_multiplication_events')
          .select('multiplied_at')
          .gte('multiplied_at', periodStartIso),
      ]);

      if (
        totalMembersResult.error ||
        newMembersResult.error ||
        totalGCsResult.error ||
        newGCsResult.error ||
        multiplicationsResult.error ||
        newMultiplicationsResult.error ||
        membersPeriodResult.error ||
        gcsPeriodResult.error ||
        multiplicationsPeriodResult.error
      ) {
        throw (
          totalMembersResult.error ||
          newMembersResult.error ||
          totalGCsResult.error ||
          newGCsResult.error ||
          multiplicationsResult.error ||
          newMultiplicationsResult.error ||
          membersPeriodResult.error ||
          gcsPeriodResult.error ||
          multiplicationsPeriodResult.error
        );
      }

      // Calculate metrics
      const totalMembers = totalMembersResult.count || 0;
      const totalGCs = totalGCsResult.count || 0;
      const avgMembersPerGC = totalGCs > 0 ? Math.round(totalMembers / totalGCs) : 0;

      const memberDates = (membersPeriodResult.data || [])
        .map((row) => row.joined_at)
        .filter((date): date is string => Boolean(date));
      const gcDates = (gcsPeriodResult.data || [])
        .map((row) => row.created_at)
        .filter((date): date is string => Boolean(date));
      const multiplicationDates = (multiplicationsPeriodResult.data || [])
        .map((row: { multiplied_at?: string | null }) => row.multiplied_at)
        .filter((date): date is string => Boolean(date));

      const membersByMonth = new Map<string, number>();
      const gcsByMonth = new Map<string, number>();
      const multiplicationsByMonth = new Map<string, number>();

      memberDates.forEach((date) => {
        const key = getMonthKey(new Date(date));
        membersByMonth.set(key, (membersByMonth.get(key) || 0) + 1);
      });

      gcDates.forEach((date) => {
        const key = getMonthKey(new Date(date));
        gcsByMonth.set(key, (gcsByMonth.get(key) || 0) + 1);
      });

      multiplicationDates.forEach((date) => {
        const key = getMonthKey(new Date(date));
        multiplicationsByMonth.set(key, (multiplicationsByMonth.get(key) || 0) + 1);
      });

      const baselineMembers = Math.max(0, totalMembers - memberDates.length);
      const baselineGcs = Math.max(0, totalGCs - gcDates.length);
      let runningMembers = baselineMembers;
      let runningGcs = baselineGcs;

      const monthBuckets = buildMonthBuckets(periodStartDate, now);
      const monthlyGrowth = monthBuckets.map((bucket) => {
        const newMembers = membersByMonth.get(bucket.key) || 0;
        const newGCs = gcsByMonth.get(bucket.key) || 0;
        runningMembers += newMembers;
        runningGcs += newGCs;
        return {
          month: bucket.label,
          newMembers,
          totalMembers: runningMembers,
          newGCs,
          totalGCs: runningGcs,
          multiplications: multiplicationsByMonth.get(bucket.key) || 0,
        };
      });

      setMonthlyData(monthlyGrowth);

      setMetrics({
        totalMembers,
        newMembersThisMonth: newMembersResult.count || 0,
        totalGCs,
        newGCsThisMonth: newGCsResult.count || 0,
        totalMultiplications: multiplicationsResult.count || 0,
        multiplicationsThisMonth: newMultiplicationsResult.count || 0,
        avgMembersPerGC,
        growthRate: calculateGrowthRate(monthlyGrowth),
      });

    } catch (error) {
      console.error('Error fetching growth data:', error);
      toast.error('Erro ao carregar dados de crescimento');
    } finally {
      setLoading(false);
    }
  }, [period]);

  const calculateGrowthRate = (data: MonthlyGrowth[]): number => {
    if (data.length < 2) return 0;

    const firstMonth = data[0];
    const lastMonth = data[data.length - 1];

    const memberGrowth = lastMonth.totalMembers - firstMonth.totalMembers;
    const growthRate = firstMonth.totalMembers > 0
      ? (memberGrowth / firstMonth.totalMembers) * 100
      : 0;

    return Math.round(growthRate * 10) / 10;
  };

  useEffect(() => {
    fetchGrowthData();
  }, [fetchGrowthData]);

  const handlePeriodChange = async (newPeriod: string) => {
    setPeriod(newPeriod);
    await fetchGrowthData(newPeriod);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold text-gray-900">Relatório de Crescimento</h1>
            <p className="text-gray-600 mt-1">
              Análise detalhada do crescimento de membros e GCs
            </p>
          </div>

          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="180">Últimos 6 meses</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
              <SelectItem value="730">Últimos 2 anos</SelectItem>
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Member Growth Chart */}
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

        {/* GC Growth Chart */}
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

      {/* Multiplication Timeline */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Multiplicações no Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyData.filter(m => m.multiplications > 0).length > 0 ? (
              monthlyData
                .filter(m => m.multiplications > 0)
                .map((month, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
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
