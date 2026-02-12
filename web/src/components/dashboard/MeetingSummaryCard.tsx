'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface MeetingSummaryCardProps {
  isLoading: boolean;
  lessonTitle?: string;
  gcName?: string;
  datetime?: string;
}

function formatMeetingDate(datetime: string) {
  const date = new Date(datetime);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MeetingSummaryCard({
  isLoading,
  lessonTitle,
  gcName,
  datetime,
}: MeetingSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>Próxima lição</CardDescription>
        <CardTitle className="text-base">
          {isLoading ? 'Carregando...' : lessonTitle ?? 'Nenhuma reunião futura'}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 text-sm text-text-light">
        {datetime && gcName ? (
          <p>
            {gcName} • {formatMeetingDate(datetime)}
          </p>
        ) : (
          <p>Agende uma nova reunião para começar o acompanhamento.</p>
        )}
      </CardContent>
    </Card>
  );
}
