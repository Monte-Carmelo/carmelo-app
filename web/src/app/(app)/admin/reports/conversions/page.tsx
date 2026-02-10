'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { toast } from 'sonner';
import { LineChart, PieChart, BarChart } from '@/components/admin/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, TrendingUp, Clock, CheckCircle, UserCheck } from 'lucide-react';

interface ConversionMetrics {
  totalVisitors: number;
  convertedVisitors: number;
  conversionRate: number;
  avgConversionTime: number;
  conversionsThisMonth: number;
  topConvertingGC: string;
  totalConversionsAllTime: number;
}

interface MonthlyConversions {
  [key: string]: string | number;
  month: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
}

interface GCConversions {
  [key: string]: string | number;
  gcName: string;
  totalVisitors: number;
  conversions: number;
  conversionRate: number;
}

interface RecentConversion {
  visitorName: string;
  gcName: string;
  conversionDate: string;
  timeAsVisitor: number;
}

const formatMonthLabel = (date: Date) => {
  const formatted = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(date);
  return formatted.replace('.', '').replace(' de ', '/');
};

const getMonthKey = (date: Date) => (
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
);

const buildMonthBuckets = (start: Date, end: Date) => {
  const buckets: { key: string; label: string }[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const endCursor = new Date(end.getFullYear(), end.getMonth(), 1);

  while (cursor <= endCursor) {
    buckets.push({ key: getMonthKey(cursor), label: formatMonthLabel(cursor) });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return buckets;
};

export default function ConversionsReportsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('180');
  const [metrics, setMetrics] = useState<ConversionMetrics>({
    totalVisitors: 0,
    convertedVisitors: 0,
    conversionRate: 0,
    avgConversionTime: 0,
    conversionsThisMonth: 0,
    topConvertingGC: '',
    totalConversionsAllTime: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyConversions[]>([]);
  const [gcConversionData, setGCConversionData] = useState<GCConversions[]>([]);
  const [recentConversions, setRecentConversions] = useState<RecentConversion[]>([]);

  const fetchConversionData = useCallback(async (selectedPeriod = period) => {
    setLoading(true);
    const supabase = getSupabaseBrowserClient();

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(selectedPeriod));
      const startDateIso = startDate.toISOString();
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Fetch conversion data
      const [
        visitorsResult,
        conversionsAllResult,
        conversionsThisMonthResult,
        recentConversionsResult
      ] = await Promise.all([
        // Total visitors in period
        supabase
          .from('visitors')
          .select(`
            id,
            gc_id,
            status,
            created_at,
            converted_at,
            first_visit_date,
            people ( name ),
            growth_groups ( name )
          `)
          .gte('created_at', startDateIso)
          .is('deleted_at', null),

        // All conversions count (for all-time metrics)
        supabase
          .from('visitors')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'converted')
          .is('deleted_at', null),

        // Conversions this month
        supabase
          .from('visitors')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'converted')
          .gte('converted_at', thisMonthStart.toISOString())
          .is('deleted_at', null),

        // Recent conversions
        supabase
          .from('visitors')
          .select(`
            id,
            status,
            created_at,
            converted_at,
            first_visit_date,
            people ( name ),
            growth_groups ( name )
          `)
          .eq('status', 'converted')
          .not('converted_at', 'is', null)
          .order('converted_at', { ascending: false })
          .limit(5)
          .is('deleted_at', null),
      ]);

      if (visitorsResult.error || conversionsAllResult.error || conversionsThisMonthResult.error || recentConversionsResult.error) {
        throw visitorsResult.error || conversionsAllResult.error || conversionsThisMonthResult.error || recentConversionsResult.error;
      }

      const visitors = visitorsResult.data || [];
      const convertedVisitors = visitors.filter((visitor) => visitor.status === 'converted' && visitor.converted_at);

      const totalVisitors = visitors.length;
      const convertedCount = convertedVisitors.length;
      const conversionRate = totalVisitors > 0
        ? Math.round((convertedCount / totalVisitors) * 1000) / 10
        : 0;

      const conversionDays = convertedVisitors
        .map((visitor) => {
          const start = visitor.first_visit_date || visitor.created_at;
          if (!start || !visitor.converted_at) return null;
          const diffMs = new Date(visitor.converted_at).getTime() - new Date(start).getTime();
          return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
        })
        .filter((value): value is number => value !== null);

      const avgConversionTime = conversionDays.length > 0
        ? Math.round(conversionDays.reduce((acc, value) => acc + value, 0) / conversionDays.length)
        : 0;

      const gcTotals = new Map<string, { name: string; total: number; conversions: number }>();
      visitors.forEach((visitor) => {
        if (!visitor.gc_id) return;
        const gcName = visitor.growth_groups?.name || 'GC desconhecido';
        const entry = gcTotals.get(visitor.gc_id) || { name: gcName, total: 0, conversions: 0 };
        entry.total += 1;
        if (visitor.status === 'converted') {
          entry.conversions += 1;
        }
        gcTotals.set(visitor.gc_id, entry);
      });

      const gcConversions = Array.from(gcTotals.values()).map((entry) => ({
        gcName: entry.name,
        totalVisitors: entry.total,
        conversions: entry.conversions,
        conversionRate: entry.total > 0 ? (entry.conversions / entry.total) * 100 : 0,
      }));

      const topConvertingGC = gcConversions
        .slice()
        .sort((a, b) => b.conversions - a.conversions)[0]?.gcName || 'Sem dados';

      const monthBuckets = buildMonthBuckets(startDate, now);
      const visitorsByMonth = new Map<string, number>();
      const conversionsByMonth = new Map<string, number>();

      visitors.forEach((visitor) => {
        if (!visitor.created_at) return;
        const key = getMonthKey(new Date(visitor.created_at));
        visitorsByMonth.set(key, (visitorsByMonth.get(key) || 0) + 1);
      });

      convertedVisitors.forEach((visitor) => {
        if (!visitor.converted_at) return;
        const key = getMonthKey(new Date(visitor.converted_at));
        conversionsByMonth.set(key, (conversionsByMonth.get(key) || 0) + 1);
      });

      const monthlyData = monthBuckets.map((bucket) => {
        const monthVisitors = visitorsByMonth.get(bucket.key) || 0;
        const monthConversions = conversionsByMonth.get(bucket.key) || 0;
        return {
          month: bucket.label,
          visitors: monthVisitors,
          conversions: monthConversions,
          conversionRate: monthVisitors > 0 ? (monthConversions / monthVisitors) * 100 : 0,
        };
      });

      const recentConversionsData = (recentConversionsResult.data || []).map((conversion) => {
        const start = conversion.first_visit_date || conversion.created_at;
        const convertedAt = conversion.converted_at ? new Date(conversion.converted_at) : null;
        const startDateValue = start ? new Date(start) : null;
        const diffMs = convertedAt && startDateValue
          ? convertedAt.getTime() - startDateValue.getTime()
          : 0;
        return {
          visitorName: conversion.people?.name || 'Visitante',
          gcName: conversion.growth_groups?.name || 'GC desconhecido',
          conversionDate: convertedAt ? convertedAt.toLocaleDateString('pt-BR') : '-',
          timeAsVisitor: convertedAt && startDateValue
            ? Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)))
            : 0,
        };
      });

      setMetrics({
        totalVisitors,
        convertedVisitors: convertedCount,
        conversionRate,
        avgConversionTime,
        conversionsThisMonth: conversionsThisMonthResult.count || 0,
        topConvertingGC,
        totalConversionsAllTime: conversionsAllResult.count || 0,
      });

      setMonthlyData(monthlyData);
      setGCConversionData(gcConversions);
      setRecentConversions(recentConversionsData);

    } catch (error) {
      console.error('Error fetching conversion data:', error);
      toast.error('Erro ao carregar dados de conversões');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchConversionData();
  }, [fetchConversionData]);

  const handlePeriodChange = async (newPeriod: string) => {
    setPeriod(newPeriod);
    await fetchConversionData(newPeriod);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  const conversionStages = [
    { name: 'Visitantes', value: metrics.totalVisitors - metrics.convertedVisitors, color: '#f59e0b' },
    { name: 'Convertidos', value: metrics.convertedVisitors, color: '#10b981' },
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
            <h1 className="text-3xl font-bold text-gray-900">Relatório de Conversões</h1>
            <p className="text-gray-600 mt-1">
              Análise detalhada da conversão de visitantes em membros
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Conversion Trend */}
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

        {/* Conversion Funnel */}
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

      {/* GC Conversion Rates */}
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

      {/* Recent Conversions and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Conversions */}
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
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
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

        {/* Top Converting GCs */}
        <Card>
          <CardHeader>
            <CardTitle>GCs com Melhor Desempenho</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {gcConversionData
                .sort((a, b) => b.conversionRate - a.conversionRate)
                .slice(0, 5)
                .map((gc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
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

      {/* Summary Stats */}
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
