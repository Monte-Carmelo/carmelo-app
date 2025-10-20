'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

interface LessonSeries {
  id: string;
  name: string;
  description: string | null;
  created_by_user_id: string;
  created_at: string;
  creator_name?: string;
  lesson_count: number;
}

interface AdminSeriesListProps {
  series: LessonSeries[];
  onDelete?: (seriesId: string) => Promise<void>;
}

export function AdminSeriesList({ series, onDelete }: AdminSeriesListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [seriesIdToDelete, setSeriesIdToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (seriesId: string) => {
    setSeriesIdToDelete(seriesId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!seriesIdToDelete || !onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(seriesIdToDelete);
      setDeleteDialogOpen(false);
      setSeriesIdToDelete(null);
    } catch (error) {
      console.error('Error deleting series:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (series.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-slate-600 mb-4">Nenhuma série de lições criada ainda.</p>
        <Button asChild>
          <Link href="/admin/lessons/series/new">
            <Plus className="h-4 w-4 mr-2" />
            Nova Série
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Lições</TableHead>
              <TableHead>Criado por</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {series.map((serie) => (
              <TableRow key={serie.id} data-testid="series-card">
                <TableCell className="font-medium">{serie.name}</TableCell>
                <TableCell className="max-w-md">
                  {serie.description ? (
                    <span className="text-sm text-slate-600 line-clamp-2">
                      {serie.description}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400 italic">Sem descrição</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={serie.lesson_count > 0 ? 'default' : 'secondary'}>
                    {serie.lesson_count} {serie.lesson_count === 1 ? 'lição' : 'lições'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-slate-600">
                  {serie.creator_name || 'Desconhecido'}
                </TableCell>
                <TableCell className="text-sm text-slate-600">
                  {new Date(serie.created_at).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/lessons/series/${serie.id}`}>
                        <Pencil className="h-4 w-4 mr-1" />
                        Editar
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Link href={`/admin/lessons/new?seriesId=${serie.id}`}>
                        <Plus className="h-4 w-4 mr-1" />
                        Lição
                      </Link>
                    </Button>
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(serie.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta série? Esta ação não pode ser desfeita.
              As lições associadas a esta série serão mantidas, mas não farão mais parte de uma série.
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
