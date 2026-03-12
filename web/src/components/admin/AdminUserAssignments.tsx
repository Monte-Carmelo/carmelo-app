'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import clsx from 'clsx';
import { addUserAssignment, removeUserAssignment } from '@/app/(app)/admin/actions';
import { postgresUuid } from '@/lib/validation/postgres-uuid';

const addAssignmentSchema = z.object({
  gcId: postgresUuid('GC inválido.'),
  role: z.enum(['leader', 'supervisor', 'member'], {
    message: 'Selecione um papel.',
  }),
});

type AddAssignmentFormValues = z.infer<typeof addAssignmentSchema>;

interface AssignmentView {
  assignmentId: string;
  gcId: string;
  gcName: string;
  role: 'leader' | 'supervisor' | 'member';
}

interface GrowthGroupOption {
  id: string;
  name: string;
}

interface AdminUserAssignmentsProps {
  userId: string;
  assignments: AssignmentView[];
  availableGroups: GrowthGroupOption[];
}

export function AdminUserAssignments({ userId, assignments, availableGroups }: AdminUserAssignmentsProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pendingAssignmentId, setPendingAssignmentId] = useState<string | null>(null);
  const [isAdding, startAddTransition] = useTransition();
  const [isRemoving, startRemoveTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddAssignmentFormValues>({
    resolver: zodResolver(addAssignmentSchema),
  });

  const onAdd = handleSubmit((values) => {
    setErrorMessage(null);
    setFeedback(null);

    startAddTransition(() => {
      addUserAssignment({
        userId,
        gcId: values.gcId,
        role: values.role,
      })
        .then((result) => {
          if (result.success) {
            setFeedback('Vínculo criado com sucesso.');
            reset();
            router.refresh();
          } else {
            setErrorMessage(result.error ?? 'Não foi possível criar o vínculo.');
          }
        })
        .catch(() => {
          setErrorMessage('Não foi possível criar o vínculo.');
        });
    });
  });

  const handleRemove = (assignmentId: string) => {
    setErrorMessage(null);
    setFeedback(null);
    setPendingAssignmentId(assignmentId);

    startRemoveTransition(() => {
      removeUserAssignment({ userId, assignmentId })
        .then((result) => {
          if (result.success) {
            setFeedback('Vínculo removido.');
            router.refresh();
          } else {
            setErrorMessage(result.error ?? 'Não foi possível remover o vínculo.');
          }
        })
        .catch(() => {
          setErrorMessage('Não foi possível remover o vínculo.');
        })
        .finally(() => {
          setPendingAssignmentId(null);
        });
    });
  };

  return (
    <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header>
        <h2 className="text-lg font-semibold text-slate-900">Papéis em Grupos de Crescimento</h2>
        <p className="text-sm text-slate-600">Inclua ou remova vínculos como líder, supervisor ou membro deste usuário.</p>
      </header>

      {feedback ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
      ) : null}

      <div className="grid gap-3">
        {assignments.length ? (
          assignments.map((assignment) => (
            <article key={assignment.assignmentId} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">{assignment.gcName}</h3>
                <p className="text-xs uppercase tracking-wide text-slate-500">{assignment.role}</p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(assignment.assignmentId)}
                disabled={pendingAssignmentId === assignment.assignmentId || isRemoving}
                className={clsx(
                  'inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70',
                  'bg-rose-600 hover:brightness-110',
                )}
              >
                {pendingAssignmentId === assignment.assignmentId ? 'Removendo...' : 'Remover'}
              </button>
            </article>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
            Nenhum papel atribuído. Utilize o formulário abaixo para vincular o usuário a um GC.
          </div>
        )}
      </div>

      <form onSubmit={onAdd} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-800">Adicionar vínculo</h3>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Grupo de Crescimento
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            {...register('gcId')}
            defaultValue=""
          >
            <option value="">Selecione...</option>
            {availableGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          {errors.gcId ? <span className="text-xs text-red-600">{errors.gcId.message}</span> : null}
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Papel
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            {...register('role')}
            defaultValue=""
          >
            <option value="">Selecione...</option>
            <option value="leader">Líder</option>
            <option value="supervisor">Supervisor</option>
            <option value="member">Membro</option>
          </select>
          {errors.role ? <span className="text-xs text-red-600">{errors.role.message}</span> : null}
        </label>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={isAdding}
            className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isAdding ? 'Adicionando...' : 'Adicionar vínculo'}
          </button>
        </div>
      </form>
    </section>
  );
}
