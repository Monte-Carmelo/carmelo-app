'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ArrowLeft, Save } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import type { Database } from '@/lib/supabase/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  mode: z.enum(['in_person', 'online', 'hybrid']),
  address: z.string().max(500, 'Endereço muito longo').optional().or(z.literal('')),
  weekday: z.number().min(0).max(6).nullable().optional(),
  time: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'multiplying']),
}).refine(
  (data) => {
    // Se mode é in_person, address é obrigatório
    if (data.mode === 'in_person' && (!data.address || data.address.trim() === '')) {
      return false;
    }
    return true;
  },
  {
    message: 'Endereço é obrigatório para modo presencial',
    path: ['address'],
  }
);

type FormValues = z.infer<typeof schema>;

type GrowthGroup = Database['public']['Tables']['growth_groups']['Row'];

interface GCEditFormProps {
  gc: GrowthGroup;
}

export function GCEditForm({ gc }: GCEditFormProps) {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: gc.name,
      mode: gc.mode as 'in_person' | 'online' | 'hybrid',
      address: gc.address ?? '',
      weekday: gc.weekday,
      time: gc.time ?? '',
      status: gc.status as 'active' | 'inactive' | 'multiplying',
    },
  });

  const watchMode = form.watch('mode');

  const handleSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(null);
    setIsLoading(true);

    const { error } = await supabase
      .from('growth_groups')
      .update({
        name: values.name.trim(),
        mode: values.mode,
        address: values.address?.trim() || null,
        weekday: values.weekday ?? null,
        time: values.time || null,
        status: values.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', gc.id);

    if (error) {
      setErrorMessage(error.message ?? 'Falha ao atualizar GC');
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    router.push(`/gc/${gc.id}`);
    router.refresh();
  });

  const modeOptions = [
    { value: 'in_person', label: 'Presencial' },
    { value: 'online', label: 'Online' },
    { value: 'hybrid', label: 'Híbrido' },
  ];

  const weekdayOptions = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda-feira' },
    { value: 2, label: 'Terça-feira' },
    { value: 3, label: 'Quarta-feira' },
    { value: 4, label: 'Quinta-feira' },
    { value: 5, label: 'Sexta-feira' },
    { value: 6, label: 'Sábado' },
  ];

  const statusOptions = [
    { value: 'active', label: 'Ativo' },
    { value: 'inactive', label: 'Inativo' },
    { value: 'multiplying', label: 'Multiplicando' },
  ];

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center gap-4">
        <Button type="button" variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Editar Grupo de Crescimento</h1>
          <p className="text-muted-foreground">
            Atualize as informações do GC {gc.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
          <CardDescription>Configure nome, modo e horário do GC</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do GC</Label>
            <Input
              id="name"
              type="text"
              placeholder="GC Esperança"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mode">Modo</Label>
            <Select
              value={form.watch('mode')}
              onValueChange={(value) => form.setValue('mode', value as 'in_person' | 'online' | 'hybrid')}
            >
              <SelectTrigger id="mode">
                <SelectValue placeholder="Selecione o modo..." />
              </SelectTrigger>
              <SelectContent>
                {modeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.mode && (
              <p className="text-sm text-destructive">{form.formState.errors.mode.message}</p>
            )}
          </div>

          {watchMode === 'in_person' && (
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                type="text"
                placeholder="Rua Exemplo, 123"
                {...form.register('address')}
              />
              {form.formState.errors.address && (
                <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>
              )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="weekday">Dia da semana</Label>
              <Select
                value={form.watch('weekday')?.toString() ?? 'none'}
                onValueChange={(value) =>
                  form.setValue('weekday', value === 'none' ? null : parseInt(value))
                }
              >
                <SelectTrigger id="weekday">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não definido</SelectItem>
                  {weekdayOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.weekday && (
                <p className="text-sm text-destructive">{form.formState.errors.weekday.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Horário</Label>
              <Input
                id="time"
                type="time"
                {...form.register('time')}
              />
              {form.formState.errors.time && (
                <p className="text-sm text-destructive">{form.formState.errors.time.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={form.watch('status')}
              onValueChange={(value) => form.setValue('status', value as 'active' | 'inactive' | 'multiplying')}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Selecione o status..." />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.status && (
              <p className="text-sm text-destructive">{form.formState.errors.status.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {errorMessage && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{errorMessage}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </div>
    </form>
  );
}
