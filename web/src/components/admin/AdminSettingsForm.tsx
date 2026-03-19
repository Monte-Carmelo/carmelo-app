'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ClientFormShell } from '@/components/forms/ClientFormShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Settings, Users, Building, BookOpen, TrendingUp } from 'lucide-react';
import { settingsSchema, type SettingsFormData } from '@/lib/validations/settings';

interface AdminSettingsFormProps {
  className?: string;
  initialValues: SettingsFormData;
}

export function AdminSettingsForm({ className, initialValues }: AdminSettingsFormProps) {
  const [saving, setSaving] = useState(false);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initialValues,
    mode: 'onChange',
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = form;

  const onSubmit = async (data: SettingsFormData) => {
    setSaving(true);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? 'Erro ao salvar configurações');
      }

      toast.success('Configurações salvas com sucesso!');
      reset(data);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ClientFormShell onSubmit={handleSubmit(onSubmit)} className={className} pending={saving}>
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
          disabled={saving || !isDirty}
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
    </ClientFormShell>
  );
}
