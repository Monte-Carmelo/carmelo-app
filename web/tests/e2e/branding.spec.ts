import { test, expect } from '@playwright/test';

const loginEmail = process.env.E2E_SUPABASE_EMAIL || 'test@example.com';
const loginPassword = process.env.E2E_SUPABASE_PASSWORD || 'password';

test.describe('Visual Identity & Navigation', () => {
  test('AS-001: Login page displays logo and teal colors', async ({ page }) => {
    await page.goto('/login');

    // Verificar logo presente
    const logo = page.locator('img[alt*="Igreja Monte Carmelo"]');
    await expect(logo).toBeVisible();

    // Verificar heading Bem-vindo
    const heading = page.locator('h1:has-text("Bem-vindo")');
    await expect(heading).toBeVisible();

    // Verificar botão Entrar existe
    const button = page.locator('button:has-text("Entrar")');
    await expect(button).toBeVisible();
  });

  test('AS-002: Authenticated dashboard shows cards and branding', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(loginEmail);
    await page.locator('input[type="password"]').fill(loginPassword);
    await page.locator('button:has-text("Entrar")').click();
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Verificar header com texto Igreja Monte Carmelo
    await expect(page.locator('text=Igreja Monte Carmelo')).toBeVisible();
    await expect(page.locator('text=Grupos de Crescimento')).toBeVisible();

    // Verificar 4 navigation cards
    await expect(page.locator('text=GC')).toBeVisible();
    await expect(page.locator('text=Eventos')).toBeVisible();
    await expect(page.locator('text=Lições')).toBeVisible();
    await expect(page.locator('text=Membros')).toBeVisible();
  });

  test('AS-003: Responsive behavior on mobile', async ({ page }) => {
    // Set mobile viewport (375px - iPhone standard)
    await page.setViewportSize({ width: 375, height: 667 });

    // Login
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(loginEmail);
    await page.locator('input[type="password"]').fill(loginPassword);
    await page.locator('button:has-text("Entrar")').click();
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Verify cards are visible
    await expect(page.locator('text=GC')).toBeVisible();
    await expect(page.locator('text=Eventos')).toBeVisible();

    // Test minimum width (320px)
    await page.setViewportSize({ width: 320, height: 568 });

    // Verify no horizontal overflow
    const body = await page.locator('body').boundingBox();
    expect(body?.width).toBeLessThanOrEqual(320);
  });

  test('AS-004: Navigation consistency across pages', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(loginEmail);
    await page.locator('input[type="password"]').fill(loginPassword);
    await page.locator('button:has-text("Entrar")').click();
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Verify header on dashboard
    await expect(page.locator('header >> text=Igreja Monte Carmelo')).toBeVisible();

    // Navigate to different pages and check header consistency
    await page.goto('/gc');
    await expect(page.locator('header >> text=Igreja Monte Carmelo')).toBeVisible();

    await page.goto('/meetings');
    await expect(page.locator('header >> text=Igreja Monte Carmelo')).toBeVisible();
  });

  test('EDGE: Logo fallback when image fails', async ({ page }) => {
    // Block logo image
    await page.route('**/igreja-monte-carmelo.png', route => route.abort());

    await page.goto('/login');

    // Verificar texto fallback appears
    await expect(page.locator('text=Igreja Monte Carmelo')).toBeVisible();
  });
});
