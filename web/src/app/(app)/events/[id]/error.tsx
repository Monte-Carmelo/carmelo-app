'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

type EventDetailErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function EventDetailError({ error, reset }: EventDetailErrorProps) {
  useEffect(() => {
    console.error('Erro na rota /events/[id]:', error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 py-12 text-center">
      <h2 className="text-2xl font-semibold">Erro ao carregar o evento</h2>
      <p className="text-sm text-slate-600">
        Ocorreu um problema ao abrir os detalhes deste evento.
      </p>
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  );
}
