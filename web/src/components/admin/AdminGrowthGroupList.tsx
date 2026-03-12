'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { Ban, Pencil, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { inactivateGrowthGroupAction } from '@/app/(app)/admin/growth-groups/actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

const statusLabels: Record<string, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  multiplying: 'Multiplicando',
  multiplied: 'Multiplicado',
};

export function AdminGrowthGroupList({ gcs }: AdminGrowthGroupListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'members'>('name');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredAndSortedGcs = useMemo(() => {
    let result = [...gcs];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((gc) => gc.name.toLowerCase().includes(term));
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter((gc) => gc.status === statusFilter);
    }

    // Filter by mode
    if (modeFilter !== 'all') {
      result = result.filter((gc) => gc.mode === modeFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'members') {
        return b.memberCount - a.memberCount;
      } else {
        // Sort by created date would need a createdAt field
        return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [gcs, searchTerm, statusFilter, modeFilter, sortBy]);

  const handleInactivate = (gcId: string, gcName: string) => {
    if (processingId || isPending) {
      return;
    }

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
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Buscar por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="md:w-64"
        />
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
              <SelectItem value="multiplying">Multiplicando</SelectItem>
              <SelectItem value="multiplied">Multiplicado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={modeFilter} onValueChange={setModeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Modo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="in_person">Presencial</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="hybrid">Híbrido</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nome (A-Z)</SelectItem>
              <SelectItem value="members">Mais membros</SelectItem>
              <SelectItem value="created">Mais recentes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Líder(es)</TableHead>
              <TableHead>Supervisor(es)</TableHead>
              <TableHead>Modo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Membros</TableHead>
              <TableHead>Última Reunião</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedGcs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-slate-500">
                  Nenhum GC encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedGcs.map((gc) => (
                <TableRow key={gc.id} data-testid="gc-card">
                  <TableCell className="font-medium">{gc.name}</TableCell>
                  <TableCell>
                    {gc.leaders.length > 0 ? gc.leaders.join(', ') : '-'}
                  </TableCell>
                  <TableCell>
                    {gc.supervisors.length > 0 ? gc.supervisors.join(', ') : '-'}
                  </TableCell>
                  <TableCell>{modeLabels[gc.mode]}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        gc.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : gc.status === 'multiplying' || gc.status === 'multiplied'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {statusLabels[gc.status]}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{gc.memberCount}</TableCell>
                  <TableCell>
                    {gc.lastMeetingDate
                      ? new Date(gc.lastMeetingDate).toLocaleDateString('pt-BR')
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/growth-groups/${gc.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                      </Link>
                      {gc.status === 'active' ? (
                        <Link href={`/admin/growth-groups/${gc.id}/multiply`}>
                          <Button variant="ghost" size="icon">
                            <Users className="h-4 w-4" />
                            <span className="sr-only">Multiplicar</span>
                          </Button>
                        </Link>
                      ) : (
                        <Button variant="ghost" size="icon" disabled>
                          <Users className="h-4 w-4" />
                          <span className="sr-only">Multiplicar</span>
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={gc.status !== 'active' || processingId === gc.id || isPending}
                          >
                            <Ban className="h-4 w-4 text-amber-700" />
                            <span className="sr-only">Inativar</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Inativar GC?</AlertDialogTitle>
                            <AlertDialogDescription>
                              O GC <strong>{gc.name}</strong> sairá dos fluxos ativos do sistema, mas seu histórico será preservado.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleInactivate(gc.id, gc.name)}
                              className="bg-amber-700 hover:bg-amber-800"
                            >
                              {processingId === gc.id ? 'Inativando...' : 'Inativar'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="text-sm text-slate-600">
        Mostrando {filteredAndSortedGcs.length} de {gcs.length} GCs
      </div>
    </div>
  );
}
