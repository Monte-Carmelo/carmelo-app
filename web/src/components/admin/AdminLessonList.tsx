'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GripVertical, Pencil, Trash2, ExternalLink } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  order_in_series: number | null;
  series_id: string | null;
}

interface AdminLessonListProps {
  lessons: Lesson[];
  onReorder?: (lessonOrder: Array<{ lessonId: string; newOrder: number }>) => Promise<void>;
  onDelete?: (lessonId: string) => Promise<void>;
  seriesId?: string | null;
}

interface SortableItemProps {
  lesson: Lesson;
  index: number;
  onDeleteClick: (lessonId: string) => void;
}

function SortableItem({ lesson, index, onDeleteClick }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center">
        {index + 1}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-slate-900 truncate">{lesson.title}</h4>
        {lesson.description && (
          <p className="text-sm text-slate-600 line-clamp-2 mt-1">{lesson.description}</p>
        )}
        {lesson.link && (
          <a
            href={lesson.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 mt-1"
          >
            Ver recurso
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/lessons/${lesson.id}`}>
            <Pencil className="h-4 w-4 mr-1" />
            Editar
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDeleteClick(lesson.id)}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Excluir
        </Button>
      </div>
    </div>
  );
}

export function AdminLessonList({ lessons, onReorder, onDelete, seriesId }: AdminLessonListProps) {
  const [items, setItems] = useState(lessons);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lessonIdToDelete, setLessonIdToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems);

    // Call onReorder with new order
    if (onReorder) {
      const lessonOrder = newItems.map((item, index) => ({
        lessonId: item.id,
        newOrder: index + 1,
      }));

      try {
        await onReorder(lessonOrder);
      } catch (error) {
        console.error('Error reordering lessons:', error);
        // Revert on error
        setItems(items);
      }
    }
  };

  const handleDeleteClick = (lessonId: string) => {
    setLessonIdToDelete(lessonId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!lessonIdToDelete || !onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(lessonIdToDelete);
      setItems((prev) => prev.filter((item) => item.id !== lessonIdToDelete));
      setDeleteDialogOpen(false);
      setLessonIdToDelete(null);
    } catch (error) {
      console.error('Error deleting lesson:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-slate-600 mb-4">
          {seriesId
            ? 'Nenhuma lição nesta série ainda.'
            : 'Nenhuma lição avulsa criada ainda.'}
        </p>
        <Button asChild>
          <Link href={seriesId ? `/admin/lessons/new?seriesId=${seriesId}` : '/admin/lessons/new'}>
            Nova Lição
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((lesson, index) => (
              <SortableItem
                key={lesson.id}
                lesson={lesson}
                index={index}
                onDeleteClick={handleDeleteClick}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta lição? Esta ação não pode ser desfeita.
              A lição será marcada como excluída e não aparecerá mais nas listagens.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
