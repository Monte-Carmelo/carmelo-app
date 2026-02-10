'use client';

import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
  banner_url: string | null;
  status: string;
}

interface EventCardProps {
  event: Event;
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

export function EventCard({ event }: EventCardProps) {
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
    <Card className="group overflow-hidden transition-all duration-200 hover:shadow-lg">
      <Link href={`/events/${event.id}`}>
        {event.banner_url ? (
          <div className="relative h-48 w-full">
            <Image
              src={event.banner_url}
              alt={event.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              loading="lazy"
              className="object-cover transition-transform duration-200 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
          </div>
        ) : (
          <div className="h-48 w-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <Calendar className="h-12 w-12 text-blue-400" />
          </div>
        )}
        
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg leading-tight group-hover:text-blue-600 transition-colors">
              {event.title}
            </CardTitle>
            <Badge 
              className={`ml-2 ${statusColors[event.status as keyof typeof statusColors]} ${
                isPastEvent ? 'opacity-60' : ''
              }`}
            >
              {statusLabels[event.status as keyof typeof statusLabels]}
            </Badge>
          </div>
          
          {event.description && (
            <p className="text-sm text-slate-600 line-clamp-2">
              {event.description}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="h-4 w-4" />
            <span className={isPastEvent ? 'text-slate-400' : ''}>
              {formatEventDate(event.event_date, event.event_time)}
            </span>
          </div>

          {event.location && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin className="h-4 w-4" />
              <span className={isPastEvent ? 'text-slate-400' : ''}>
                {event.location}
              </span>
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}
