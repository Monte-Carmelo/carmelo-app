'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { AdminSettingsForm } from '@/components/admin/AdminSettingsForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Settings as SettingsIcon } from 'lucide-react';

interface SettingsStatus {
  last_updated: string | null;
  updated_by: string | null;
  total_configs: number;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SettingsStatus>({
    last_updated: null,
    updated_by: null,
    total_configs: 0,
  });

  const supabase = getSupabaseBrowserClient();

  // Load settings status
  useEffect(() => {
    const loadStatus = async () => {
      try {
        // Get total configs count
        const { count: totalConfigs } = await supabase
          .from('config')
          .select('*', { count: 'exact', head: true });

        // Get most recent update
        const { data: recentUpdate } = await supabase
          .from('config')
          .select('updated_at, users!inner(id, people(name))')
          .not('updated_at', 'is', null)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        setStatus({
          last_updated: recentUpdate?.updated_at || null,
          updated_by: (recentUpdate as { users?: { people?: { name?: string } } })?.users?.people?.name || null,
          total_configs: totalConfigs || 0,
        });
      } catch (error) {
        console.error('Erro ao carregar status das configurações:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStatus();
  }, [supabase]);

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
          href="/admin"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Admin
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configurações do Sistema</h1>
            <p className="text-gray-600 mt-1">
              Gerencie as configurações globais da aplicação
            </p>
          </div>
        </div>
      </div>

      {/* Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <SettingsIcon className="h-5 w-5 mr-2" />
            Status das Configurações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total de Configurações</p>
              <p className="text-lg font-semibold">{status.total_configs}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Última Atualização</p>
              <p className="text-lg font-semibold">
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
              <p className="text-sm text-gray-600">Atualizado por</p>
              <p className="text-lg font-semibold">
                {status.updated_by || 'Desconhecido'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Alert */}
      <Alert className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Atenção:</strong> As configurações aqui afetam toda a aplicação.
          Alterações nos valores de GCs, conversões e relatórios impactam diretamente
          a experiência dos usuários e as métricas do sistema.
        </AlertDescription>
      </Alert>

      {/* Settings Form */}
      <AdminSettingsForm />
    </div>
  );
}