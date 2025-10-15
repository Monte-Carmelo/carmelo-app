import { test, expect, type Page } from '@playwright/test';

const loginEmail = process.env.E2E_SUPABASE_EMAIL;
const loginPassword = process.env.E2E_SUPABASE_PASSWORD;
const shouldSkip = !loginEmail || !loginPassword;

async function navigateToSection(page: Page, url: string, linkPattern: RegExp) {
  const navLink = page.getByRole('link', { name: linkPattern });
  const targetPattern = `**${url.startsWith('/') ? url : `/${url}`}*`;

  if ((await navLink.count()) > 0) {
    await Promise.all([navLink.first().click(), page.waitForURL(targetPattern)]);
    return;
  }

  await page.goto(url);
  await page.waitForURL(targetPattern);
}

async function ensureConvertibleVisitor(page: Page) {
  const convertButtons = page.getByRole('button', { name: /converter em membro/i });
  if ((await convertButtons.count()) > 0) {
    return;
  }

  await page.getByRole('link', { name: /Adicionar visitante/i }).click();
  await page.waitForURL('**/visitors/new');

  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const gcSelect = page.locator('select[name="gcId"]');
  await gcSelect.selectOption({ index: 1 });
  await page.getByLabel('Nome completo').fill(`Visitante Playwright ${uniqueSuffix}`);
  await page.getByLabel('E-mail').fill(`visitante-${uniqueSuffix}@example.com`);
  await page.getByLabel('Telefone').fill('11999999999');
  await page.getByRole('button', { name: /Cadastrar visitante/i }).click();
  await page.waitForURL('**/visitors');
  await expect(page.getByRole('heading', { name: /visitantes/i })).toBeVisible();
}

test.describe('Reuniões e Visitantes', () => {
  test.skip(shouldSkip, 'Defina E2E_SUPABASE_EMAIL e E2E_SUPABASE_PASSWORD para executar este fluxo.');

  test('registrar reunião com placeholders', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill(loginEmail!);
    await page.getByLabel('Senha').fill(loginPassword!);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL('**/dashboard');

    await navigateToSection(page, '/meetings', /reuniões/i);
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

    await navigateToSection(page, '/visitors', /visitantes/i);

    await expect(page.getByRole('heading', { name: /visitantes/i })).toBeVisible();

    await ensureConvertibleVisitor(page);

    const convertButtons = page.getByRole('button', { name: /converter em membro/i });
    await expect(convertButtons).not.toHaveCount(0);
    const initialCount = await convertButtons.count();
    let converted = false;

    for (let i = 0; i < initialCount; i += 1) {
      const button = convertButtons.nth(i);
      if (await button.isEnabled()) {
        await button.click();
        await expect.poll(async () => await convertButtons.count()).toBeLessThan(initialCount);
        converted = true;
        break;
      }
    }

    expect(converted).toBeTruthy();
  });
});
