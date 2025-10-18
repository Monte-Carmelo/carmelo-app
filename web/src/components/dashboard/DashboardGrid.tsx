import { LucideIcon } from 'lucide-react';
import { NavigationCard } from './NavigationCard';

interface DashboardGridProps {
  items: Array<{
    title: string;
    icon: LucideIcon;
    href: string;
    description?: string;
  }>;
}

export function DashboardGrid({ items }: DashboardGridProps) {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-6">
        {items.map((item) => (
          <NavigationCard
            key={item.href}
            title={item.title}
            icon={item.icon}
            href={item.href}
            description={item.description}
          />
        ))}
      </div>
    </div>
  );
}
