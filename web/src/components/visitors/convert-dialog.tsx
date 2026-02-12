'use client';

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
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface ConvertDialogProps {
  visitorName: string;
  disabled?: boolean;
  isProcessing?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function ConvertDialog({
  visitorName,
  disabled,
  isProcessing,
  onConfirm,
}: ConvertDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button disabled={disabled}>
          {isProcessing ? 'Convertendo...' : 'Converter em membro'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Converter visitante em membro?</AlertDialogTitle>
          <AlertDialogDescription>
            Você está prestes a converter <strong>{visitorName}</strong> em membro ativo deste GC.
            Esta ação registrará o evento de conversão.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirmar conversão</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
