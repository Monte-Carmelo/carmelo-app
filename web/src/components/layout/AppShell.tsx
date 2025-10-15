'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { useSession } from '@/lib/auth/session-context';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { session, roles } = useSession();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/meetings', label: 'Reuniões' },
    { href: '/participants', label: 'Participantes' },
    { href: '/visitors', label: 'Visitantes' },
  ];

  if (roles?.is_supervisor || roles?.is_coordinator || roles?.is_admin) {
    navItems.push({ href: '/supervision', label: 'Supervisão' });
  }

  if (roles?.is_admin) {
    navItems.push({ href: '/admin', label: 'Administração' });
  }

  const roleBadges: string[] = [];
  if (roles?.is_leader) roleBadges.push('Líder');
  if (roles?.is_supervisor) roleBadges.push('Supervisor');
  if (roles?.is_coordinator) roleBadges.push('Coordenador');
  if (session.user?.email && roles?.is_admin) roleBadges.push('Admin');

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-lg font-semibold text-primary">
              Carmelo
            </Link>
            <nav className="hidden gap-4 text-sm font-medium text-slate-600 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx('rounded-full px-3 py-1.5 transition', {
                    'bg-primary/10 text-primary': pathname.startsWith(item.href),
                    'hover:bg-slate-100': !pathname.startsWith(item.href),
                  })}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-800">{roles?.name ?? session.user.email}</span>
              <span className="text-xs text-slate-500">
                {roleBadges.length ? roleBadges.join(' • ') : 'Acesso autenticado'}
              </span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
