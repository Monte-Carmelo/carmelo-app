'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  AdminGrowthGroupForm,
  GrowthGroupFormData,
} from '@/components/admin/AdminGrowthGroupForm';
import { createGrowthGroupAction } from '../actions';

interface AdminGrowthGroupFormClientProps {
  users: Array<{ id: string; name: string }>;
}

export function AdminGrowthGroupFormClient({ users }: AdminGrowthGroupFormClientProps) {
  const router = useRouter();

  const handleSubmit = async (data: GrowthGroupFormData) => {
    try {
      const result = await createGrowthGroupAction(data);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('GC criado com sucesso!');
      router.push('/admin/growth-groups');
      router.refresh();
    } catch (error) {
      toast.error('Erro ao criar GC. Tente novamente.');
      console.error('Error creating GC:', error);
    }
  };

  return <AdminGrowthGroupForm onSubmit={handleSubmit} users={users} />;
}
