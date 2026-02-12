'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users, UserPlus, Mail, Phone, Calendar } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import type { ParticipantView } from '@/lib/api/participants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Participantes</h1>
          <p className="text-muted-foreground">
            Consulte os participantes ativos dos seus GCs, com opção de adicionar novos membros rapidamente.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="gcId">Grupo</Label>
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

            <div className="flex-1 space-y-2">
              <Label htmlFor="role">Papel</Label>
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

            <div className="flex-1 space-y-2">
              <Label htmlFor="status">Status</Label>
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
        </CardContent>
      </Card>

      {errorMessage ? (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{errorMessage}</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {participants.length ? (
          participants.map((participant) => (
            <Card key={participant.participantId}>
              <CardHeader>
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{participant.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {participant.gcName} • {participant.role}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Ingresso: {new Date(participant.joinedAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span>E-mail</span>
                      </div>
                      <p className="text-sm font-semibold">{participant.email ?? '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>Telefone</span>
                      </div>
                      <p className="text-sm font-semibold">{participant.phone ?? '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge variant={participant.status === 'active' ? 'default' : 'secondary'}>
                        {participant.status}
                      </Badge>
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
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Users className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Nenhum participante encontrado para os filtros selecionados.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
