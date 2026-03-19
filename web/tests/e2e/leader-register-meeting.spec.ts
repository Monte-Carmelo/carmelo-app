import { test, expect, type Page } from '@playwright/test';
import { loginAsLeader } from './helpers/auth';
import { fillByLabel } from './helpers/forms';

const loginEmail = process.env.E2E_SUPABASE_EMAIL;
const loginPassword = process.env.E2E_SUPABASE_PASSWORD;
const shouldSkip = false;
const DEFAULT_GC_ID = '40000000-0000-0000-0000-000000000003';

async function selectCustomLessonMode(page: Page) {
  const customModeButton = page.locator('button:has-text("Título Personalizado")').first();
  const customTitleInput = page.locator('#customLessonTitle');

  await expect(customModeButton).toBeVisible({ timeout: 15000 });
  await page.waitForLoadState('networkidle').catch(() => {});

  for (let attempt = 0; attempt < 6; attempt += 1) {
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
    await page.waitForTimeout(500);
  }

  throw new Error('Could not switch meeting form to custom title mode');
}

test.describe('Quickstart - Líder registra reunião', () => {
  test.skip(shouldSkip, 'Defina E2E_SUPABASE_EMAIL e E2E_SUPABASE_PASSWORD para executar este fluxo.');

  test('W030: líder registra nova reunião e visualiza no histórico', async ({ page }) => {
    await loginAsLeader(page);
    await page.goto(`/meetings/new?gcId=${DEFAULT_GC_ID}`, { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: /registrar reunião/i })).toBeVisible();
    await page.waitForLoadState('networkidle').catch(() => {});

    const uniqueTitle = `W030 Reunião ${Date.now()}`;
    await fillByLabel(page, 'Data', '2099-01-01');
    await fillByLabel(page, 'Horário', '20:30');
    await selectCustomLessonMode(page);
    await fillByLabel(page, /Comentários/i, 'Registro automático via Playwright W030.');
    await expect(page.locator('#customLessonTitle')).toBeEnabled({ timeout: 15000 });
    await page.locator('#customLessonTitle').fill(uniqueTitle);

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
