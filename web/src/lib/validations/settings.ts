import { z } from 'zod';

export const settingsSchema = z.object({
  organization_name: z.string().min(1, 'Nome da organização é obrigatório'),
  gc_min_members: z.number().min(1, 'Mínimo deve ser maior que 0').max(50, 'Máximo 50 membros'),
  gc_max_members: z.number().min(1, 'Máximo deve ser maior que 0').max(200, 'Máximo 200 membros'),
  gc_min_meeting_frequency_weeks: z.number().min(1, 'Mínimo 1 semana').max(4, 'Máximo 4 semanas'),
  visitor_conversion_threshold: z.number().min(1, 'Mínimo 1 visita').max(20, 'Máximo 20 visitas'),
  visitor_conversion_days: z.number().min(1, 'Mínimo 1 dia').max(365, 'Máximo 365 dias'),
  auto_convert_visitors: z.boolean(),
  dashboard_cache_ttl_minutes: z.number().min(1, 'Mínimo 1 minuto').max(1440, 'Máximo 1 dia (1440 min)'),
  reports_default_period_days: z.number().min(7, 'Mínimo 7 dias').max(365, 'Máximo 365 dias'),
  email_notifications_enabled: z.boolean(),
  weekly_report_enabled: z.boolean(),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;

export const defaultSettingsValues: SettingsFormData = {
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

export const settingsKeys = Object.keys(defaultSettingsValues) as Array<keyof SettingsFormData>;

export function buildSettingsValues(entries: Array<{ key: string; value: unknown }> | null | undefined): SettingsFormData {
  const mapped = entries?.reduce<Record<string, unknown>>((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {}) ?? {};

  return {
    ...defaultSettingsValues,
    ...mapped,
  } as SettingsFormData;
}

export function getConfigDescription(key: keyof SettingsFormData): string {
  const descriptions: Record<keyof SettingsFormData, string> = {
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

  return descriptions[key];
}
