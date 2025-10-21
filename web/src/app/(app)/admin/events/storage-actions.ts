'use server';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createSupabaseServerClient } from '@/lib/supabase/server-client';

export type UploadEventBannerInput = {
  eventId: string;
  file: File;
};

export type DeleteEventBannerInput = {
  path: string;
};

export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function uploadEventBannerAction(input: UploadEventBannerInput): Promise<ActionResponse<{ url: string; path: string }>> {
  const supabase = await createSupabaseServerClient();

  // 1. Check authentication & admin
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Não autenticado' };
  }

  const { data: userData } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!userData?.is_admin) {
    return { success: false, error: 'Acesso negado' };
  }

  // 2. Validate file
  if (input.file.size > 2 * 1024 * 1024) {
    return { success: false, error: 'Imagem deve ter no máximo 2MB' };
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(input.file.type)) {
    return { success: false, error: 'Formato inválido. Use JPG, PNG ou WEBP' };
  }

  // 3. Generate path and filename
  const ext = input.file.name.split('.').pop() || 'jpg';
  const filename = `banner-${Date.now()}.${ext}`;
  const path = `${input.eventId}/${filename}`;

  // 4. Upload to Supabase Storage
  const { data, error } = await (supabase as any).storage
    .from('event-banners')
    .upload(path, input.file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading banner:', error);
    return { success: false, error: 'Erro ao fazer upload da imagem' };
  }

  // 5. Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('event-banners')
    .getPublicUrl(path);

  return {
    success: true,
    data: {
      url: publicUrl,
      path: data.path,
    },
  };
}

export async function deleteEventBannerAction(input: DeleteEventBannerInput): Promise<ActionResponse<{ path: string }>> {
  const supabase = await createSupabaseServerClient();

  // 1. Check authentication & admin
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Não autenticado' };
  }

  const { data: userData } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!userData?.is_admin) {
    return { success: false, error: 'Acesso negado' };
  }

  // 2. Delete file
  const { error } = await supabase.storage
    .from('event-banners')
    .remove([input.path]);

  if (error) {
    console.error('Error deleting banner:', error);
    return { success: false, error: 'Erro ao excluir imagem' };
  }

  return {
    success: true,
    data: { path: input.path },
  };
}