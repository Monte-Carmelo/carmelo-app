import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { listGrowthGroupAttendanceOptions } from '@/lib/api/growth-group-attendance';

export async function GET(
  _request: Request,
  context: { params: Promise<{ gcId: string }> },
) {
  const { gcId } = await context.params;
  const supabase = await createSupabaseServerClient(await cookies());
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const options = await listGrowthGroupAttendanceOptions(supabase, gcId);
    return NextResponse.json(options);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao carregar presença do GC.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
