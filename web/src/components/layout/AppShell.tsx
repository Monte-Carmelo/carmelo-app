'use client';

import { usePathname } from 'next/navigation';
import { useSession } from '@/lib/auth/session-context';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, roles } = useSession();

  // A área do admin tem o próprio chrome (AdminShell). Evita navegação dupla.
  if (pathname?.startsWith('/admin')) {
    return <>{children}</>;
  }

  const roleBadges: string[] = [];
  if (roles?.is_leader) roleBadges.push('Líder');
  if (roles?.is_supervisor) roleBadges.push('Supervisor');
  if (roles?.is_coordinator) roleBadges.push('Coordenador');
  if (user.email && roles?.is_admin) roleBadges.push('Admin');

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header
        userName={roles?.name ?? undefined}
        userEmail={user.email}
        roleBadges={roleBadges}
      />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
