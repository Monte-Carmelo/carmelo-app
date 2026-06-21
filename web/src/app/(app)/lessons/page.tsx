import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';
import { getAllSeriesWithLessons } from '@/lib/api/lessons';
import { Loading } from '@/components/ui/spinner';
import { ScreenHeader } from '@/components/ui/screen-header';
import { EmptyState } from '@/components/ui/empty-state';
import { BookOpen, ExternalLink, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const COVER_TONES = [
  'bg-brand-soft text-brand-soft-fg',
  'bg-sage/35 text-forest',
  'bg-clay/[0.18] text-[#8A4A2C]',
] as const;

async function LessonsCatalogLoader() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = await createSupabaseServerClient();

  const seriesWithLessons = await getAllSeriesWithLessons(supabase);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
      <ScreenHeader
        title="Catálogo de Lições"
        subtitle="Explore as lições disponíveis organizadas por série."
      />

      {seriesWithLessons.length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title="Nenhuma série de lições cadastrada ainda."
        />
      ) : (
        <div className="space-y-5">
          {seriesWithLessons.map((series, seriesIndex) => (
            <article key={series.id} className="overflow-hidden rounded-card bg-white shadow-sm">
              <div className="flex items-start gap-3.5 p-3.5">
                <div
                  className={`flex h-[72px] w-14 shrink-0 items-center justify-center rounded-lg ${
                    COVER_TONES[seriesIndex % COVER_TONES.length]
                  }`}
                >
                  <BookOpen className="h-6 w-6" />
                </div>

                <div className="min-w-0 flex-1 py-0.5">
                  <h2 className="text-[14.5px] font-bold leading-tight text-foreground">
                    {series.name}
                  </h2>
                  {series.description && (
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                      {series.description}
                    </p>
                  )}
                </div>

                <Badge variant="neutral" className="whitespace-nowrap">
                  {series.lessons.length} {series.lessons.length === 1 ? 'lição' : 'lições'}
                </Badge>
              </div>

              {series.lessons.length === 0 ? (
                <div className="border-t border-divider px-6 py-8 text-center text-sm text-muted-foreground">
                  Nenhuma lição cadastrada nesta série ainda.
                </div>
              ) : (
                <div className="divide-y divide-divider border-t border-divider">
                  {series.lessons.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-4 px-4 py-3.5 transition-colors duration-fast ease-out-soft hover:bg-paper-deep/50"
                    >
                      <Link
                        href={`/lessons/${lesson.id}`}
                        className="flex min-w-0 flex-1 items-center gap-4"
                      >
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand-soft-fg">
                          {lesson.order_in_series ?? index + 1}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="text-[14.5px] font-bold leading-tight text-foreground">
                            {lesson.title}
                          </h3>
                          {lesson.description && (
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {lesson.description}
                            </p>
                          )}
                        </div>
                      </Link>

                      <div className="flex items-center gap-2">
                        {lesson.link && (
                          <a
                            href={lesson.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 rounded-full bg-paper-deep px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-sand"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Acessar</span>
                          </a>
                        )}
                        <Link
                          href={`/lessons/${lesson.id}`}
                          aria-label={`Abrir ${lesson.title}`}
                          className="text-slate-400 transition-colors hover:text-slate-600"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function LessonsPage() {
  return (
    <Suspense fallback={<Loading message="Carregando catálogo de lições..." />}>
      <LessonsCatalogLoader />
    </Suspense>
  );
}
