import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus, Users } from 'lucide-react';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';
import { AdminUserList } from '@/components/admin/AdminUserList';
import { AdminBreadcrumbs } from '@/components/admin/AdminBreadcrumbs';
import { Loading } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

async function AdminUsersContent() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Usuários</h1>
          <p className="text-slate-600 mt-1">Gerencie os usuários e seus acessos ao sistema</p>
        </div>
        <Link href="/admin/users/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        </Link>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Todos os Usuários
          </CardTitle>
          <CardDescription>
            Lista completa de usuários cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminUserList />
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<Loading message="Carregando usuários..." />}>
      <AdminUsersContent />
    </Suspense>
  );
}
