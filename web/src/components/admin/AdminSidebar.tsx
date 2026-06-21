'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building,
  BookOpen,
  BarChart3,
  Settings,
  X,
  Calendar,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/layout/Logo';

interface AdminSidebarProps {
  onClose?: () => void;
}

const navItems = [
  { label: 'Painel', href: '/admin', icon: LayoutDashboard },
  { label: 'Usuários', href: '/admin/users', icon: Users },
  { label: 'GCs', href: '/admin/growth-groups', icon: Building },
  { label: 'Eventos', href: '/admin/events', icon: Calendar },
  { label: 'Lições', href: '/admin/lessons', icon: BookOpen },
  { label: 'Relatórios', href: '/admin/reports', icon: BarChart3 },
  { label: 'Configurações', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar({ onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        cache: 'no-store',
      });

      if (response.ok) {
        window.location.assign('/login');
      } else {
        console.error('Logout failed:', response.status, response.statusText);
        alert('Erro ao fazer logout. Por favor, tente novamente.');
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error('Logout error:', error);
      alert('Erro ao fazer logout. Por favor, tente novamente.');
      setIsLoggingOut(false);
    }
  };

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="flex h-full flex-col border-r border-border bg-white">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <Link href="/admin" onClick={onClose} className="flex items-center">
            <Logo className="h-8" />
          </Link>
          <p className="eyebrow mt-2">Área do pastor</p>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="md:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors duration-fast ease-out-soft',
                active
                  ? 'bg-brand-soft text-brand-soft-fg'
                  : 'text-slate-600 hover:bg-paper-deep hover:text-slate-900',
              )}
            >
              <Icon
                className="h-[18px] w-[18px] flex-shrink-0"
                strokeWidth={active ? 2.2 : 1.8}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-5 py-4">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors duration-fast ease-out-soft hover:bg-paper-deep hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <LogOut className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={1.8} />
          <span>{isLoggingOut ? 'Saindo…' : 'Sair'}</span>
        </button>
        <p className="tipograma mt-3 px-3 text-[10px]">Igreja Monte Carmelo</p>
        <p className="mt-1 px-3 text-[11px] text-muted-foreground">v1.0.0</p>
      </div>
    </div>
  );
}
