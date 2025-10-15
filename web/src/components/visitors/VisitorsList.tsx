'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import type { Database } from '@/lib/supabase/types';
import { useSession } from '@/lib/auth/session-context';

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
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {visitors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
          Nenhum visitante encontrado para os filtros selecionados.
        </div>
      ) : (
        visitors.map((visitor) => (
          <article key={visitor.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <header className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{visitor.name}</h2>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  {visitor.gcName}
                </p>
              </div>
              {visitor.email ? (
                <a
                  href={`mailto:${visitor.email}`}
                  className="text-sm text-primary hover:underline"
                >
                  {visitor.email}
                </a>
              ) : null}
            </header>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600 md:grid-cols-4">
              <div>
                <dt className="uppercase text-xs tracking-wide text-slate-400">Visitas</dt>
                <dd className="text-sm font-semibold text-slate-800">{visitor.visitCount}</dd>
              </div>
              <div>
                <dt className="uppercase text-xs tracking-wide text-slate-400">Última visita</dt>
                <dd className="text-sm font-semibold text-slate-800">
                  {visitor.lastVisitDate
                    ? new Date(visitor.lastVisitDate).toLocaleDateString('pt-BR')
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="uppercase text-xs tracking-wide text-slate-400">Status</dt>
                <dd className="text-sm font-semibold text-slate-800">{visitor.status}</dd>
              </div>
            </dl>

            {visitor.status === 'active' && visitor.personId ? (
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  disabled={processingId === visitor.id || !visitor.personId}
                  className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                  onClick={() => handleConvert(visitor)}
                >
                  {processingId === visitor.id ? 'Convertendo...' : 'Converter em membro'}
                </button>
                {!visitor.personId ? (
                  <p className="mt-2 text-xs text-slate-500">Cadastre os dados pessoais para habilitar conversão.</p>
                ) : null}
              </div>
            ) : null}
          </article>
        ))
      )}
    </div>
  );
}
