'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  AdminGrowthGroupForm,
  GrowthGroupFormData,
} from '@/components/admin/AdminGrowthGroupForm';
import { updateGrowthGroupAction } from '../actions';

interface AdminGrowthGroupEditClientProps {
  gc: Partial<GrowthGroupFormData> & { id: string };
  people: Array<{ id: string; name: string }>;
}

export function AdminGrowthGroupEditClient({ gc, people }: AdminGrowthGroupEditClientProps) {
  const router = useRouter();

  const handleSubmit = async (data: GrowthGroupFormData) => {
    try {
      const result = await updateGrowthGroupAction(gc.id, data);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('GC atualizado com sucesso!');
      router.push('/admin/growth-groups');
      router.refresh();
    } catch (error) {
      toast.error('Erro ao atualizar GC. Tente novamente.');
      console.error('Error updating GC:', error);
    }
  };

  return <AdminGrowthGroupForm gc={gc} onSubmit={handleSubmit} people={people} />;
}
