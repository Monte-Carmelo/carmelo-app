'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

type EventsErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function EventsError({ error, reset }: EventsErrorProps) {
  useEffect(() => {
    console.error('Erro na rota /events:', error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 py-12 text-center">
      <h2 className="text-2xl font-semibold">Erro ao carregar eventos</h2>
      <p className="text-sm text-slate-600">
        Não foi possível carregar a agenda neste momento.
      </p>
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  );
}
