import Link from 'next/link';
import { ArrowLeft, AlertTriangle, Settings as SettingsIcon } from 'lucide-react';
import { AdminSettingsForm } from '@/components/admin/AdminSettingsForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScreenHeader } from '@/components/ui/screen-header';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { buildSettingsValues, settingsKeys } from '@/lib/validations/settings';

interface SettingsStatus {
  last_updated: string | null;
  updated_by: string | null;
  total_configs: number;
}

async function loadSettingsPageData() {
  const supabase = await createSupabaseServerClient();
  const [settingsResult, totalConfigsResult, recentUpdateResult] = await Promise.all([
    supabase.from('config').select('key, value').in('key', settingsKeys),
    supabase.from('config').select('*', { count: 'exact', head: true }),
    supabase
      .from('config')
      .select('updated_at, users!inner(id, people(name))')
      .not('updated_at', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single(),
  ]);

  if (settingsResult.error) {
    throw settingsResult.error;
  }

  const recentUpdate = recentUpdateResult.data as { updated_at?: string | null; users?: { people?: { name?: string } } } | null;

  return {
    initialValues: buildSettingsValues(settingsResult.data),
    status: {
      last_updated: recentUpdate?.updated_at || null,
      updated_by: recentUpdate?.users?.people?.name || null,
      total_configs: totalConfigsResult.count || 0,
    } satisfies SettingsStatus,
  };
}

export default async function SettingsPage() {
  const { initialValues, status } = await loadSettingsPageData();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center text-sm font-medium text-primary transition-colors hover:text-brand-hover"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para o painel
        </Link>

        <ScreenHeader
          eyebrow="Gestão"
          title="Configurações do sistema"
          subtitle="Valores globais que afetam GCs, conversões e relatórios"
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <SettingsIcon className="mr-2 h-5 w-5" />
            Status das Configurações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Total de Configurações</p>
              <p className="text-lg font-semibold text-foreground">{status.total_configs}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Última Atualização</p>
              <p className="text-lg font-semibold text-foreground">
                {status.last_updated
                  ? new Date(status.last_updated).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Nunca'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Atualizado por</p>
              <p className="text-lg font-semibold text-foreground">{status.updated_by || 'Desconhecido'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Atenção:</strong> As configurações aqui afetam toda a aplicação.
          Alterações nos valores de GCs, conversões e relatórios impactam diretamente
          a experiência dos usuários e as métricas do sistema.
        </AlertDescription>
      </Alert>

      <AdminSettingsForm initialValues={initialValues} />
    </div>
  );
}
