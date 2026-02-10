import { test, expect, type Page } from '@playwright/test';

const loginEmail = process.env.E2E_SUPABASE_EMAIL;
const loginPassword = process.env.E2E_SUPABASE_PASSWORD;
const shouldSkip = !loginEmail || !loginPassword;
const DEFAULT_GC_ID = '40000000-0000-0000-0000-000000000003';

async function loginAsLeader(page: Page) {
  await page.goto('/login');
  await page.waitForTimeout(1000);
  await page.getByLabel('E-mail').fill(loginEmail!);
  await page.getByLabel('Senha').fill(loginPassword!);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 30000 });
  await expect(page.getByRole('heading', { name: /bem-vindo/i })).toBeVisible({ timeout: 15000 });
}

async function selectCustomLessonMode(page: Page) {
  const customModeButton = page.locator('button:has-text("Título Personalizado")').first();
  const customTitleInput = page.locator('#customLessonTitle');

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await customModeButton.click({ force: true }).catch(() => {});
    if (!(await customTitleInput.isVisible().catch(() => false))) {
      await page.evaluate(() => {
        const button = Array.from(document.querySelectorAll('button')).find((el) =>
          el.textContent?.includes('Título Personalizado')
        ) as HTMLButtonElement | undefined;
        button?.click();
      });
    }

    if (await customTitleInput.isVisible().catch(() => false)) {
      return;
    }
    await page.waitForTimeout(200);
  }

  throw new Error('Could not switch meeting form to custom title mode');
}

test.describe('Quickstart - Líder registra reunião', () => {
  test.skip(shouldSkip, 'Defina E2E_SUPABASE_EMAIL e E2E_SUPABASE_PASSWORD para executar este fluxo.');

  test('W030: líder registra nova reunião e visualiza no histórico', async ({ page }) => {
    await loginAsLeader(page);
    await page.goto(`/meetings/new?gcId=${DEFAULT_GC_ID}`, { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: /registrar reunião/i })).toBeVisible();

    const uniqueTitle = `W030 Reunião ${Date.now()}`;
    await page.getByLabel('Data').fill('2099-01-01');
    await page.getByLabel('Horário').fill('20:30');
    await selectCustomLessonMode(page);
    await page.locator('#customLessonTitle').fill(uniqueTitle);
    await page.getByLabel('Comentários').fill('Registro automático via Playwright W030.');

    const checkboxes = page.getByRole('checkbox');
    const checkboxCount = await checkboxes.count();
    if (checkboxCount > 0) {
      await checkboxes.first().check().catch(() => {});
    }

    await page.getByRole('button', { name: /registrar reunião/i }).click();
    await expect(page).toHaveURL(/\/gc\/.+/);
    await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 15000 });

    await page.goto(`/meetings?gcId=${DEFAULT_GC_ID}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /reuniões/i })).toBeVisible();
    await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 20000 });
  });
});
