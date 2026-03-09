import { expect, test } from '@playwright/test';

test.describe('Smoke', () => {
  test('raiz redireciona para login e exibe formulário', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
    await expect(page).toHaveTitle(/Carmelo/i);
    await expect(page.getByRole('heading', { name: /bem-vindo/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
  });

  test('rota protegida redireciona para login quando desautenticado', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
  });
});
