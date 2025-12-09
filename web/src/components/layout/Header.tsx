'use client';

import Link from 'next/link';
import { Logo } from './Logo';
import { LogoutButton } from '@/components/auth/LogoutButton';

interface HeaderProps {
  userName?: string;
  userEmail?: string;
  roleBadges?: string[];
}

const navItems = [
  { href: '/gc', label: 'GC' },
  { href: '/participants', label: 'Participantes' },
  { href: '/visitors', label: 'Visitantes' },
  { href: '/lessons', label: 'Lições' },
];

export function Header({ userName, userEmail, roleBadges = [] }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        {/* Logo clicável para home */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center">
            <Logo className="h-10" />
          </Link>

          {/* Navegação principal */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Informações do usuário à direita */}
        <div className="flex items-center gap-3">
          <div className="hidden flex-col items-end md:flex">
            <span className="text-sm font-semibold text-slate-800">
              {userName ?? userEmail}
            </span>
            <span className="text-xs text-slate-500">
              {roleBadges.length ? roleBadges.join(' • ') : 'Acesso autenticado'}
            </span>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
