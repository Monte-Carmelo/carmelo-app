'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Mail, Calendar, TrendingUp, Hand } from 'lucide-react';
import type { VisitorView } from '@/lib/api/visitors';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ConvertDialog } from '@/components/visitors/convert-dialog';

export type { VisitorView } from '@/lib/api/visitors';

interface VisitorsListProps {
  visitors: VisitorView[];
}

export function VisitorsList({ visitors }: VisitorsListProps) {
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConvert = async (visitor: VisitorView) => {
    setProcessingId(visitor.id);
    setErrorMessage(null);
    const endpoint = new URL(`/api/visitors/${visitor.id}/convert`, window.location.origin).toString();

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gcId: visitor.gcId }),
    });
    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.success) {
      setErrorMessage(result?.error ?? 'Não foi possível converter visitante.');
      setProcessingId(null);
      return;
    }

    setProcessingId(null);
    router.refresh();
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {errorMessage ? (
        <div className="rounded-card bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {errorMessage}
        </div>
      ) : null}

      {visitors.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="Nenhum visitante encontrado para os filtros selecionados."
        />
      ) : (
        visitors.map((visitor) => (
          <div key={visitor.id} className="rounded-card bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar soft="sage">
                  <Hand className="h-5 w-5" />
                </Avatar>
                <div className="min-w-0">
                  <h3 className="truncate text-[15.5px] font-bold leading-tight text-foreground">
                    {visitor.name}
                  </h3>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {visitor.gcName}
                  </p>
                </div>
              </div>
              {visitor.email ? (
                <a
                  href={`mailto:${visitor.email}`}
                  className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">{visitor.email}</span>
                </a>
              ) : null}
            </div>

            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="flex items-center gap-2.5">
                  <Avatar soft="paper" size="sm">
                    <TrendingUp className="h-4 w-4" />
                  </Avatar>
                  <div>
                    <p className="text-xs text-muted-foreground">Visitas</p>
                    <Badge className="mt-1" variant="neutral">{visitor.visitCount}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <Avatar soft="paper" size="sm">
                    <Calendar className="h-4 w-4" />
                  </Avatar>
                  <div>
                    <p className="text-xs text-muted-foreground">Última visita</p>
                    <p className="text-sm font-semibold text-foreground">
                      {visitor.lastVisitDate
                        ? new Date(visitor.lastVisitDate).toLocaleDateString('pt-BR')
                        : '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge
                      className="mt-1"
                      dot
                      variant={
                        visitor.status === 'converted'
                          ? 'success'
                          : visitor.status === 'active'
                            ? 'sage'
                            : 'neutral'
                      }
                    >
                      {visitor.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {visitor.status === 'active' && visitor.personId ? (
                <div className="flex justify-end">
                  <ConvertDialog
                    visitorName={visitor.name}
                    disabled={processingId === visitor.id || !visitor.personId}
                    isProcessing={processingId === visitor.id}
                    onConfirm={() => handleConvert(visitor)}
                  />
                </div>
              ) : !visitor.personId ? (
                <p className="text-xs text-muted-foreground">
                  Cadastre os dados pessoais para habilitar conversão.
                </p>
              ) : null}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
