'use client';

import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, MapPin, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EventDetailProps {
  event: {
    id: string;
    title: string;
    description: string | null;
    event_date: string;
    event_time: string | null;
    location: string | null;
    banner_url: string | null;
    status: string;
    created_at: string;
    created_by_name: string;
  };
}

const statusLabels = {
  scheduled: 'Agendado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

const statusVariants = {
  scheduled: 'default',
  completed: 'success',
  cancelled: 'danger',
} as const;

export function EventDetail({ event }: EventDetailProps) {
  const formatEventDate = (dateStr: string, timeStr?: string | null) => {
    const date = new Date(dateStr);
    const formattedDate = format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR });

    if (timeStr) {
      return `${formattedDate} às ${timeStr}`;
    }
    return formattedDate;
  };

  const isPastEvent = new Date(event.event_date) < new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" asChild>
          <Link href="/events">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Eventos
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">
            {event.title}
          </h1>
          <Badge
            variant={statusVariants[event.status as keyof typeof statusVariants]}
            className={isPastEvent ? 'opacity-60' : ''}
          >
            {statusLabels[event.status as keyof typeof statusLabels]}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {event.banner_url && (
            <Card className="mb-6 overflow-hidden shadow-sm">
              <CardContent className="p-0">
                <div className="relative h-64 w-full">
                  <Image
                    src={event.banner_url}
                    alt={event.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    loading="lazy"
                    className="object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {event.description && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="font-bold">Sobre o Evento</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {event.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="font-bold">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Data</p>
                  <p className={`text-sm ${isPastEvent ? 'text-slate-400' : 'text-muted-foreground'}`}>
                    {formatEventDate(event.event_date, event.event_time)}
                  </p>
                </div>
              </div>

              {event.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Local</p>
                    <p className={`text-sm ${isPastEvent ? 'text-slate-400' : 'text-muted-foreground'}`}>
                      {event.location}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Criado em</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(event.created_at), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="border-t border-divider pt-4">
                <p className="text-sm text-muted-foreground">
                  Criado por: <span className="font-semibold text-foreground">{event.created_by_name}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
