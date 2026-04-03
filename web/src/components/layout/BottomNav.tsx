'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, BookOpen, CalendarPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/gc', label: 'GC', icon: Users },
  { href: '/meetings/new', label: 'Reunião', icon: CalendarPlus, highlight: true },
  { href: '/lessons', label: 'Lições', icon: BookOpen },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors',
                item.highlight && !isActive
                  ? 'text-blue-600'
                  : isActive
                    ? 'text-slate-900'
                    : 'text-slate-400',
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5',
                  item.highlight && !isActive && 'text-blue-600',
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
