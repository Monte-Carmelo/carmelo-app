import Link from 'next/link';
import type { ReactNode } from 'react';

export interface HeroAction {
  label: string;
  href: string;
  description?: string;
}

export interface HeroProps {
  eyebrow?: string;
  title: string;
  description: ReactNode;
  primaryAction: HeroAction;
  secondaryAction?: HeroAction;
  highlight?: string[];
}

export function Hero({
  eyebrow = 'Carmelo Web',
  title,
  description,
  primaryAction,
  secondaryAction,
  highlight = [],
}: HeroProps) {
  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-12">
      <span className="text-sm font-semibold uppercase tracking-wide text-primary">{eyebrow}</span>
      <h1 className="text-balance text-4xl font-semibold text-slate-900 md:text-5xl">{title}</h1>
      <div className="text-base text-slate-600 md:text-lg">{description}</div>
      <div className="flex flex-wrap gap-3">
        <Link
          href={primaryAction.href}
          className="inline-flex items-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110"
        >
          {primaryAction.label}
        </Link>
        {secondaryAction ? (
          <Link
            href={secondaryAction.href}
            className="inline-flex items-center rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            {secondaryAction.label}
          </Link>
        ) : null}
      </div>
      {highlight.length ? (
        <ul className="mt-2 grid gap-2 text-sm text-slate-500 md:grid-cols-2">
          {highlight.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-primary" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
