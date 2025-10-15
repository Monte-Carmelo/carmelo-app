'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { deleteUser } from '@/app/(app)/admin/actions';

interface AdminUserSummary {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  isAdmin: boolean;
  isLeader: boolean;
  isSupervisor: boolean;
  isCoordinator: boolean;
  gcsLed: number;
  gcsSupervised: number;
  directSubordinates: number;
}

interface AdminUserListProps {
  currentUserId: string;
  users: AdminUserSummary[];
}

export function AdminUserList({ currentUserId, users }: AdminUserListProps) {
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (userId: string, userName: string) => {
    if (processingId || isPending) {
      return;
    }

    setErrorMessage(null);
    setFeedback(null);
    setProcessingId(userId);

    startTransition(() => {
      deleteUser(userId)
        .then((result) => {
          if (result.success) {
            setFeedback(`Usuário "${userName}" removido.`);
            router.refresh();
          } else {
            setErrorMessage(result.error ?? 'Não foi possível remover o usuário.');
          }
        })
        .catch(() => {
          setErrorMessage('Não foi possível remover o usuário.');
        })
        .finally(() => {
          setProcessingId(null);
        });
    });
  };

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">Administração de usuários</h1>
          <p className="text-sm text-slate-600">
            Gerencie acessos, papéis e vínculos com GCs. Apenas administradores podem acessar esta seção.
          </p>
        </div>
        <Link
          href="/admin/users/new"
          className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110"
        >
          Novo usuário
        </Link>
      </header>

      {feedback ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
      ) : null}

      <div className="grid gap-4">
        {users.length ? (
          users.map((user) => {
            const roleLabels: string[] = [];
            if (user.isAdmin) roleLabels.push('Admin');
            if (user.isLeader) roleLabels.push('Líder');
            if (user.isSupervisor) roleLabels.push('Supervisor');
            if (user.isCoordinator) roleLabels.push('Coordenador');

            return (
              <article key={user.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <header className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{user.name}</h2>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      {roleLabels.length ? roleLabels.join(' • ') : 'Sem papéis atribuídos'}
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p>{user.email ?? 'Sem e-mail'}</p>
                    <p>{user.phone ?? 'Sem telefone'}</p>
                  </div>
                </header>

                <dl className="mt-4 grid grid-cols-2 gap-4 text-sm text-slate-600 md:grid-cols-4">
                  <div>
                    <dt className="uppercase text-xs tracking-wide text-slate-400">GCs liderados</dt>
                    <dd className="text-sm font-semibold text-slate-800">{user.gcsLed}</dd>
                  </div>
                  <div>
                    <dt className="uppercase text-xs tracking-wide text-slate-400">GCs supervisionados</dt>
                    <dd className="text-sm font-semibold text-slate-800">{user.gcsSupervised}</dd>
                  </div>
                  <div>
                    <dt className="uppercase text-xs tracking-wide text-slate-400">Subordinados diretos</dt>
                    <dd className="text-sm font-semibold text-slate-800">{user.directSubordinates}</dd>
                  </div>
                  <div>
                    <dt className="uppercase text-xs tracking-wide text-slate-400">Status</dt>
                    <dd className="text-sm font-semibold text-slate-800">
                      {user.id === currentUserId ? 'Você' : 'Ativo'}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    Editar usuário
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(user.id, user.name)}
                    disabled={user.id === currentUserId || processingId === user.id}
                    className={clsx(
                      'inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70',
                      'bg-rose-600 hover:brightness-110',
                    )}
                  >
                    {processingId === user.id ? 'Removendo...' : 'Remover'}
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            Nenhum usuário encontrado.
          </div>
        )}
      </div>
    </section>
  );
}
