import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server-client'
import { Loading } from '@/components/ui/spinner'
import { AdminSeriesEditClient } from './AdminSeriesEditClient'

interface PageProps {
  params: Promise<{ id: string }>
}

async function EditSeriesContent({ params }: PageProps) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data: series, error: seriesError } = await supabase
    .from('lesson_series')
    .select('id, name, description, created_at')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (seriesError) {
    throw seriesError
  }

  if (!series) {
    notFound()
  }

  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('id, title, description, link, order_in_series, series_id, created_at')
    .eq('series_id', id)
    .is('deleted_at', null)
    .order('order_in_series', { ascending: true })
    .order('created_at', { ascending: true })

  if (lessonsError) {
    throw lessonsError
  }

  return <AdminSeriesEditClient series={series} initialLessons={lessons ?? []} />
}

export default function EditSeriesPage({ params }: PageProps) {
  return (
    <Suspense fallback={<Loading message="Carregando série..." />}>
      <EditSeriesContent params={params} />
    </Suspense>
  )
}
