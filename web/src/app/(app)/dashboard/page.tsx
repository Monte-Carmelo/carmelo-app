import { Users, Calendar, BookOpen, UserCheck } from 'lucide-react';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';

export default function DashboardPage() {
  const navigationItems = [
    { title: 'GC', icon: Users, href: '/gc', description: 'Grupos de Crescimento' },
    { title: 'Reuniões', icon: Calendar, href: '/meetings', description: 'Reuniões e atividades' },
    { title: 'Participantes', icon: UserCheck, href: '/participants', description: 'Membros dos grupos' },
    { title: 'Visitantes', icon: BookOpen, href: '/visitors', description: 'Visitantes e interessados' },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <h1 className="mb-8 text-2xl font-semibold text-text-dark md:text-3xl">
          Bem-vindo
        </h1>
        <DashboardGrid items={navigationItems} />
      </div>
    </main>
  );
}
