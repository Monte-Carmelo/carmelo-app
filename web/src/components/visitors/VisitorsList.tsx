'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Mail, Calendar, TrendingUp } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import type { Database } from '@/lib/supabase/types';
import { useSession } from '@/lib/auth/session-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface VisitorView {
  id: string;
  gcId: string;
  gcName: string;
  personId: string;
  name: string;
  email: string | null;
  status: Database['public']['Tables']['visitors']['Row']['status'];
  visitCount: number;
  lastVisitDate: string | null;
}

interface VisitorsListProps {
  visitors: VisitorView[];
}

export function VisitorsList({ visitors }: VisitorsListProps) {
  const router = useRouter();
  const { session } = useSession();
  const supabase = getSupabaseBrowserClient();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConvert = async (visitor: VisitorView) => {
    setProcessingId(visitor.id);
    setErrorMessage(null);

    const now = new Date().toISOString();

    const { data: participantData, error: participantError } = await supabase
      .from('growth_group_participants')
      .upsert(
        {
          gc_id: visitor.gcId,
          person_id: visitor.personId,
          role: 'member',
          status: 'active',
          joined_at: now,
          converted_from_visitor_id: visitor.id,
          added_by_user_id: session.user.id,
        },
        {
          onConflict: 'gc_id,person_id,role',
          ignoreDuplicates: false,
        },
      )
      .select('id')
      .single();

    if (participantError || !participantData) {
      setErrorMessage(participantError?.message ?? 'Não foi possível converter visitante.');
      setProcessingId(null);
      return;
    }

    const { error: updateVisitorError } = await supabase
      .from('visitors')
      .update({
        status: 'converted',
        converted_at: now,
        converted_by_user_id: session.user.id,
        converted_to_participant_id: participantData.id,
      })
      .eq('id', visitor.id);

    if (updateVisitorError) {
      setErrorMessage('Conversão parcial: visitante não atualizado.');
      setProcessingId(null);
      return;
    }

    const { error: eventError } = await supabase.from('visitor_conversion_events').insert({
      visitor_id: visitor.id,
      participant_id: participantData.id,
      person_id: visitor.personId,
      gc_id: visitor.gcId,
      converted_at: now,
      converted_by_user_id: session.user.id,
      conversion_source: 'manual',
    });

    if (eventError) {
      setErrorMessage('Conversão registrada, mas não foi possível logar o evento.');
    }

    setProcessingId(null);
    router.refresh();
  };

  return (
    <div className="grid gap-4">
      {errorMessage ? (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{errorMessage}</p>
          </CardContent>
        </Card>
      ) : null}

      {visitors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Users className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhum visitante encontrado para os filtros selecionados.
            </p>
          </CardContent>
        </Card>
      ) : (
        visitors.map((visitor) => (
          <Card key={visitor.id}>
            <CardHeader>
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl">{visitor.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {visitor.gcName}
                  </CardDescription>
                </div>
                {visitor.email ? (
                  <a
                    href={`mailto:${visitor.email}`}
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <Mail className="h-3 w-3" />
                    {visitor.email}
                  </a>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      <span>Visitas</span>
                    </div>
                    <Badge variant="secondary">{visitor.visitCount}</Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Última visita</span>
                    </div>
                    <p className="text-sm font-semibold">
                      {visitor.lastVisitDate
                        ? new Date(visitor.lastVisitDate).toLocaleDateString('pt-BR')
                        : '—'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge variant={visitor.status === 'active' ? 'default' : 'secondary'}>
                      {visitor.status}
                    </Badge>
                  </div>
                </div>

                {visitor.status === 'active' && visitor.personId ? (
                  <div className="flex justify-end">
                    <Button
                      disabled={processingId === visitor.id || !visitor.personId}
                      onClick={() => handleConvert(visitor)}
                    >
                      {processingId === visitor.id ? 'Convertendo...' : 'Converter em membro'}
                    </Button>
                  </div>
                ) : !visitor.personId ? (
                  <p className="text-xs text-muted-foreground">
                    Cadastre os dados pessoais para habilitar conversão.
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
