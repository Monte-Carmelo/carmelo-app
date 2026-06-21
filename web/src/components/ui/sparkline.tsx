import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Sparkline do Monte Carmelo DS — mini gráfico de linha (presença ao longo
 * dos últimos encontros) em SVG, na cor da marca via `currentColor`.
 */
export interface SparklineProps extends React.SVGAttributes<SVGSVGElement> {
  data: number[];
  width?: number;
  height?: number;
  showDots?: boolean;
}

export function Sparkline({
  data,
  width = 240,
  height = 60,
  showDots = true,
  className,
  ...props
}: SparklineProps) {
  if (data.length === 0) return null;

  const max = Math.max(...data, 1);
  const pad = 4;
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;
  const points = data.map((value, index) => {
    const x = index * stepX;
    const y = height - (value / max) * (height - pad * 2) - pad;
    return [x, y] as const;
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('block w-full text-brand', className)}
      style={{ height }}
      aria-hidden
      {...props}
    >
      <polyline
        points={points.map(([x, y]) => `${x},${y}`).join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {showDots &&
        points.map(([x, y], index) => (
          <circle key={index} cx={x} cy={y} r={2.5} fill="currentColor" />
        ))}
    </svg>
  );
}
