import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

const TILE_TONES = [
  'bg-brand-soft text-brand-soft-fg',
  'bg-sage/35 text-forest',
  'bg-clay/[0.18] text-[#8A4A2C]',
  'bg-brand-soft text-brand-soft-fg',
] as const;

interface NavigationCardProps {
  title: string;
  icon: LucideIcon;
  href: string;
  description?: string;
  toneIndex?: number;
}

export function NavigationCard({ title, icon: Icon, href, description, toneIndex = 0 }: NavigationCardProps) {
  const tone = TILE_TONES[toneIndex % TILE_TONES.length];

  return (
    <Link href={href} className="block">
      <Card className="flex min-h-[150px] flex-col items-center justify-center gap-4 p-6 transition-shadow duration-base ease-out-soft hover:shadow-lg md:min-h-[200px]">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-6 w-6" />
        </div>

        <div className="text-center">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </Card>
    </Link>
  );
}
