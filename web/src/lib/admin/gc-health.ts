/**
 * Saúde de um GC derivada da recência do último encontro registrado —
 * "Saudável" (≤2 semanas), "Atenção" (≤4 semanas) ou "Silencioso" (mais que
 * isso ou sem encontro). Usado no painel do pastor e na lista de GCs.
 */
export type GcHealth = 'healthy' | 'attention' | 'silent';

const DAY_MS = 24 * 60 * 60 * 1000;

export function gcHealthFromLastMeeting(
  lastMeetingDate: string | null | undefined,
  now: Date = new Date(),
): GcHealth {
  if (!lastMeetingDate) return 'silent';
  const days = (now.getTime() - new Date(lastMeetingDate).getTime()) / DAY_MS;
  if (days <= 14) return 'healthy';
  if (days <= 28) return 'attention';
  return 'silent';
}

export const GC_HEALTH_META: Record<
  GcHealth,
  { label: string; variant: 'success' | 'warn' | 'danger' }
> = {
  healthy: { label: 'Saudável', variant: 'success' },
  attention: { label: 'Atenção', variant: 'warn' },
  silent: { label: 'Silencioso', variant: 'danger' },
};
