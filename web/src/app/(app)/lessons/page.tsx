import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';
import { getRecentSeriesWithLessons } from '@/lib/api/lessons';
import { Loading } from '@/components/ui/spinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

async function LessonsCatalogLoader() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = await createSupabaseServerClient();

  const seriesWithLessons = await getRecentSeriesWithLessons(supabase, 2);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="flex items-center gap-2 text-3xl font-semibold text-slate-900">
          <BookOpen className="h-8 w-8 text-primary" />
          Catálogo de Lições
        </h1>
        <p className="text-sm text-slate-600">
          Explore as lições disponíveis organizadas por série. Exibindo as 2 séries mais recentes.
        </p>
      </header>

      {seriesWithLessons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="mb-4 h-12 w-12 text-slate-300" />
            <p className="text-center text-slate-500">Nenhuma série de lições cadastrada ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {seriesWithLessons.map((series) => (
            <Card key={series.id} className="overflow-hidden">
              <CardHeader className="bg-slate-50">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{series.name}</CardTitle>
                    {series.description && (
                      <CardDescription className="mt-2">{series.description}</CardDescription>
                    )}
                  </div>
                  <Badge variant="outline" className="ml-4 whitespace-nowrap">
                    {series.lessons.length} {series.lessons.length === 1 ? 'lição' : 'lições'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {series.lessons.length === 0 ? (
                  <div className="px-6 py-8 text-center text-sm text-slate-500">
                    Nenhuma lição cadastrada nesta série ainda.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {series.lessons.map((lesson, index) => (
                      <div
                        key={lesson.id}
                        className="flex items-start gap-4 px-6 py-4 transition hover:bg-slate-50"
                      >
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {lesson.order_in_series ?? index + 1}
                        </div>

                        <div className="flex-1 space-y-1">
                          <h3 className="font-medium text-slate-900">{lesson.title}</h3>
                          {lesson.description && (
                            <p className="text-sm text-slate-600">{lesson.description}</p>
                          )}
                        </div>

                        {lesson.link && (
                          <a
                            href={lesson.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Acessar
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
