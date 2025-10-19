'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Types
export interface OriginalGC {
  id: string;
  name: string;
  mode: 'in_person' | 'online' | 'hybrid';
  address?: string;
  members: Array<{
    id: string;
    name: string;
    role: 'leader' | 'co_leader' | 'supervisor' | 'member';
  }>;
}

export interface NewGCInfo {
  name: string;
  mode: 'in_person' | 'online' | 'hybrid';
  address?: string;
  leaderId: string;
  supervisorIds: string[];
}

export interface MultiplicationState {
  newGCs: NewGCInfo[];
  memberAllocations: Record<string, 'original' | 'new_0' | 'new_1' | 'new_2'>;
  keepOriginalActive: boolean;
  notes?: string;
}

interface GCMultiplicationWizardProps {
  originalGC: OriginalGC;
  onComplete: (state: MultiplicationState) => Promise<void>;
  onCancel: () => void;
}

export function GCMultiplicationWizard({
  originalGC,
  onComplete,
  onCancel,
}: GCMultiplicationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [state, setState] = useState<MultiplicationState>({
    newGCs: [
      {
        name: '',
        mode: 'in_person',
        address: '',
        leaderId: '',
        supervisorIds: [],
      },
    ],
    memberAllocations: {},
    keepOriginalActive: true,
    notes: '',
  });

  const totalSteps = 4;

  const handleNext = () => {
    // TODO: Add validation for each step
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await onComplete(state);
    } catch (error) {
      console.error('Error completing multiplication:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateState = (updates: Partial<MultiplicationState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                step === currentStep
                  ? 'border-primary bg-primary text-primary-foreground'
                  : step < currentStep
                    ? 'border-primary bg-primary/20 text-primary'
                    : 'border-slate-300 bg-white text-slate-400'
              }`}
            >
              {step}
            </div>
            {step < 4 && (
              <div
                className={`h-0.5 w-12 md:w-24 ${
                  step < currentStep ? 'bg-primary' : 'bg-slate-300'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>
            {currentStep === 1 && 'Informações dos Novos GCs'}
            {currentStep === 2 && 'Divisão de Membros'}
            {currentStep === 3 && 'Configuração do GC Original'}
            {currentStep === 4 && 'Revisão e Confirmação'}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && 'Defina quantos GCs serão criados e suas informações básicas'}
            {currentStep === 2 && 'Aloque os membros entre o GC original e os novos GCs'}
            {currentStep === 3 && 'Configure o que acontecerá com o GC original'}
            {currentStep === 4 && 'Revise todas as informações antes de confirmar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: New GCs Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                GC Original: <strong>{originalGC.name}</strong>
              </p>
              <p className="text-sm text-slate-600">
                Total de membros: <strong>{originalGC.members.length}</strong>
              </p>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium">Em desenvolvimento...</p>
                <p className="mt-2 text-xs text-slate-500">
                  Step 1 será implementado na tarefa T016
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Member Allocation */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium">Em desenvolvimento...</p>
                <p className="mt-2 text-xs text-slate-500">
                  Step 2 será implementado na tarefa T017
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Original GC Configuration */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium">Em desenvolvimento...</p>
                <p className="mt-2 text-xs text-slate-500">
                  Step 3 será implementado na tarefa T018
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium">Em desenvolvimento...</p>
                <p className="mt-2 text-xs text-slate-500">
                  Step 4 será implementado na tarefa T019
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <div>
          {currentStep > 1 && (
            <Button variant="outline" onClick={handleBack}>
              Voltar
            </Button>
          )}
          {currentStep === 1 && (
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </div>
        <div>
          {currentStep < totalSteps ? (
            <Button onClick={handleNext}>Próximo</Button>
          ) : (
            <Button onClick={handleComplete} disabled={isSubmitting}>
              {isSubmitting ? 'Confirmando...' : 'Confirmar Multiplicação'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
