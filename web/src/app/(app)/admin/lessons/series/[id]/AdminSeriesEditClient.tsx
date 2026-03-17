'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { AdminSeriesForm, type SeriesFormData } from '@/components/admin/AdminSeriesForm'
import { AdminLessonList } from '@/components/admin/AdminLessonList'
import { Button } from '@/components/ui/button'
import { reorderLessonsAction, updateSeriesAction } from '../actions'

interface Series {
  id: string
  name: string
  description: string | null
  created_at: string
}

interface Lesson {
  id: string
  title: string
  description: string | null
  link: string | null
  order_in_series: number | null
  series_id: string | null
  created_at: string
}

interface AdminSeriesEditClientProps {
  series: Series
  initialLessons: Lesson[]
}

export function AdminSeriesEditClient({
  series,
  initialLessons,
}: AdminSeriesEditClientProps) {
  const router = useRouter()

  const handleSubmit = async (data: SeriesFormData) => {
    try {
      await updateSeriesAction(series.id, data)
      toast.success('Série atualizada com sucesso!')
      router.refresh()
    } catch (error) {
      toast.error('Erro ao atualizar série')
      console.error('Error updating series:', error)
    }
  }

  const handleCancel = () => {
    router.push('/admin/lessons')
  }

  const handleReorder = async (newOrder: string[]) => {
    try {
      await reorderLessonsAction(
        series.id,
        newOrder.map((lessonId, index) => ({
          lessonId,
          newOrder: index + 1,
        })),
      )

      toast.success('Ordem das lições atualizada com sucesso!')
    } catch (error) {
      toast.error('Erro ao atualizar ordem das lições')
      console.error('Error reordering lessons:', error)
      throw error
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link
          href="/admin/lessons"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Lições
        </Link>

        <h1 className="text-3xl font-bold text-gray-900">Editar Série</h1>
        <p className="text-gray-600 mt-2">
          Edite as informações da série &quot;{series.name}&quot;
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <AdminSeriesForm series={series} onSubmit={handleSubmit} onCancel={handleCancel} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Lições da Série ({initialLessons.length})
            </h2>
            <Link href={`/admin/lessons/new?series=${series.id}`}>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Lição
              </Button>
            </Link>
          </div>

          {initialLessons.length > 0 ? (
            <AdminLessonList lessons={initialLessons} onReorder={handleReorder} />
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500 mb-4">Nenhuma lição nesta série ainda</p>
              <Link href={`/admin/lessons/new?series=${series.id}`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeira Lição
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
