'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users, UserPlus, Mail, Phone, Calendar } from 'lucide-react';
import type { ParticipantView } from '@/lib/api/participants';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Label } from '@/components/ui/label';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ParticipantListProps {
  participants: ParticipantView[];
  groups: { id: string; name: string }[];
}

export function ParticipantList({ participants, groups }: ParticipantListProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
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
    const endpoint = new URL(
      `/api/participants/${participant.participantId}/status`,
      window.location.origin,
    ).toString();

    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: newStatus }),
    });
    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.success) {
      setErrorMessage(result?.error ?? 'Não foi possível atualizar status.');
      setProcessingId(null);
      return;
    }

    startTransition(() => router.refresh());
    setProcessingId(null);
  };

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <ScreenHeader
          className="min-w-0"
          title="Participantes"
          subtitle="Consulte os participantes ativos dos seus GCs, com opção de adicionar novos membros rapidamente."
        />
        <div className="flex flex-wrap gap-2 md:mt-1 md:shrink-0">
          <Button asChild>
            <Link href="/participants/new">
              <UserPlus className="mr-2 h-4 w-4" />
              Cadastrar participante
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/visitors">
              <Users className="mr-2 h-4 w-4" />
              Acompanhar visitantes
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-card bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="gcId" className="text-xs font-semibold text-muted-foreground">
              Grupo
            </Label>
            <Select
              name="gcId"
              defaultValue={searchParams.get('gcId') ?? 'all'}
              onValueChange={(value) => handleFilterChange('gcId', value === 'all' ? '' : value)}
              disabled={isPending}
            >
              <SelectTrigger id="gcId">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 space-y-1.5">
            <Label htmlFor="role" className="text-xs font-semibold text-muted-foreground">
              Papel
            </Label>
            <Select
              name="role"
              defaultValue={searchParams.get('role') ?? 'all'}
              onValueChange={(value) => handleFilterChange('role', value === 'all' ? '' : value)}
              disabled={isPending}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="leader">Líder</SelectItem>
                <SelectItem value="member">Membro</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 space-y-1.5">
            <Label htmlFor="status" className="text-xs font-semibold text-muted-foreground">
              Status
            </Label>
            <Select
              name="status"
              defaultValue={searchParams.get('status') ?? 'active'}
              onValueChange={(value) => handleFilterChange('status', value)}
              disabled={isPending}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Ativos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
                <SelectItem value="transferred">Transferidos</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-card bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4">
        {participants.length ? (
          participants.map((participant) => (
            <div key={participant.participantId} className="rounded-card bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar name={participant.name} />
                  <div className="min-w-0">
                    <h3 className="truncate text-[15.5px] font-bold leading-tight text-foreground">
                      {participant.name}
                    </h3>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {participant.gcName} • {participant.role}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Ingresso: {new Date(participant.joinedAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar soft="paper" size="sm">
                      <Mail className="h-4 w-4" />
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">E-mail</p>
                      <p className="truncate text-sm font-semibold text-foreground">{participant.email ?? '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Avatar soft="paper" size="sm">
                      <Phone className="h-4 w-4" />
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Telefone</p>
                      <p className="truncate text-sm font-semibold text-foreground">{participant.phone ?? '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge
                        className="mt-1"
                        dot
                        variant={
                          participant.status === 'active'
                            ? 'success'
                            : participant.status === 'inactive'
                              ? 'danger'
                              : 'neutral'
                        }
                      >
                        {participant.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/participants/${participant.participantId}/edit`}>
                      Editar
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant={participant.status === 'active' ? 'destructive' : 'default'}
                    onClick={() => handleToggleStatus(participant)}
                    disabled={processingId === participant.participantId}
                  >
                    {processingId === participant.participantId
                      ? 'Atualizando...'
                      : participant.status === 'active'
                        ? 'Inativar'
                        : 'Reativar'}
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            icon={<Users />}
            title="Nenhum participante encontrado para os filtros selecionados."
          />
        )}
      </div>
    </section>
  );
}
