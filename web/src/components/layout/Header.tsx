'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, Users, BookOpen, UserPlus, UserCheck } from 'lucide-react';
import { Logo } from './Logo';
import { LogoutButton } from '@/components/auth/LogoutButton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface HeaderProps {
  userName?: string;
  userEmail?: string;
  roleBadges?: string[];
}

const navItems = [
  { href: '/gc', label: 'GC', icon: Users },
  { href: '/participants', label: 'Participantes', icon: UserCheck },
  { href: '/visitors', label: 'Visitantes', icon: UserPlus },
  { href: '/lessons', label: 'Lições', icon: BookOpen },
];

export function Header({ userName, userEmail, roleBadges = [] }: HeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-6">
          {/* Hamburger — mobile only */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>

            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="border-b px-6 py-4">
                <SheetTitle className="text-left">
                  <Logo className="h-8" />
                </SheetTitle>
              </SheetHeader>

              {/* User info */}
              <div className="border-b px-6 py-3">
                <p className="text-sm font-semibold text-slate-800">
                  {userName ?? userEmail}
                </p>
                <p className="text-xs text-slate-500">
                  {roleBadges.length ? roleBadges.join(' · ') : 'Acesso autenticado'}
                </p>
              </div>

              {/* Nav links */}
              <nav className="flex flex-col gap-1 px-3 py-3">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-slate-100 text-slate-900'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Logout at bottom */}
              <div className="mt-auto border-t px-6 py-4">
                <LogoutButton />
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/dashboard" className="flex items-center">
            <Logo className="h-10" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Desktop user info + logout */}
        <div className="flex items-center gap-3">
          <div className="hidden flex-col items-end md:flex">
            <span className="text-sm font-semibold text-slate-800">
              {userName ?? userEmail}
            </span>
            <span className="text-xs text-slate-500">
              {roleBadges.length ? roleBadges.join(' · ') : 'Acesso autenticado'}
            </span>
          </div>
          <div className="hidden md:block">
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
