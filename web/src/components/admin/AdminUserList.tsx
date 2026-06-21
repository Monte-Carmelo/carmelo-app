'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, UserX } from 'lucide-react';
import { inactivateUser } from '@/app/(app)/admin/actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { ListItem } from '@/components/ui/list-item';
import { SearchField } from '@/components/ui/search-field';
import { FilterChips } from '@/components/ui/filter-chips';
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
import { toast } from 'sonner';
import type { BadgeProps } from '@/components/ui/badge';

export interface AdminUserSummary {
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

const ROLE_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'admin', label: 'Admin' },
  { id: 'leader', label: 'Líderes' },
  { id: 'supervisor', label: 'Supervisores' },
  { id: 'coordinator', label: 'Coordenadores' },
];

const ROLE_VARIANT: Record<string, BadgeProps['variant']> = {
  Admin: 'clay',
  Líder: 'default',
  Supervisor: 'success',
  Coordenador: 'sage',
};

function rolesOf(user: AdminUserSummary): string[] {
  const labels: string[] = [];
  if (user.isAdmin) labels.push('Admin');
  if (user.isLeader) labels.push('Líder');
  if (user.isSupervisor) labels.push('Supervisor');
  if (user.isCoordinator) labels.push('Coordenador');
  return labels;
}

export function AdminUserList({ currentUserId, users }: AdminUserListProps) {
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    let result = [...users];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (user) =>
          user.name.toLowerCase().includes(term) ||
          user.email?.toLowerCase().includes(term),
      );
    }

    if (roleFilter !== 'all') {
      result = result.filter((user) => {
        switch (roleFilter) {
          case 'admin':
            return user.isAdmin;
          case 'leader':
            return user.isLeader;
          case 'supervisor':
            return user.isSupervisor;
          case 'coordinator':
            return user.isCoordinator;
          default:
            return true;
        }
      });
    }

    result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [users, searchTerm, roleFilter]);

  const handleInactivate = (userId: string, userName: string) => {
    if (processingId || isPending) return;
    setProcessingId(userId);

    startTransition(() => {
      inactivateUser(userId)
        .then((result) => {
          if (result.success) {
            toast.success(`Usuário "${userName}" inativado com sucesso.`);
            router.refresh();
          } else {
            toast.error(result.error ?? 'Não foi possível inativar o usuário.');
          }
        })
        .catch(() => {
          toast.error('Não foi possível inativar o usuário.');
        })
        .finally(() => {
          setProcessingId(null);
        });
    });
  };

  return (
    <div className="space-y-3">
      <SearchField
        placeholder="Buscar por nome ou e-mail"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
      />

      <FilterChips options={ROLE_FILTERS} value={roleFilter} onValueChange={setRoleFilter} />

      {filtered.length === 0 ? (
        <div className="rounded-card bg-white px-4 py-8 text-center text-sm text-muted-foreground shadow-sm">
          Nenhum usuário encontrado.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((user) => {
            const roles = rolesOf(user);

            return (
              <ListItem
                key={user.id}
                data-testid="user-row"
                leading={<Avatar name={user.name} />}
                title={user.name}
                subtitle={user.email || user.phone || 'Sem contato cadastrado'}
                trailing={
                  <div className="flex items-center gap-1.5">
                    <div className="hidden flex-wrap justify-end gap-1 sm:flex">
                      {roles.length > 0 ? (
                        roles.map((role) => (
                          <Badge key={role} variant={ROLE_VARIANT[role] ?? 'neutral'}>
                            {role}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </div>

                    <div className="flex items-center">
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                        <Link href={`/admin/users/${user.id}`} aria-label={`Editar ${user.name}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={
                              user.id === currentUserId ||
                              processingId === user.id ||
                              isPending
                            }
                            aria-label={`Inativar ${user.name}`}
                          >
                            <UserX className="h-4 w-4 text-warn" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Inativar usuário?</AlertDialogTitle>
                            <AlertDialogDescription>
                              O usuário <strong>{user.name}</strong> perderá acesso ao
                              sistema e seus vínculos ativos com GCs serão encerrados.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleInactivate(user.id, user.name)}
                              className="bg-warn text-white hover:bg-warn/90"
                            >
                              {processingId === user.id ? 'Inativando…' : 'Inativar'}
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
        Mostrando {filtered.length} de {users.length} usuários
      </p>
    </div>
  );
}
