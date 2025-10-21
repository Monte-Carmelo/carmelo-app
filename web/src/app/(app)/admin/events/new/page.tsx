import { AdminEventForm } from '@/components/admin/AdminEventForm';

export default function CreateEventPage() {
  return (
    <div className="p-6">
      <AdminEventForm mode="create" />
    </div>
  );
}