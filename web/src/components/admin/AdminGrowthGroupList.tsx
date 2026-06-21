'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { Ban, Pencil, GitFork } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { inactivateGrowthGroupAction } from '@/app/(app)/admin/growth-groups/actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { ListItem } from '@/components/ui/list-item';
import { SearchField } from '@/components/ui/search-field';
import { FilterChips } from '@/components/ui/filter-chips';
import { gcHealthFromLastMeeting, GC_HEALTH_META, type GcHealth } from '@/lib/admin/gc-health';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export interface AdminGrowthGroupSummary {
  id: string;
  name: string;
  mode: 'in_person' | 'online' | 'hybrid';
  status: 'active' | 'inactive' | 'multiplying' | 'multiplied';
  leaders: string[];
  supervisors: string[];
  memberCount: number;
  lastMeetingDate: string | null;
}

interface AdminGrowthGroupListProps {
  gcs: AdminGrowthGroupSummary[];
}

const modeLabels: Record<string, string> = {
  in_person: 'Presencial',
  online: 'Online',
  hybrid: 'Híbrido',
};

const HEALTH_SEVERITY: Record<GcHealth, number> = { silent: 0, attention: 1, healthy: 2 };

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'healthy', label: 'Saudáveis' },
  { id: 'attention', label: 'Atenção' },
  { id: 'silent', label: 'Silenciosos' },
];

export function AdminGrowthGroupList({ gcs }: AdminGrowthGroupListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const now = useMemo(() => new Date(), []);

  const decorated = useMemo(
    () =>
      gcs.map((gc) => ({
        ...gc,
        health: gc.status === 'active' ? gcHealthFromLastMeeting(gc.lastMeetingDate, now) : null,
      })),
    [gcs, now],
  );

  const filtered = useMemo(() => {
    let result = [...decorated];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (gc) =>
          gc.name.toLowerCase().includes(term) ||
          gc.leaders.some((leader) => leader.toLowerCase().includes(term)),
      );
    }

    if (filter !== 'all') {
      result = result.filter((gc) => gc.health === filter);
    }

    // Atenção/silenciosos primeiro (cuidado pastoral), depois por nome.
    result.sort((a, b) => {
      const severityA = a.health ? HEALTH_SEVERITY[a.health] : 3;
      const severityB = b.health ? HEALTH_SEVERITY[b.health] : 3;
      if (severityA !== severityB) return severityA - severityB;
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [decorated, searchTerm, filter]);

  const handleInactivate = (gcId: string, gcName: string) => {
    if (processingId || isPending) return;
    setProcessingId(gcId);

    startTransition(() => {
      inactivateGrowthGroupAction(gcId)
        .then((result) => {
          if (result.success) {
            toast.success(`GC "${gcName}" inativado com sucesso.`);
            router.refresh();
          } else {
            toast.error(result.error ?? 'Não foi possível inativar o GC.');
          }
        })
        .catch(() => {
          toast.error('Não foi possível inativar o GC.');
        })
        .finally(() => {
          setProcessingId(null);
        });
    });
  };

  return (
    <div className="space-y-3">
      <SearchField
        placeholder="Buscar GC ou líder"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
      />

      <FilterChips options={FILTERS} value={filter} onValueChange={setFilter} />

      {filtered.length === 0 ? (
        <div className="rounded-card bg-white px-4 py-8 text-center text-sm text-muted-foreground shadow-sm">
          Nenhum GC encontrado.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((gc) => {
            const subtitleParts = [
              gc.leaders.length > 0 ? gc.leaders.join(', ') : 'Sem líder',
              `${gc.memberCount} ${gc.memberCount === 1 ? 'membro' : 'membros'}`,
              modeLabels[gc.mode],
            ];

            return (
              <ListItem
                key={gc.id}
                data-testid="gc-card"
                leading={<Avatar name={gc.name} />}
                title={gc.name}
                subtitle={subtitleParts.join(' · ')}
                trailing={
                  <div className="flex items-center gap-1.5">
                    {gc.status !== 'active' ? (
                      <Badge variant="neutral">
                        {gc.status === 'inactive'
                          ? 'Inativo'
                          : gc.status === 'multiplying'
                            ? 'Multiplicando'
                            : 'Multiplicado'}
                      </Badge>
                    ) : (
                      gc.health && (
                        <Badge variant={GC_HEALTH_META[gc.health].variant} dot>
                          {GC_HEALTH_META[gc.health].label}
                        </Badge>
                      )
                    )}

                    <div className="flex items-center">
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                        <Link
                          href={`/admin/growth-groups/${gc.id}/edit`}
                          aria-label={`Editar ${gc.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>

                      {gc.status === 'active' ? (
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                          <Link
                            href={`/admin/growth-groups/${gc.id}/multiply`}
                            aria-label={`Multiplicar ${gc.name}`}
                          >
                            <GitFork className="h-4 w-4" />
                          </Link>
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" disabled className="h-8 w-8">
                          <GitFork className="h-4 w-4" />
                        </Button>
                      )}

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={
                              gc.status !== 'active' || processingId === gc.id || isPending
                            }
                            aria-label={`Inativar ${gc.name}`}
                          >
                            <Ban className="h-4 w-4 text-warn" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Inativar GC?</AlertDialogTitle>
                            <AlertDialogDescription>
                              O GC <strong>{gc.name}</strong> sairá dos fluxos ativos do
                              sistema, mas seu histórico será preservado.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleInactivate(gc.id, gc.name)}
                              className="bg-warn text-white hover:bg-warn/90"
                            >
                              {processingId === gc.id ? 'Inativando…' : 'Inativar'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                }
              />
            );
          })}
        </div>
      )}

      <p className="px-1 text-xs text-muted-foreground">
        Mostrando {filtered.length} de {gcs.length} GCs
      </p>
    </div>
  );
}
