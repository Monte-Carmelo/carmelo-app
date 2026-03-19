import { test, expect, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const loginEmail = process.env.E2E_SUPABASE_EMAIL;
const loginPassword = process.env.E2E_SUPABASE_PASSWORD;
const shouldSkip = !loginEmail || !loginPassword;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';
const systemUserId = '10000000-0000-0000-0000-000000000001';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function loginAsLeader(page: Page) {
  await page.goto('/login');
  await page.waitForTimeout(1000);
  await expect(page.getByLabel('E-mail')).toBeEnabled({ timeout: 30000 });
  await page.getByLabel('E-mail').fill(loginEmail!);
  await expect(page.getByLabel('Senha')).toBeEnabled({ timeout: 30000 });
  await page.getByLabel('Senha').fill(loginPassword!);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 30000 });
  await expect(page.getByRole('heading', { name: /bem-vindo/i })).toBeVisible({ timeout: 15000 });
}

async function createVisitor(page: Page): Promise<{ gcId: string; visitorName: string; visitorId: string }> {
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const visitorName = `Visitante W031 ${uniqueSuffix}`;
  const visitorEmail = `w031-${uniqueSuffix}@example.com`;

  await page.goto('/visitors/new', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /cadastrar visitante/i })).toBeVisible();
  await page.waitForLoadState('networkidle').catch(() => {});

  const gcSelect = page.locator('select[name="gcId"]');
  await expect(gcSelect).toBeEnabled({ timeout: 15000 });
  await gcSelect.selectOption({ index: 1 });
  const gcId = await gcSelect.inputValue();

  await expect(page.getByLabel('Nome completo')).toBeEnabled({ timeout: 15000 });
  await page.getByLabel('Nome completo').fill(visitorName);
  await expect(page.getByLabel('E-mail')).toBeEnabled({ timeout: 15000 });
  await page.getByLabel('E-mail').fill(visitorEmail);
  await expect(page.getByLabel('Telefone')).toBeEnabled({ timeout: 15000 });
  await page.getByLabel('Telefone').fill('11999999999');
  const submitButton = page.getByRole('button', { name: /cadastrar visitante/i });

  // Em dev/hidratação inicial, o primeiro clique pode cair em submit nativo (GET).
  // Fazemos algumas tentativas e aceitamos também o estado persistido no banco
  // como critério de sucesso quando o redirect client-side demora no runner.
  let redirected = false;
  let peopleRow: { id: string } | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    await page.waitForTimeout(500);
    await submitButton.click();
    redirected = await page
      .waitForURL('**/visitors', { timeout: 15000 })
      .then(() => true)
      .catch(() => false);

    if (redirected) {
      break;
    }

    const lookup = await supabaseAdmin
      .from('people')
      .select('id')
      .eq('name', visitorName)
      .eq('email', visitorEmail)
      .maybeSingle();

    if (lookup.data?.id) {
      peopleRow = lookup.data;
      await page.goto('/visitors', { waitUntil: 'domcontentloaded' });
      redirected = true;
      break;
    }
  }

  if (!redirected) {
    throw new Error('Visitor creation did not redirect to /visitors after retries');
  }

  await expect(page.getByRole('heading', { name: /visitantes/i })).toBeVisible();

  if (!peopleRow) {
    const lookup = await supabaseAdmin
      .from('people')
      .select('id')
      .eq('name', visitorName)
      .eq('email', visitorEmail)
      .single();

    if (lookup.error || !lookup.data) {
      throw new Error(`Could not find created person for visitor ${visitorName}`);
    }

    peopleRow = lookup.data;
  }

  const { data: visitorRow, error: visitorError } = await supabaseAdmin
    .from('visitors')
    .select('id')
    .eq('person_id', peopleRow.id)
    .eq('gc_id', gcId)
    .single();

  if (visitorError || !visitorRow) {
    throw new Error(`Could not find created visitor row for ${visitorName}`);
  }

  return { gcId, visitorName, visitorId: visitorRow.id };
}

async function insertAttendancesForAutoConversion(gcId: string, visitorId: string) {
  const base = Date.now();

  for (let index = 0; index < 3; index += 1) {
    const datetime = new Date(base + index * 86_400_000).toISOString();
    const { data: meeting, error: meetingError } = await supabaseAdmin
      .from('meetings')
      .insert({
        gc_id: gcId,
        lesson_template_id: null,
        lesson_title: `W031 Trigger ${index + 1}`,
        comments: 'Fixture E2E para auto conversão',
        datetime,
        registered_by_user_id: systemUserId,
      })
      .select('id')
      .single();

    if (meetingError || !meeting) {
      throw new Error(`Could not create fixture meeting ${index + 1}`);
    }

    const { error: attendanceError } = await supabaseAdmin.from('meeting_visitor_attendance').insert({
      meeting_id: meeting.id,
      visitor_id: visitorId,
    });

    if (attendanceError) {
      throw new Error(`Could not create visitor attendance ${index + 1}`);
    }
  }
}

test.describe('Quickstart - Conversão de visitante', () => {
  test.skip(shouldSkip, 'Defina E2E_SUPABASE_EMAIL e E2E_SUPABASE_PASSWORD para executar este fluxo.');

  test('W031: visitante é convertido após 3 presenças', async ({ page }) => {
    await loginAsLeader(page);

    const { gcId, visitorName, visitorId } = await createVisitor(page);

    await page.goto('/visitors?status=active', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(visitorName)).toBeVisible({ timeout: 10000 });

    await insertAttendancesForAutoConversion(gcId, visitorId);

  await expect.poll(async () => {
    await page.goto('/visitors?status=active', { waitUntil: 'domcontentloaded' });
    return await page.getByText(visitorName).count();
  }, { timeout: 30000 }).toBe(0);

  await expect.poll(async () => {
    await page.goto('/visitors?status=converted', { waitUntil: 'domcontentloaded' });
    return await page.getByText(visitorName).count();
  }, { timeout: 30000 }).toBeGreaterThan(0);
  });
});
