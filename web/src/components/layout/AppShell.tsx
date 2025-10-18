'use client';

import { useSession } from '@/lib/auth/session-context';
import { Header } from './Header';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { session, roles } = useSession();

  const roleBadges: string[] = [];
  if (roles?.is_leader) roleBadges.push('Líder');
  if (roles?.is_supervisor) roleBadges.push('Supervisor');
  if (roles?.is_coordinator) roleBadges.push('Coordenador');
  if (session.user?.email && roles?.is_admin) roleBadges.push('Admin');

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header
        userName={roles?.name ?? undefined}
        userEmail={session.user.email}
        roleBadges={roleBadges}
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
