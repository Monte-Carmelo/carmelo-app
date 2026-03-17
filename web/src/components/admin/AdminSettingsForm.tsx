'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useClientReady } from '@/lib/hooks/use-client-ready';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Settings, Users, Building, BookOpen, TrendingUp } from 'lucide-react';

// Configuration schema
const settingsSchema = z.object({
  // Gerais
  organization_name: z.string().min(1, 'Nome da organização é obrigatório'),

  // GCs
  gc_min_members: z.number().min(1, 'Mínimo deve ser maior que 0').max(50, 'Máximo 50 membros'),
  gc_max_members: z.number().min(1, 'Máximo deve ser maior que 0').max(200, 'Máximo 200 membros'),
  gc_min_meeting_frequency_weeks: z.number().min(1, 'Mínimo 1 semana').max(4, 'Máximo 4 semanas'),

  // Visitantes
  visitor_conversion_threshold: z.number().min(1, 'Mínimo 1 visita').max(20, 'Máximo 20 visitas'),
  visitor_conversion_days: z.number().min(1, 'Mínimo 1 dia').max(365, 'Máximo 365 dias'),
  auto_convert_visitors: z.boolean(),

  // Relatórios
  dashboard_cache_ttl_minutes: z.number().min(1, 'Mínimo 1 minuto').max(1440, 'Máximo 1 dia (1440 min)'),
  reports_default_period_days: z.number().min(7, 'Mínimo 7 dias').max(365, 'Máximo 365 dias'),

  // Notificações
  email_notifications_enabled: z.boolean(),
  weekly_report_enabled: z.boolean(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

// Default values
const defaultValues: SettingsFormData = {
  organization_name: '',
  gc_min_members: 5,
  gc_max_members: 25,
  gc_min_meeting_frequency_weeks: 1,
  visitor_conversion_threshold: 3,
  visitor_conversion_days: 30,
  auto_convert_visitors: false,
  dashboard_cache_ttl_minutes: 5,
  reports_default_period_days: 90,
  email_notifications_enabled: true,
  weekly_report_enabled: false,
};

interface AdminSettingsFormProps {
  className?: string;
}

export function AdminSettingsForm({ className }: AdminSettingsFormProps) {
  const isClientReady = useClientReady();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = getSupabaseBrowserClient();

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues,
    mode: 'onChange',
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = form;

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('config')
          .select('key, value')
          .in('key', [
            'organization_name',
            'gc_min_members',
            'gc_max_members',
            'gc_min_meeting_frequency_weeks',
            'visitor_conversion_threshold',
            'visitor_conversion_days',
            'auto_convert_visitors',
            'dashboard_cache_ttl_minutes',
            'reports_default_period_days',
            'email_notifications_enabled',
            'weekly_report_enabled',
          ]);

        if (error) throw error;

        // Convert array of key-value pairs to form values
        const settings = data?.reduce((acc, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {} as Record<string, unknown>) || {};

        // Apply default values for missing keys
        const formValues = {
          ...defaultValues,
          ...settings,
        };

        reset(formValues);
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        toast.error('Erro ao carregar configurações');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [reset, supabase]);

  const onSubmit = async (data: SettingsFormData) => {
    setSaving(true);

    try {
      // Convert form data to key-value pairs for database
      const configEntries = Object.entries(data).map(([key, value]) => ({
        key,
        value,
        description: getConfigDescription(key),
      }));

      // Upsert all configurations
      const { error } = await supabase
        .from('config')
        .upsert(configEntries, {
          onConflict: 'key',
        });

      if (error) throw error;

      toast.success('Configurações salvas com sucesso!');
      reset(data); // Mark form as clean
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Carregando configurações...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={className}>
      {/* Gerais */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Configurações Gerais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="organization_name">Nome da Organização</Label>
            <Input
              id="organization_name"
              {...register('organization_name')}
              placeholder="Igreja Monte Carmelo"
            />
            {errors.organization_name && (
              <p className="text-sm text-red-600 mt-1">
                {errors.organization_name.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grupos de Crescimento */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Grupos de Crescimento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gc_min_members">Número Mínimo de Membros</Label>
              <Input
                id="gc_min_members"
                type="number"
                {...register('gc_min_members', { valueAsNumber: true })}
              />
              {errors.gc_min_members && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.gc_min_members.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="gc_max_members">Número Máximo de Membros</Label>
              <Input
                id="gc_max_members"
                type="number"
                {...register('gc_max_members', { valueAsNumber: true })}
              />
              {errors.gc_max_members && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.gc_max_members.message}
                </p>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="gc_min_meeting_frequency_weeks">
              Frequência Mínima de Reuniões (semanas)
            </Label>
            <Input
              id="gc_min_meeting_frequency_weeks"
              type="number"
              {...register('gc_min_meeting_frequency_weeks', { valueAsNumber: true })}
            />
            {errors.gc_min_meeting_frequency_weeks && (
              <p className="text-sm text-red-600 mt-1">
                {errors.gc_min_meeting_frequency_weeks.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Visitantes */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Visitantes e Conversões
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="visitor_conversion_threshold">
                Limite de Visitas para Conversão
              </Label>
              <Input
                id="visitor_conversion_threshold"
                type="number"
                {...register('visitor_conversion_threshold', { valueAsNumber: true })}
              />
              {errors.visitor_conversion_threshold && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.visitor_conversion_threshold.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="visitor_conversion_days">
                Período para Conversão (dias)
              </Label>
              <Input
                id="visitor_conversion_days"
                type="number"
                {...register('visitor_conversion_days', { valueAsNumber: true })}
              />
              {errors.visitor_conversion_days && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.visitor_conversion_days.message}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="auto_convert_visitors"
              {...register('auto_convert_visitors')}
            />
            <Label htmlFor="auto_convert_visitors">
              Converter visitantes automaticamente ao atingir limite
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Relatórios */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Relatórios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dashboard_cache_ttl_minutes">
                Cache do Dashboard (minutos)
              </Label>
              <Input
                id="dashboard_cache_ttl_minutes"
                type="number"
                {...register('dashboard_cache_ttl_minutes', { valueAsNumber: true })}
              />
              {errors.dashboard_cache_ttl_minutes && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.dashboard_cache_ttl_minutes.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="reports_default_period_days">
                Período Padrão de Relatórios (dias)
              </Label>
              <Input
                id="reports_default_period_days"
                type="number"
                {...register('reports_default_period_days', { valueAsNumber: true })}
              />
              {errors.reports_default_period_days && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.reports_default_period_days.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="email_notifications_enabled"
              {...register('email_notifications_enabled')}
            />
            <Label htmlFor="email_notifications_enabled">
              Habilitar notificações por e-mail
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="weekly_report_enabled"
              {...register('weekly_report_enabled')}
            />
            <Label htmlFor="weekly_report_enabled">
              Enviar relatório semanal para líderes
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!isClientReady || saving || !isDirty}
          className="min-w-32"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Configurações'
          )}
        </Button>
      </div>
    </form>
  );
}

// Helper function to get configuration descriptions
function getConfigDescription(key: string): string {
  const descriptions: Record<string, string> = {
    organization_name: 'Nome da organização/igreja',
    gc_min_members: 'Número mínimo de membros para um GC ser considerado saudável',
    gc_max_members: 'Número máximo de membros recomendado por GC',
    gc_min_meeting_frequency_weeks: 'Frequência mínima recomendada de reuniões',
    visitor_conversion_threshold: 'Número de visitas antes de sugerir conversão',
    visitor_conversion_days: 'Período máximo em dias para considerar conversão',
    auto_convert_visitors: 'Converter automaticamente visitantes em membros',
    dashboard_cache_ttl_minutes: 'Tempo de cache do dashboard em minutos',
    reports_default_period_days: 'Período padrão para relatórios em dias',
    email_notifications_enabled: 'Habilitar notificações por e-mail',
    weekly_report_enabled: 'Enviar relatório semanal automático',
  };

  return descriptions[key] || '';
}
