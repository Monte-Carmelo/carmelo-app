import { getEventAction } from '@/app/(app)/admin/events/actions';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, MapPin, Edit, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EventDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

const statusLabels = {
  scheduled: 'Agendado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default async function EventDetailsPage({ params }: EventDetailsPageProps) {
  const { id } = await params;
  const result = await getEventAction({ id });

  if (!result.success) {
    notFound();
  }

  const event = result.data;

  const formatEventDate = (dateStr: string, timeStr?: string | null) => {
    const date = new Date(dateStr);
    const formattedDate = format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
    
    if (timeStr) {
      return `${formattedDate} às ${timeStr}`;
    }
    return formattedDate;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button variant="outline" asChild className="mb-4">
          <Link href="/admin/events">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Eventos
          </Link>
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {event.title}
            </h1>
            <Badge 
              className={`${statusColors[event.status as keyof typeof statusColors]}`}
            >
              {statusLabels[event.status as keyof typeof statusLabels]}
            </Badge>
          </div>
          <Button asChild>
            <Link href={`/admin/events/${event.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Editar Evento
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {event.banner_url && (
            <Card className="mb-6">
              <CardContent className="p-0">
                <div className="relative h-64 w-full">
                  <Image
                    src={event.banner_url}
                    alt={event.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    loading="lazy"
                    className="object-cover rounded-lg"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {event.description && (
            <Card>
              <CardHeader>
                <CardTitle>Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-slate max-w-none">
                  <p className="whitespace-pre-wrap">{event.description}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Evento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="font-medium">Data</p>
                  <p className="text-sm text-slate-600">
                    {formatEventDate(event.event_date, event.event_time)}
                  </p>
                </div>
              </div>

              {event.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-slate-500" />
                  <div>
                    <p className="font-medium">Local</p>
                    <p className="text-sm text-slate-600">{event.location}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="font-medium">Criado em</p>
                  <p className="text-sm text-slate-600">
                    {format(new Date(event.created_at), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-slate-500">
                  Criado por: <span className="font-medium">{event.created_by_name}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
