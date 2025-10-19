'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  GCMultiplicationWizard,
  OriginalGC,
  MultiplicationState,
} from '@/components/admin/GCMultiplicationWizard';
import { multiplyGrowthGroupAction } from '../../actions';

interface GCMultiplicationWizardClientProps {
  originalGC: OriginalGC;
}

export function GCMultiplicationWizardClient({ originalGC }: GCMultiplicationWizardClientProps) {
  const router = useRouter();

  const handleComplete = async (state: MultiplicationState) => {
    try {
      const result = await multiplyGrowthGroupAction(originalGC.id, state);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('GC multiplicado com sucesso!');
      router.push('/admin/growth-groups');
      router.refresh();
    } catch (error) {
      toast.error('Erro ao multiplicar GC. Tente novamente.');
      console.error('Error multiplying GC:', error);
    }
  };

  const handleCancel = () => {
    router.push(`/admin/growth-groups/${originalGC.id}`);
  };

  return <GCMultiplicationWizard originalGC={originalGC} onComplete={handleComplete} onCancel={handleCancel} />;
}
