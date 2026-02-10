'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EventFormSchema, type EventFormData } from '@/lib/validations/event';
import { createEventAction, updateEventAction } from '@/app/(app)/admin/events/actions';
import { uploadEventBannerAction } from '@/app/(app)/admin/events/storage-actions';
import { toast } from 'sonner';

interface AdminEventFormProps {
  event?: {
    id: string;
    title: string;
    description: string | null;
    event_date: string;
    event_time: string | null;
    location: string | null;
    banner_url: string | null;
    status: string;
  };
  mode: 'create' | 'edit';
}

export function AdminEventForm({ event, mode }: AdminEventFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<EventFormData>({
    title: event?.title || '',
    description: event?.description || '',
    event_date: event?.event_date || '',
    // Input type="time" and schema expect HH:MM, but DB can return HH:MM:SS
    event_time: event?.event_time?.slice(0, 5) || '',
    location: event?.location || '',
    banner_url: event?.banner_url || '',
    status: (event?.status as 'scheduled' | 'completed' | 'cancelled') || 'scheduled',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(event?.banner_url || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof EventFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user types
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 2MB');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato inválido. Use JPG, PNG ou WEBP');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile || !event?.id) return;

    setIsUploading(true);
    try {
      const result = await uploadEventBannerAction({
        eventId: event.id,
        file: selectedFile,
      });

      if (result.success) {
        setFormData(prev => ({ ...prev, banner_url: result.data.url }));
        toast.success('Imagem enviada com sucesso!');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationErrors({});

    try {
      // Validate form data using safeParse
      const validatedData = EventFormSchema.safeParse(formData);

      if (!validatedData.success) {
        // Convert Zod errors to user-friendly format
        const errors: Record<string, string> = {};
        validatedData.error.issues.forEach((err) => {
          const field = err.path[0] as string;
          errors[field] = err.message;
        });
        setValidationErrors(errors);
        toast.error('Por favor, corrija os erros no formulário');
        return;
      }

      let result;
      if (mode === 'create') {
        result = await createEventAction(validatedData.data);
      } else {
        result = await updateEventAction({
          id: event!.id,
          ...validatedData.data,
        });
      }

      if (result.success) {
        toast.success(
          mode === 'create'
            ? 'Evento criado com sucesso!'
            : 'Evento atualizado com sucesso!'
        );
        router.push('/admin/events');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      toast.error('Erro ao salvar evento. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removePreview = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Criar Novo Evento' : 'Editar Evento'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Ex: Conferência de Jovens 2025"
              required
              className={validationErrors.title ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {validationErrors.title && (
              <p className="text-sm text-red-600">{validationErrors.title}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descrição detalhada do evento..."
              rows={4}
              className={validationErrors.description ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {validationErrors.description && (
              <p className="text-sm text-red-600">{validationErrors.description}</p>
            )}
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_date">Data do Evento *</Label>
              <Input
                id="event_date"
                type="date"
                value={formData.event_date}
                onChange={(e) => handleInputChange('event_date', e.target.value)}
                required
                className={validationErrors.event_date ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {validationErrors.event_date && (
                <p className="text-sm text-red-600">{validationErrors.event_date}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="event_time">Horário</Label>
              <Input
                id="event_time"
                type="time"
                value={formData.event_time || ''}
                onChange={(e) => handleInputChange('event_time', e.target.value)}
                className={validationErrors.event_time ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {validationErrors.event_time && (
                <p className="text-sm text-red-600">{validationErrors.event_time}</p>
              )}
            </div>
          </div>

          {/* Local */}
          <div className="space-y-2">
            <Label htmlFor="location">Local</Label>
            <Input
              id="location"
              value={formData.location || ''}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Ex: Auditório Principal"
              className={validationErrors.location ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {validationErrors.location && (
              <p className="text-sm text-red-600">{validationErrors.location}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Agendado</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Banner Upload */}
          <div className="space-y-2">
            <Label>Banner do Evento</Label>
            
            {previewUrl && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  sizes="100vw"
                  loading="lazy"
                  className="object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removePreview}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="flex-1"
              />
              {selectedFile && mode === 'edit' && (
                <Button
                  type="button"
                  onClick={handleUpload}
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  {isUploading ? 'Enviando...' : 'Enviar'}
                </Button>
              )}
            </div>
            
            <p className="text-sm text-slate-500">
              Formatos aceitos: JPG, PNG, WEBP. Tamanho máximo: 2MB
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? 'Salvando...' 
                : mode === 'create' 
                  ? 'Criar Evento' 
                  : 'Salvar Alterações'
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
