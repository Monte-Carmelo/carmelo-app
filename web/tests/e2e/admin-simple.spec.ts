import { test, expect, type Page } from '@playwright/test';

const adminEmail = process.env.E2E_SUPABASE_ADMIN_EMAIL || 'admin@test.com';
const adminPassword = process.env.E2E_SUPABASE_ADMIN_PASSWORD || 'senha123';

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(adminEmail);
  await page.getByLabel('Senha').fill(adminPassword);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await expect(page.getByRole('heading', { name: /bem-vindo/i })).toBeVisible({ timeout: 10000 });
}

test.describe('Área Administrativa - Testes Simples', () => {
  test('login funciona', async ({ page }) => {
    await page.goto('/login');

    // Check if login page loads
    await expect(page.getByLabel('E-mail')).toBeVisible();
    await expect(page.getByLabel('Senha')).toBeVisible();
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();

    // Fill login form
    await page.getByLabel('E-mail').fill(adminEmail);
    await page.getByLabel('Senha').fill(adminPassword);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);

    // Take screenshot for debugging
    await page.screenshot({ path: 'debug-login.png' });

    // Check if we're on dashboard page
    const isDashboard = currentUrl.includes('/dashboard');

    if (isDashboard) {
      // Look for dashboard elements
      const dashboardHeading = page.getByRole('heading', { name: /dashboard/i });
      const hasDashboard = await dashboardHeading.isVisible().catch(() => false);

      if (!hasDashboard) {
        // Try other selectors
        const possibleHeadings = [
          page.getByText('Dashboard'),
          page.getByText('Painel'),
          page.locator('h1'),
          page.locator('h2')
        ];

        for (const heading of possibleHeadings) {
          const isVisible = await heading.isVisible().catch(() => false);
          if (isVisible) {
            console.log('Found visible heading:', await heading.textContent());
            break;
          }
        }
      }
    }
  });

  test('acesso direto ao admin', async ({ page }) => {
    await loginAsAdmin(page);

    // Then try to access admin
    await page.goto('/admin');
    await page.waitForTimeout(3000);

    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL after admin access:', currentUrl);

    // Take screenshot for debugging
    await page.screenshot({ path: 'debug-admin.png' });

    // Look for admin elements
    const adminHeading = page.getByRole('heading', { name: /dashboard admin/i });
    const hasAdminDashboard = await adminHeading.isVisible().catch(() => false);

    if (!hasAdminDashboard) {
      // Try other admin elements
      const possibleElements = [
        page.getByText('Total de Usuários'),
        page.getByText('GCs Ativos'),
        page.getByText('Gerenciar Usuários'),
        page.locator('h1'),
        page.locator('h2')
      ];

      for (const element of possibleElements) {
        const isVisible = await element.isVisible().catch(() => false);
        if (isVisible) {
          console.log('Found visible admin element:', await element.textContent());
          break;
        }
      }
    }
  });

  test('navegacao manual para admin após login', async ({ page }) => {
    await loginAsAdmin(page);

    // Manually navigate to admin (as a user would)
    console.log('User logged in, now navigating to admin...');

    // Click on admin link if available, or manually navigate
    const adminLink = page.getByRole('link', { name: /admin/i });
    const hasAdminLink = await adminLink.isVisible().catch(() => false);

    if (hasAdminLink) {
      console.log('Found admin link, clicking...');
      await adminLink.click();
    } else {
      console.log('No admin link found, navigating manually to /admin...');
      await page.goto('/admin');
    }

    if (page.url().includes('/login')) {
      await loginAsAdmin(page);
      await page.goto('/admin');
    }

    await expect(page.getByRole('heading', { name: /dashboard admin/i })).toBeVisible({ timeout: 10000 });

    // Check current URL
    const currentUrl = page.url();
    console.log('Final URL after navigation:', currentUrl);

    // Take screenshot for debugging
    await page.screenshot({ path: 'debug-manual-admin-navigation.png' });

    // Look for admin elements
    await expect(page.getByText('Total de Usuários')).toBeVisible();
    await expect(page.getByText('GCs Ativos')).toBeVisible();
  });

  test('verificar estrutura HTML', async ({ page }) => {
    await loginAsAdmin(page);

    // Get page content for analysis
    const content = await page.content();
    console.log('Page content length:', content.length);

    // Look for common patterns
    const hasDashboard = content.includes('Dashboard') || content.includes('dashboard');
    const hasAdmin = content.includes('Admin') || content.includes('admin');
    const hasError = content.includes('error') || content.includes('Error');

    console.log('Page contains dashboard:', hasDashboard);
    console.log('Page contains admin:', hasAdmin);
    console.log('Page contains error:', hasError);

    // Save HTML for manual inspection
    await page.goto('view-source:' + page.url());
    const sourceContent = await page.content();
    console.log('Source contains dashboard:', sourceContent.includes('dashboard'));
  });
});
