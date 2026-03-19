import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import {
  buildSettingsValues,
  getConfigDescription,
  settingsKeys,
  settingsSchema,
} from '@/lib/validations/settings';

async function createAdminSupabaseClient() {
  const supabase = await createSupabaseServerClient(await cookies());
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { supabase, user: null, isAdmin: false };
  }

  const { data: userRow } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();

  return {
    supabase,
    user,
    isAdmin: Boolean(userRow?.is_admin),
  };
}

export async function GET() {
  const { supabase, user, isAdmin } = await createAdminSupabaseClient();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const [settingsResult, totalConfigsResult, recentUpdateResult] = await Promise.all([
    supabase.from('config').select('key, value').in('key', settingsKeys),
    supabase.from('config').select('*', { count: 'exact', head: true }),
    supabase
      .from('config')
      .select('updated_at, users!inner(id, people(name))')
      .not('updated_at', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single(),
  ]);

  if (settingsResult.error) {
    return NextResponse.json({ success: false, error: settingsResult.error.message }, { status: 400 });
  }

  const settings = buildSettingsValues(settingsResult.data);
  const recentUpdate = recentUpdateResult.data as { updated_at?: string | null; users?: { people?: { name?: string } } } | null;

  return NextResponse.json({
    success: true,
    data: {
      settings,
      status: {
        last_updated: recentUpdate?.updated_at || null,
        updated_by: recentUpdate?.users?.people?.name || null,
        total_configs: totalConfigsResult.count || 0,
      },
    },
  });
}

export async function PUT(request: Request) {
  const { supabase, user, isAdmin } = await createAdminSupabaseClient();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Payload inválido para salvar configurações.' }, { status: 400 });
  }

  const configEntries = settingsKeys.map((key) => ({
    key,
    value: parsed.data[key],
    description: getConfigDescription(key),
  }));

  const { error } = await supabase.from('config').upsert(configEntries, {
    onConflict: 'key',
  });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
