'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

// Types
export interface OriginalGC {
  id: string;
  name: string;
  mode: 'in_person' | 'online' | 'hybrid';
  address?: string;
  members: Array<{
    id: string;
    name: string;
    role: 'leader' | 'supervisor' | 'member';
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
    // Validation for Step 1
    if (currentStep === 1) {
      const allValid = state.newGCs.every(
        (gc) =>
          gc.name.trim() !== '' &&
          gc.leaderId !== '' &&
          gc.supervisorIds.length > 0 &&
          (gc.mode !== 'in_person' || (gc.address && gc.address.trim() !== ''))
      );

      if (!allValid) {
        alert('Por favor, preencha todos os campos obrigatórios dos novos GCs.');
        return;
      }
    }

    // Validation for Step 2
    if (currentStep === 2) {
      const allMembersAllocated = originalGC.members.every(
        (member) => state.memberAllocations[member.id]
      );

      if (!allMembersAllocated) {
        alert('Por favor, aloque todos os membros antes de prosseguir.');
        return;
      }
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleNewGCCountChange = (count: number) => {
    const currentCount = state.newGCs.length;

    if (count > currentCount) {
      // Add new GCs
      const newGCs = [...state.newGCs];
      for (let i = currentCount; i < count; i++) {
        newGCs.push({
          name: '',
          mode: 'in_person',
          address: '',
          leaderId: '',
          supervisorIds: [],
        });
      }
      updateState({ newGCs });
    } else if (count < currentCount) {
      // Remove GCs
      updateState({ newGCs: state.newGCs.slice(0, count) });
    }
  };

  const updateNewGC = (index: number, updates: Partial<NewGCInfo>) => {
    const newGCs = [...state.newGCs];
    newGCs[index] = { ...newGCs[index], ...updates };
    updateState({ newGCs });
  };

  const updateMemberAllocation = (
    memberId: string,
    destination: 'original' | 'new_0' | 'new_1' | 'new_2'
  ) => {
    updateState({
      memberAllocations: {
        ...state.memberAllocations,
        [memberId]: destination,
      },
    });
  };

  // Calculate allocation summary for Step 2
  const getAllocationSummary = () => {
    const summary = {
      original: 0,
      new_0: 0,
      new_1: 0,
      new_2: 0,
    };

    Object.values(state.memberAllocations).forEach((destination) => {
      summary[destination] += 1;
    });

    return summary;
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
            <div className="space-y-6">
              <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-900">
                  GC Original: <strong>{originalGC.name}</strong> ({originalGC.members.length}{' '}
                  membros)
                </p>
              </div>

              {/* Select number of new GCs */}
              <div className="space-y-2">
                <Label htmlFor="gcCount">
                  Quantos novos GCs serão criados? <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={state.newGCs.length.toString()}
                  onValueChange={(value) => handleNewGCCountChange(parseInt(value))}
                >
                  <SelectTrigger id="gcCount">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 novo GC</SelectItem>
                    <SelectItem value="2">2 novos GCs</SelectItem>
                    <SelectItem value="3">3 novos GCs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Forms for each new GC */}
              {state.newGCs.map((gc, index) => (
                <Card key={index} className="border-slate-300">
                  <CardHeader className="bg-slate-50">
                    <CardTitle className="text-lg">Novo GC #{index + 1}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor={`gc-${index}-name`}>
                        Nome <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id={`gc-${index}-name`}
                        value={gc.name}
                        onChange={(e) => updateNewGC(index, { name: e.target.value })}
                        placeholder="Ex: GC Esperança"
                      />
                    </div>

                    {/* Mode */}
                    <div className="space-y-2">
                      <Label htmlFor={`gc-${index}-mode`}>
                        Modo <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={gc.mode}
                        onValueChange={(value) =>
                          updateNewGC(index, { mode: value as 'in_person' | 'online' | 'hybrid' })
                        }
                      >
                        <SelectTrigger id={`gc-${index}-mode`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in_person">Presencial</SelectItem>
                          <SelectItem value="online">Online</SelectItem>
                          <SelectItem value="hybrid">Híbrido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Address (conditional) */}
                    {gc.mode === 'in_person' && (
                      <div className="space-y-2">
                        <Label htmlFor={`gc-${index}-address`}>
                          Endereço <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id={`gc-${index}-address`}
                          value={gc.address || ''}
                          onChange={(e) => updateNewGC(index, { address: e.target.value })}
                          placeholder="Rua, número, bairro"
                        />
                      </div>
                    )}

                    {/* Leader */}
                    <div className="space-y-2">
                      <Label htmlFor={`gc-${index}-leader`}>
                        Líder Principal <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={gc.leaderId}
                        onValueChange={(value) => updateNewGC(index, { leaderId: value })}
                      >
                        <SelectTrigger id={`gc-${index}-leader`}>
                          <SelectValue placeholder="Selecione o líder" />
                        </SelectTrigger>
                        <SelectContent>
                          {originalGC.members.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Supervisor - Simplified (single select for now) */}
                    <div className="space-y-2">
                      <Label htmlFor={`gc-${index}-supervisor`}>
                        Supervisor <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={gc.supervisorIds[0] || ''}
                        onValueChange={(value) =>
                          updateNewGC(index, { supervisorIds: value ? [value] : [] })
                        }
                      >
                        <SelectTrigger id={`gc-${index}-supervisor`}>
                          <SelectValue placeholder="Selecione o supervisor" />
                        </SelectTrigger>
                        <SelectContent>
                          {originalGC.members.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500">
                        Nota: Multi-seleção será implementada em iteração futura
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Step 2: Member Allocation */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <p className="text-sm text-slate-600">
                Aloque cada membro do GC original para o GC original ou para um dos novos GCs.
              </p>

              {/* Allocation Table */}
              <div className="rounded-md border">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                        Membro
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                        Papel Atual
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                        Destino
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {originalGC.members.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm text-slate-900">{member.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 capitalize">
                          {member.role.replace('_', ' ')}
                        </td>
                        <td className="px-4 py-3">
                          <Select
                            value={state.memberAllocations[member.id] || ''}
                            onValueChange={(value) =>
                              updateMemberAllocation(
                                member.id,
                                value as 'original' | 'new_0' | 'new_1' | 'new_2'
                              )
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione o destino" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="original">
                                GC Original ({originalGC.name})
                              </SelectItem>
                              {state.newGCs.map((gc, index) => (
                                <SelectItem key={index} value={`new_${index}`}>
                                  {gc.name || `Novo GC #${index + 1}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Allocation Summary */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-base">Resumo da Alocação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div>
                      <p className="text-xs text-slate-600">GC Original</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {getAllocationSummary().original} membros
                      </p>
                    </div>
                    {state.newGCs.map((gc, index) => (
                      <div key={index}>
                        <p className="text-xs text-slate-600">
                          {gc.name || `Novo GC #${index + 1}`}
                        </p>
                        <p className="text-lg font-semibold text-slate-900">
                          {getAllocationSummary()[`new_${index}` as 'new_0' | 'new_1' | 'new_2']}{' '}
                          membros
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Original GC Configuration */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <Label className="text-base">O que acontecerá com o GC original?</Label>
                <p className="text-sm text-slate-600 mt-1">
                  Decida se o GC original continuará ativo ou será marcado como multiplicado.
                </p>
              </div>

              <RadioGroup
                value={state.keepOriginalActive ? 'yes' : 'no'}
                onValueChange={(value) => updateState({ keepOriginalActive: value === 'yes' })}
              >
                <div className="flex items-center space-x-2 rounded-md border p-4">
                  <RadioGroupItem value="yes" id="keep-active" />
                  <Label htmlFor="keep-active" className="flex-1 cursor-pointer">
                    <span className="font-medium">Manter o GC original ativo</span>
                    <p className="text-xs text-slate-600 mt-1">
                      O GC original continuará funcionando com os membros que ficarem nele.
                    </p>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 rounded-md border p-4">
                  <RadioGroupItem value="no" id="mark-multiplied" />
                  <Label htmlFor="mark-multiplied" className="flex-1 cursor-pointer">
                    <span className="font-medium">Marcar como multiplicado</span>
                    <p className="text-xs text-slate-600 mt-1">
                      O GC original será marcado com status &ldquo;multiplicado&rdquo; e não
                      receberá mais reuniões.
                    </p>
                  </Label>
                </div>
              </RadioGroup>

              {state.keepOriginalActive && getAllocationSummary().original === 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm text-amber-800">
                    ⚠️ Atenção: O GC original está marcado para continuar ativo, mas nenhum membro
                    foi alocado para ele. Considere realocar alguns membros ou marcar o GC como
                    multiplicado.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Textarea
                  id="notes"
                  value={state.notes || ''}
                  onChange={(e) => updateState({ notes: e.target.value })}
                  placeholder="Adicione observações sobre esta multiplicação..."
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <p className="text-sm text-slate-600">
                Revise todas as informações antes de confirmar a multiplicação do GC.
              </p>

              {/* Summary of New GCs */}
              <Card>
                <CardHeader>
                  <CardTitle>Novos GCs ({state.newGCs.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {state.newGCs.map((gc, index) => {
                    const membersCount =
                      getAllocationSummary()[`new_${index}` as 'new_0' | 'new_1' | 'new_2'];
                    return (
                      <div key={index} className="rounded-md border p-4">
                        <h4 className="font-semibold text-slate-900">{gc.name}</h4>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-slate-600">Modo:</span>{' '}
                            <span className="text-slate-900">
                              {gc.mode === 'in_person'
                                ? 'Presencial'
                                : gc.mode === 'online'
                                  ? 'Online'
                                  : 'Híbrido'}
                            </span>
                          </div>
                          {gc.address && (
                            <div>
                              <span className="text-slate-600">Endereço:</span>{' '}
                              <span className="text-slate-900">{gc.address}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-slate-600">Líder:</span>{' '}
                            <span className="text-slate-900">
                              {originalGC.members.find((m) => m.id === gc.leaderId)?.name ||
                                'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-600">Supervisor:</span>{' '}
                            <span className="text-slate-900">
                              {originalGC.members.find((m) => m.id === gc.supervisorIds[0])
                                ?.name || 'N/A'}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-slate-600">Total de membros:</span>{' '}
                            <span className="font-semibold text-slate-900">{membersCount}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Original GC Status */}
              <Card>
                <CardHeader>
                  <CardTitle>GC Original ({originalGC.name})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-slate-600">Status após multiplicação:</span>{' '}
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          state.keepOriginalActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {state.keepOriginalActive ? 'Continua Ativo' : 'Marcado como Multiplicado'}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-slate-600">Membros que permanecerão:</span>{' '}
                      <span className="font-semibold text-slate-900">
                        {getAllocationSummary().original}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Member Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Membros</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Original GC members */}
                    {getAllocationSummary().original > 0 && (
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {originalGC.name} ({getAllocationSummary().original} membros)
                        </p>
                        <ul className="mt-1 ml-4 list-disc text-xs text-slate-600">
                          {originalGC.members
                            .filter((m) => state.memberAllocations[m.id] === 'original')
                            .map((m) => (
                              <li key={m.id}>{m.name}</li>
                            ))}
                        </ul>
                      </div>
                    )}
                    {/* New GCs members */}
                    {state.newGCs.map((gc, index) => {
                      const members = originalGC.members.filter(
                        (m) => state.memberAllocations[m.id] === `new_${index}`
                      );
                      if (members.length === 0) return null;

                      return (
                        <div key={index}>
                          <p className="text-sm font-medium text-slate-900">
                            {gc.name} ({members.length} membros)
                          </p>
                          <ul className="mt-1 ml-4 list-disc text-xs text-slate-600">
                            {members.map((m) => (
                              <li key={m.id}>{m.name}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              {state.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{state.notes}</p>
                  </CardContent>
                </Card>
              )}
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
