import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';

export async function POST() {
  const supabase = await createSupabaseServerClient(await cookies());
  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'Não foi possível encerrar a sessão.' },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true });
}
