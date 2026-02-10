'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

type AdminEventsErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminEventsError({ error, reset }: AdminEventsErrorProps) {
  useEffect(() => {
    console.error('Erro na rota /admin/events:', error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 py-12 text-center">
      <h2 className="text-2xl font-semibold">Não foi possível carregar os eventos</h2>
      <p className="text-sm text-slate-600">
        Tente novamente em instantes. Se o problema persistir, contate o administrador.
      </p>
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  );
}
