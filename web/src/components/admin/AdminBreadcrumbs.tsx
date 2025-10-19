'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { Fragment } from 'react';

const segmentLabels: Record<string, string> = {
  admin: 'Admin',
  users: 'Usuários',
  'growth-groups': 'Grupos de Crescimento',
  lessons: 'Lições',
  reports: 'Relatórios',
  settings: 'Configurações',
  new: 'Novo',
  edit: 'Editar',
  multiply: 'Multiplicar',
  series: 'Séries',
  growth: 'Crescimento',
  attendance: 'Frequência',
  conversions: 'Conversões',
};

interface Breadcrumb {
  label: string;
  href: string;
}

export function AdminBreadcrumbs() {
  const pathname = usePathname();

  if (!pathname) return null;

  const segments = pathname.split('/').filter(Boolean);

  // Generate breadcrumbs
  const breadcrumbs: Breadcrumb[] = [];
  let currentPath = '';

  segments.forEach((segment) => {
    currentPath += `/${segment}`;

    // Skip UUIDs (dynamic routes)
    if (
      segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    ) {
      return;
    }

    const label = segmentLabels[segment] || segment;

    breadcrumbs.push({
      label,
      href: currentPath,
    });
  });

  if (breadcrumbs.length === 0) return null;

  return (
    <nav className="mb-4 flex items-center space-x-1 text-sm text-slate-600">
      <Link
        href="/admin"
        className="flex items-center gap-1 hover:text-slate-900 transition-colors"
      >
        <Home className="h-4 w-4" />
        <span className="sr-only">Home</span>
      </Link>

      {breadcrumbs.map((breadcrumb, index) => {
        const isLast = index === breadcrumbs.length - 1;

        return (
          <Fragment key={breadcrumb.href}>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            {isLast ? (
              <span className="font-medium text-slate-900">{breadcrumb.label}</span>
            ) : (
              <Link
                href={breadcrumb.href}
                className="hover:text-slate-900 transition-colors"
              >
                {breadcrumb.label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
