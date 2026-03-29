'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Users, Building, BookOpen, BarChart, Settings, X, Calendar, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AdminSidebarProps {
  onClose?: () => void;
}

const navItems = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: Shield,
    description: 'Visão geral e métricas',
  },
  {
    label: 'Usuários',
    href: '/admin/users',
    icon: Users,
    description: 'Gerenciar usuários do sistema',
  },
  {
    label: 'Grupos de Crescimento',
    href: '/admin/growth-groups',
    icon: Building,
    description: 'Gerenciar GCs',
  },
  {
    label: 'Eventos',
    href: '/admin/events',
    icon: Calendar,
    description: 'Gerenciar eventos da igreja',
  },
  {
    label: 'Lições',
    href: '/admin/lessons',
    icon: BookOpen,
    description: 'Séries e lições',
  },
  {
    label: 'Relatórios',
    href: '/admin/reports',
    icon: BarChart,
    description: 'Analytics e métricas',
  },
  {
    label: 'Configurações',
    href: '/admin/settings',
    icon: Settings,
    description: 'Configurações do sistema',
  },
];

export function AdminSidebar({ onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        cache: 'no-store',
      });
    } finally {
      window.location.assign('/login');
    }
  };

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="flex h-full flex-col border-r border-slate-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Área Admin</h2>
          <p className="text-xs text-slate-500">Gestão do sistema</p>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="md:hidden"
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
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <div className="flex-1">
                <div className={cn(active ? 'text-primary-foreground' : 'text-slate-900')}>
                  {item.label}
                </div>
                <div
                  className={cn(
                    'text-xs',
                    active ? 'text-primary-foreground/80' : 'text-slate-500'
                  )}
                >
                  {item.description}
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 px-6 py-4">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span>{isLoggingOut ? 'Saindo...' : 'Sair'}</span>
        </button>
        <p className="mt-2 text-xs text-slate-500">
          Carmelo App Admin
          <br />
          v1.0.0
        </p>
      </div>
    </div>
  );
}
