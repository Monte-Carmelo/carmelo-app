import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';
import { getLessonById } from '@/lib/api/lessons';
import { Loading } from '@/components/ui/spinner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, ExternalLink, ChevronLeft } from 'lucide-react';

async function LessonDetailContent({ id }: { id: string }) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = await createSupabaseServerClient();
  const lesson = await getLessonById(supabase, id);

  if (!lesson) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/lessons" className="flex items-center gap-1 text-primary hover:underline">
          <ChevronLeft className="h-4 w-4" />
          Catálogo de Lições
        </Link>
        {lesson.series && (
          <>
            <span>/</span>
            <span>{lesson.series.name}</span>
          </>
        )}
      </div>

      <header className="space-y-3">
        <div className="flex items-start gap-3">
          {lesson.order_in_series && (
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
              {lesson.order_in_series}
            </div>
          )}
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-slate-900">{lesson.title}</h1>
            {lesson.series && (
              <Badge variant="outline">{lesson.series.name}</Badge>
            )}
          </div>
        </div>
      </header>

      {lesson.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {lesson.description}
            </p>
          </CardContent>
        </Card>
      )}

      {lesson.link && (
        <a
          href={lesson.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-lg border border-primary bg-primary/5 px-4 py-3 text-sm font-medium text-primary transition hover:bg-primary/10"
        >
          <ExternalLink className="h-4 w-4" />
          Acessar conteúdo da lição
        </a>
      )}

      {!lesson.description && !lesson.link && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="mb-4 h-12 w-12 text-slate-300" />
            <p className="text-center text-sm text-slate-500">
              Esta lição ainda não possui descrição ou link de conteúdo.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default async function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<Loading message="Carregando lição..." />}>
      <LessonDetailContent id={id} />
    </Suspense>
  );
}
