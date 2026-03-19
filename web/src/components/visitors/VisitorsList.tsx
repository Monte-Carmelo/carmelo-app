'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Mail, Calendar, TrendingUp } from 'lucide-react';
import type { VisitorView } from '@/lib/api/visitors';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    <div className="grid gap-4">
      {errorMessage ? (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{errorMessage}</p>
          </CardContent>
        </Card>
      ) : null}

      {visitors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Users className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhum visitante encontrado para os filtros selecionados.
            </p>
          </CardContent>
        </Card>
      ) : (
        visitors.map((visitor) => (
          <Card key={visitor.id}>
            <CardHeader>
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl">{visitor.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {visitor.gcName}
                  </CardDescription>
                </div>
                {visitor.email ? (
                  <a
                    href={`mailto:${visitor.email}`}
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <Mail className="h-3 w-3" />
                    {visitor.email}
                  </a>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      <span>Visitas</span>
                    </div>
                    <Badge variant="secondary">{visitor.visitCount}</Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Última visita</span>
                    </div>
                    <p className="text-sm font-semibold">
                      {visitor.lastVisitDate
                        ? new Date(visitor.lastVisitDate).toLocaleDateString('pt-BR')
                        : '—'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge variant={visitor.status === 'active' ? 'default' : 'secondary'}>
                      {visitor.status}
                    </Badge>
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
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
