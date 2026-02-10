import { expect, test } from '@playwright/test';

test.describe('Smoke', () => {
  test('homepage carrega corretamente', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Carmelo/i);
    await expect(page.getByRole('link', { name: /fazer login/i })).toBeVisible();
  });

  test('rota protegida redireciona para login quando desautenticado', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/login/);
  });
});
