'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import type { Database } from '@/lib/supabase/types';

interface ParticipantView {
  participantId: string;
  gcId: string;
  gcName: string;
  personId: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: Database['public']['Tables']['growth_group_participants']['Row']['role'];
  status: Database['public']['Tables']['growth_group_participants']['Row']['status'];
  joinedAt: string;
}

interface ParticipantListProps {
  participants: ParticipantView[];
  groups: { id: string; name: string }[];
}

export function ParticipantList({ participants, groups }: ParticipantListProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    startTransition(() => {
      router.replace(`/participants?${params.toString()}`);
    });
  };

  const handleToggleStatus = async (participant: ParticipantView) => {
    const newStatus = participant.status === 'active' ? 'inactive' : 'active';
    setProcessingId(participant.participantId);
    setErrorMessage(null);

    const { error } = await supabase
      .from('growth_group_participants')
      .update({ status: newStatus })
      .eq('id', participant.participantId);

    if (error) {
      setErrorMessage(error.message ?? 'Não foi possível atualizar status.');
      setProcessingId(null);
      return;
    }

    startTransition(() => router.refresh());
    setProcessingId(null);
  };

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">Participantes</h1>
          <p className="text-sm text-slate-600">
            Consulte os participantes ativos dos seus GCs, com opção de adicionar novos membros rapidamente.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/participants/new"
            className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110"
          >
            Cadastrar participante
          </Link>
          <Link
            href="/visitors"
            className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            Acompanhar visitantes
          </Link>
        </div>
      </header>

      <form className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Grupo
          <select
            name="gcId"
            defaultValue={searchParams.get('gcId') ?? ''}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            onChange={(event) => handleFilterChange('gcId', event.target.value)}
            disabled={isPending}
          >
            <option value="">Todos</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Papel
          <select
            name="role"
            defaultValue={searchParams.get('role') ?? ''}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            onChange={(event) => handleFilterChange('role', event.target.value)}
            disabled={isPending}
          >
            <option value="">Todos</option>
            <option value="leader">Líder</option>
            <option value="co_leader">Co-líder</option>
            <option value="member">Membro</option>
            <option value="supervisor">Supervisor</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Status
          <select
            name="status"
            defaultValue={searchParams.get('status') ?? 'active'}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            onChange={(event) => handleFilterChange('status', event.target.value)}
            disabled={isPending}
          >
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
            <option value="transferred">Transferidos</option>
            <option value="all">Todos</option>
          </select>
        </label>
      </form>

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
      ) : null}

      <div className="grid gap-4">
        {participants.length ? (
          participants.map((participant) => (
            <article key={participant.participantId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <header className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{participant.name}</h2>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    {participant.gcName} • {participant.role}
                  </p>
                </div>
                <span className="text-xs text-slate-500">
                  Ingresso: {new Date(participant.joinedAt).toLocaleDateString('pt-BR')}
                </span>
              </header>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600 md:grid-cols-4">
                <div>
                  <dt className="uppercase text-xs tracking-wide text-slate-400">E-mail</dt>
                  <dd className="text-sm font-semibold text-slate-800">{participant.email ?? '—'}</dd>
                </div>
                <div>
                  <dt className="uppercase text-xs tracking-wide text-slate-400">Telefone</dt>
                  <dd className="text-sm font-semibold text-slate-800">{participant.phone ?? '—'}</dd>
                </div>
                <div>
                  <dt className="uppercase text-xs tracking-wide text-slate-400">Status</dt>
                  <dd className="text-sm font-semibold text-slate-800">{participant.status}</dd>
                </div>
              </dl>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/participants/${participant.participantId}/edit`}
                  className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Editar
                </Link>
                <button
                  type="button"
                  onClick={() => handleToggleStatus(participant)}
                  disabled={processingId === participant.participantId}
                  className={clsx(
                    'inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70',
                    participant.status === 'active' ? 'bg-rose-600 hover:brightness-110' : 'bg-emerald-600 hover:brightness-110',
                  )}
                >
                  {processingId === participant.participantId
                    ? 'Atualizando...'
                    : participant.status === 'active'
                      ? 'Inativar'
                      : 'Reativar'}
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            Nenhum participante encontrado para os filtros selecionados.
          </div>
        )}
      </div>
    </section>
  );
}
