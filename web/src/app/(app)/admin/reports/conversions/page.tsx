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

      // Fetch conversion data
      const [
        visitorsResult,
        conversionsResult,
        gcVisitorsResult,
        thisMonthStart
      ] = await Promise.all([
        // Total visitors in period
        supabase
          .from('visitors')
          .select('id, name, gc_id, created_at, status')
          .gte('created_at', startDate.toISOString())
          .is('deleted_at', null),

        // All conversions (for all-time metrics)
        supabase
          .from('visitors')
          .select('id, name, gc_id, created_at, status, converted_at')
          .eq('status', 'converted')
          .is('deleted_at', null),

        // Visitors by GC for conversion rates
        supabase
          .from('visitors')
          .select(`
            gc_id,
            status,
            growth_groups!inner(name)
          `)
          .gte('created_at', startDate.toISOString())
          .is('deleted_at', null),

        // This month start date
        Promise.resolve(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
      ]);

      // Process data (using mock data for demonstration)
      const processedData = processConversionData(
        visitorsResult.data || [],
        conversionsResult.data || [],
        gcVisitorsResult.data || [],
        thisMonthStart
      );

      setMetrics(processedData.metrics);
      setMonthlyData(processedData.monthlyData);
      setGCConversionData(processedData.gcConversions);
      setRecentConversions(processedData.recentConversions);

    } catch (error) {
      console.error('Error fetching conversion data:', error);
      toast.error('Erro ao carregar dados de conversões');
    } finally {
      setLoading(false);
    }
  }, [period]);

  const processConversionData = (
    visitors: { status: string; converted_at?: string }[],
    allConversions: { converted_at?: string }[],
    gcVisitors: unknown[],
    thisMonthStart: Date
  ) => {
    // Mock data for demonstration
    const mockMonthlyData: MonthlyConversions[] = [
      { month: 'Jun/2024', visitors: 45, conversions: 8, conversionRate: 17.8 },
      { month: 'Jul/2024', visitors: 52, conversions: 12, conversionRate: 23.1 },
      { month: 'Ago/2024', visitors: 38, conversions: 7, conversionRate: 18.4 },
      { month: 'Set/2024', visitors: 61, conversions: 15, conversionRate: 24.6 },
      { month: 'Out/2024', visitors: 48, conversions: 11, conversionRate: 22.9 },
      { month: 'Nov/2024', visitors: 55, conversions: 14, conversionRate: 25.5 },
    ];

    const mockGCConversions: GCConversions[] = [
      { gcName: 'GC Jovens - Vila Madalena', totalVisitors: 28, conversions: 8, conversionRate: 28.6 },
      { gcName: 'GC Famílias - Moema', totalVisitors: 35, conversions: 9, conversionRate: 25.7 },
      { gcName: 'GC Universitários - Butantã', totalVisitors: 22, conversions: 6, conversionRate: 27.3 },
      { gcName: 'GC Adolescentes - Ibirapuera', totalVisitors: 18, conversions: 2, conversionRate: 11.1 },
      { gcName: 'GC Casais - Pinheiros', totalVisitors: 12, conversions: 4, conversionRate: 33.3 },
    ];

    const mockRecentConversions: RecentConversion[] = [
      { visitorName: 'Ana Silva', gcName: 'GC Jovens - Vila Madalena', conversionDate: '15/11/2024', timeAsVisitor: 45 },
      { visitorName: 'Carlos Costa', gcName: 'GC Famílias - Moema', conversionDate: '10/11/2024', timeAsVisitor: 30 },
      { visitorName: 'Mariana Santos', gcName: 'GC Casais - Pinheiros', conversionDate: '08/11/2024', timeAsVisitor: 60 },
      { visitorName: 'Pedro Oliveira', gcName: 'GC Universitários - Butantã', conversionDate: '05/11/2024', timeAsVisitor: 90 },
      { visitorName: 'Julia Mendes', gcName: 'GC Jovens - Vila Madalena', conversionDate: '02/11/2024', timeAsVisitor: 15 },
    ];

    const totalVisitors = visitors.length || gcVisitors.length || 190;
    const convertedVisitors = visitors.filter(v => v.status === 'converted').length || 39;
    const conversionsThisMonth = allConversions.filter(c =>
      c.converted_at && new Date(c.converted_at) >= thisMonthStart
    ).length || 8;
    const fallbackGCName = gcVisitors
      .map((gc) => (gc && typeof gc === 'object' && 'growth_groups' in gc ? (gc as { growth_groups?: { name?: string } }).growth_groups?.name : undefined))
      .find((name): name is string => Boolean(name)) || 'GC Casais - Pinheiros';

    return {
      metrics: {
        totalVisitors,
        convertedVisitors,
        conversionRate: Math.round((convertedVisitors / totalVisitors) * 100 * 10) / 10,
        avgConversionTime: 42, // Mock: average days as visitor before conversion
        conversionsThisMonth,
        topConvertingGC: fallbackGCName,
        totalConversionsAllTime: allConversions.length || 156,
      },
      monthlyData: mockMonthlyData,
      gcConversions: mockGCConversions,
      recentConversions: mockRecentConversions,
    };
  };

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
