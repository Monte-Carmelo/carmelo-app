import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { getAuthenticatedUser } from '@/lib/supabase/server-auth';
import { getLessonById } from '@/lib/api/lessons';
import { Loading } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
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
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/lessons"
          className="flex items-center gap-1 font-semibold text-primary transition-colors hover:text-brand-hover"
        >
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

      <header className="rounded-hero bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          {lesson.order_in_series && (
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-soft text-lg font-bold text-brand-soft-fg">
              {lesson.order_in_series}
            </div>
          )}
          <div className="min-w-0">
            {lesson.series && <span className="eyebrow">{lesson.series.name}</span>}
            <h1
              className={`text-2xl font-bold leading-tight tracking-tight text-foreground ${
                lesson.series ? 'mt-1.5' : ''
              }`}
            >
              {lesson.title}
            </h1>
          </div>
        </div>
      </header>

      {lesson.description && (
        <div className="rounded-card bg-white p-5 shadow-sm">
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
            {lesson.description}
          </p>
        </div>
      )}

      {lesson.link && (
        <a
          href={lesson.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors duration-base ease-out-soft hover:bg-brand-hover"
        >
          <ExternalLink className="h-4 w-4" />
          Acessar conteúdo da lição
        </a>
      )}

      {!lesson.description && !lesson.link && (
        <EmptyState
          icon={<BookOpen />}
          title="Esta lição ainda não possui descrição ou link de conteúdo."
        />
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
