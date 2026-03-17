'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  AdminLessonForm,
  type LessonFormData,
  type LessonSeries,
} from '@/components/admin/AdminLessonForm'
import { deleteLessonAction, updateLessonAction } from '../actions'

interface Lesson {
  id: string
  title: string
  description: string | null
  link: string | null
  series_id: string | null
  order_in_series: number | null
  created_at: string
}

interface AdminLessonEditClientProps {
  lesson: Lesson
  series: LessonSeries[]
}

export function AdminLessonEditClient({
  lesson,
  series,
}: AdminLessonEditClientProps) {
  const router = useRouter()

  const handleSubmit = async (data: LessonFormData) => {
    try {
      await updateLessonAction(lesson.id, data)
      toast.success('Lição atualizada com sucesso!')
      router.push('/admin/lessons')
      router.refresh()
    } catch (error) {
      toast.error('Erro ao atualizar lição')
      console.error('Error updating lesson:', error)
    }
  }

  const handleCancel = () => {
    router.push('/admin/lessons')
  }

  const handleDelete = async () => {
    try {
      await deleteLessonAction(lesson.id)
      toast.success('Lição excluída com sucesso!')
      router.push('/admin/lessons')
      router.refresh()
    } catch (error) {
      toast.error('Erro ao excluir lição')
      console.error('Error deleting lesson:', error)
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

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Lição</h1>
            <p className="text-gray-600 mt-2">
              Edite as informações da lição &quot;{lesson.title}&quot;
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Lição
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. A lição será marcada como excluída (soft
                  delete).
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="max-w-3xl">
        <AdminLessonForm
          lesson={lesson}
          series={series}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}
