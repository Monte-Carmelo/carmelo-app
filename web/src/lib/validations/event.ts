import { z } from 'zod';

export const EventFormSchema = z.object({
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres').max(200, 'Título muito longo'),
  description: z.string().max(5000, 'Descrição muito longa').optional().or(z.literal('')),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (formato: YYYY-MM-DD)'),
  event_time: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido (formato: HH:MM)').optional().or(z.literal('')),
  location: z.string().max(500, 'Local muito longo').optional().or(z.literal('')),
  banner_url: z.string().url('URL inválida').optional().or(z.literal('')),
  status: z.enum(['scheduled', 'completed', 'cancelled']).default('scheduled'),
});

export const BannerUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 2 * 1024 * 1024, 'Imagem deve ter no máximo 2MB')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'Formato inválido. Use JPG, PNG ou WEBP'
    ),
});

export type EventFormData = z.infer<typeof EventFormSchema>;
export type BannerUploadData = z.infer<typeof BannerUploadSchema>;