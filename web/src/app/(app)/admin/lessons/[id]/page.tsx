import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { Loading } from '@/components/ui/spinner'
import { AdminLessonEditClient } from './AdminLessonEditClient'

interface PageProps {
  params: Promise<{ id: string }>
}

async function EditLessonContent({ params }: PageProps) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('id, title, description, link, series_id, order_in_series, created_at')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (lessonError) {
    throw lessonError
  }

  if (!lesson) {
    notFound()
  }

  const { data: series, error: seriesError } = await supabase
    .from('lesson_series')
    .select('id, name')
    .is('deleted_at', null)
    .order('name')

  if (seriesError) {
    throw seriesError
  }

  return <AdminLessonEditClient lesson={lesson} series={series ?? []} />
}

export default function EditLessonPage({ params }: PageProps) {
  return (
    <Suspense fallback={<Loading message="Carregando lição..." />}>
      <EditLessonContent params={params} />
    </Suspense>
  )
}
