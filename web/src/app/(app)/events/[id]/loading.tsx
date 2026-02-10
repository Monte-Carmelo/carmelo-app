import { Loading } from '@/components/ui/spinner';

export default function EventDetailsLoading() {
  return <Loading message="Carregando detalhes do evento..." className="min-h-[40vh]" />;
}
