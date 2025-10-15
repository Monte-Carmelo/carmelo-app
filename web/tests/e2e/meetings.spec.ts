import { test, expect } from '@playwright/test';

const loginEmail = process.env.E2E_SUPABASE_EMAIL;
const loginPassword = process.env.E2E_SUPABASE_PASSWORD;
const shouldSkip = !loginEmail || !loginPassword;

test.describe('Reuniões e Visitantes', () => {
  test.skip(shouldSkip, 'Defina E2E_SUPABASE_EMAIL e E2E_SUPABASE_PASSWORD para executar este fluxo.');

  test('registrar reunião com placeholders', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill(loginEmail!);
    await page.getByLabel('Senha').fill(loginPassword!);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL('**/dashboard');

    await page.getByRole('link', { name: /reuniões/i }).click();
    await page.waitForURL('**/meetings*');
    await page.getByRole('link', { name: /registrar nova reunião/i }).click();
    await page.waitForURL('**/meetings/new');

    await expect(page.getByRole('heading', { name: /registrar reunião/i })).toBeVisible();

    const gcSelect = page.locator('select[name="gcId"]');
    await gcSelect.selectOption({ index: 1 });

    await page.getByLabel('Data').fill(new Date().toISOString().split('T')[0]);
    await page.getByLabel('Horário').fill('19:30');
    await page.getByLabel('Título customizado').fill('Reunião teste e2e');
    await page.getByLabel('Comentários').fill('Anotações automáticas da suíte e2e.');

    const checkboxes = page.getByRole('checkbox');
    const count = await checkboxes.count();
    for (let i = 0; i < Math.min(count, 2); i += 1) {
      await checkboxes.nth(i).check().catch(() => {});
    }

    await page.getByRole('button', { name: /registrar reunião/i }).click();
    await page.waitForURL('**/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('converter visitante manualmente', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill(loginEmail!);
    await page.getByLabel('Senha').fill(loginPassword!);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL('**/dashboard');

    await page.getByRole('link', { name: /visitantes/i }).click();
    await page.waitForURL('**/visitors');

    const convertButtons = page.getByRole('button', { name: /converter em membro/i });
    const count = await convertButtons.count();
    for (let i = 0; i < count; i += 1) {
      const button = convertButtons.nth(i);
      if (await button.isEnabled()) {
        await button.click();
        await expect(button).toBeDisabled();
        break;
      }
    }
  });
});
