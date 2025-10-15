import { test, expect } from '@playwright/test';

const loginEmail = process.env.E2E_SUPABASE_EMAIL;
const loginPassword = process.env.E2E_SUPABASE_PASSWORD;
const shouldSkip = !loginEmail || !loginPassword;

test.describe('Participantes', () => {
  test.skip(shouldSkip, 'Defina E2E_SUPABASE_EMAIL e E2E_SUPABASE_PASSWORD para executar este fluxo.');

  test('visualizar participantes e acessar cadastro rápido', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('E-mail').fill(loginEmail!);
    await page.getByLabel('Senha').fill(loginPassword!);
    await page.getByRole('button', { name: /entrar/i }).click();

    await page.waitForURL('**/dashboard');

    await page.getByRole('link', { name: /participantes/i }).click();
    await page.waitForURL('**/participants*');

    await expect(page.getByRole('heading', { name: /participantes/i })).toBeVisible();

    await page.getByRole('link', { name: /Cadastrar participante/i }).click();
    await page.waitForURL('**/participants/new');

    await expect(page.getByRole('heading', { name: /cadastrar participante/i })).toBeVisible();
  });

  test('navegar para visitantes pela listagem de participantes', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill(loginEmail!);
    await page.getByLabel('Senha').fill(loginPassword!);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL('**/dashboard');

    await page.getByRole('link', { name: /participantes/i }).click();
    await page.waitForURL('**/participants*');

    await page.getByRole('link', { name: /Acompanhar visitantes/i }).click();
    await page.waitForURL('**/visitors');

    await expect(page.getByRole('heading', { name: /visitantes/i })).toBeVisible();
  });
});
