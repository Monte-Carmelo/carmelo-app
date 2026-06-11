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
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-divider bg-[rgba(255,253,248,0.85)] pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150 md:hidden">
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
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors duration-fast ease-out-soft active:scale-95',
                isActive || item.highlight ? 'text-primary' : 'text-slate-500',
              )}
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.2 : 1.7} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
