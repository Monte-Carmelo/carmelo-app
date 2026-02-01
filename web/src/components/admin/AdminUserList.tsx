'use client';

import { useState, useTransition, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { deleteUser } from '@/app/(app)/admin/actions';
import { Loading } from '@/components/ui/spinner';
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
import { toast } from 'sonner';

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
  currentUserId?: string;
  users?: AdminUserSummary[];
}

export function AdminUserList({ currentUserId: propCurrentUserId, users: propUsers }: AdminUserListProps) {
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [users, setUsers] = useState<AdminUserSummary[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'gcs'>('name');

  useEffect(() => {
    async function loadUsers() {
      if (propCurrentUserId && propUsers) {
        // Use props if provided (for backwards compatibility)
        setCurrentUserId(propCurrentUserId);
        setUsers(propUsers);
        setLoading(false);
        return;
      }

      // Otherwise, fetch data
      try {
        const supabase = getSupabaseBrowserClient();

        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          router.push('/login');
          return;
        }
        setCurrentUserId(session.user.id);

        const [rolesResult, phonesResult] = await Promise.all([
          supabase
            .from('user_gc_roles')
            .select(
              'user_id, name, email, is_admin, is_leader, is_supervisor, is_coordinator, gcs_led, gcs_supervised, direct_subordinates',
            )
            .order('name', { ascending: true }),
          supabase
            .from('users')
            .select('id, people:person_id ( phone )')
            .is('deleted_at', null),
        ]);

        if (rolesResult.error) {
          console.error('Error fetching user roles:', rolesResult.error);
          toast.error('Erro ao carregar usuários.');
          return;
        }

        if (phonesResult.error) {
          console.error('Error fetching user phones:', phonesResult.error);
          toast.error('Erro ao carregar usuários.');
          return;
        }

        const phoneByUserId = new Map(
          (phonesResult.data || [])
            .filter((user) => Boolean(user.id))
            .map((user) => [user.id, user.people?.phone ?? null]),
        );

        const processedUsers: AdminUserSummary[] = (rolesResult.data || [])
          .filter((row) => Boolean(row.user_id))
          .map((row) => ({
            id: row.user_id as string,
            name: row.name || 'Nome não definido',
            email: row.email || null,
            phone: phoneByUserId.get(row.user_id as string) ?? null,
            isAdmin: row.is_admin ?? false,
            isLeader: row.is_leader ?? false,
            isSupervisor: row.is_supervisor ?? false,
            isCoordinator: row.is_coordinator ?? false,
            gcsLed: row.gcs_led ?? 0,
            gcsSupervised: row.gcs_supervised ?? 0,
            directSubordinates: row.direct_subordinates ?? 0,
          }));

        setUsers(processedUsers);
      } catch (error) {
        console.error('Error loading users:', error);
        toast.error('Erro ao carregar usuários.');
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, [propCurrentUserId, propUsers, router]);

  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (user) =>
          user.name.toLowerCase().includes(term) ||
          user.email?.toLowerCase().includes(term)
      );
    }

    // Filter by role
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

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'email') {
        return (a.email || '').localeCompare(b.email || '');
      } else if (sortBy === 'gcs') {
        return b.gcsLed - a.gcsLed;
      }
      return 0;
    });

    return result;
  }, [users, searchTerm, roleFilter, sortBy]);

  const handleDelete = (userId: string, userName: string) => {
    if (processingId || isPending) {
      return;
    }

    setProcessingId(userId);

    startTransition(() => {
      deleteUser(userId)
        .then((result) => {
          if (result.success) {
            toast.success(`Usuário "${userName}" removido com sucesso!`);
            router.refresh();
          } else {
            toast.error(result.error ?? 'Não foi possível remover o usuário.');
          }
        })
        .catch(() => {
          toast.error('Não foi possível remover o usuário.');
        })
        .finally(() => {
          setProcessingId(null);
        });
    });
  };

  if (loading) {
    return <Loading message="Carregando usuários..." />;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Buscar por nome ou e-mail..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="md:w-64"
        />
        <div className="flex gap-2">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Papel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="leader">Líder</SelectItem>
              <SelectItem value="supervisor">Supervisor</SelectItem>
              <SelectItem value="coordinator">Coordenador</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nome (A-Z)</SelectItem>
              <SelectItem value="email">E-mail</SelectItem>
              <SelectItem value="gcs">Mais GCs</SelectItem>
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
              <TableHead>E-mail</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Papéis</TableHead>
              <TableHead className="text-right">GCs Liderados</TableHead>
              <TableHead className="text-right">GCs Supervisionados</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-slate-500">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedUsers.map((user) => {
                const roleLabels: string[] = [];
                if (user.isAdmin) roleLabels.push('Admin');
                if (user.isLeader) roleLabels.push('Líder');
                if (user.isSupervisor) roleLabels.push('Supervisor');
                if (user.isCoordinator) roleLabels.push('Coordenador');

                return (
                  <TableRow key={user.id} data-testid="user-row">
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email || '-'}</TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell>
                      {roleLabels.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {roleLabels.map((role) => (
                            <span
                              key={role}
                              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                role === 'Admin'
                                  ? 'bg-purple-100 text-purple-800'
                                  : role === 'Líder'
                                    ? 'bg-blue-100 text-blue-800'
                                    : role === 'Supervisor'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-orange-100 text-orange-800'
                              }`}
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{user.gcsLed}</TableCell>
                    <TableCell className="text-right">{user.gcsSupervised}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/users/${user.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={user.id === currentUserId || processingId === user.id}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja remover o usuário <strong>{user.name}</strong>?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(user.id, user.name)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {processingId === user.id ? 'Removendo...' : 'Remover'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
