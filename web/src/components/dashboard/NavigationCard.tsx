import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface NavigationCardProps {
  title: string;
  icon: LucideIcon;
  href: string;
  description?: string;
}

export function NavigationCard({ title, icon: Icon, href, description }: NavigationCardProps) {
  return (
    <Link href={href} className="block">
      <Card className="flex min-h-[150px] flex-col items-center justify-center gap-4 p-6 transition-shadow hover:shadow-lg md:min-h-[200px]">
        <Icon className="h-12 w-12 text-primary transition-transform hover:scale-105 md:h-16 md:w-16" />

        <div className="text-center">
          <h3 className="text-lg font-semibold text-text-dark">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-text-light">{description}</p>
          )}
        </div>
      </Card>
    </Link>
  );
}
