import { test, expect, type Page } from '@playwright/test';

const adminEmail = 'admin@test.com';
const adminPassword = 'senha123';

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(adminEmail);
  await page.getByLabel('Senha').fill(adminPassword);
  await page.getByRole('button', { name: /entrar/i }).click();
  await expect(page.getByRole('heading', { name: 'Bem-vindo' })).toBeVisible({ timeout: 10000 });
}

test.describe('Debug - Área Administrativa', () => {
  test('verificar página admin em detalhes', async ({ page }) => {
    await loginAsAdmin(page);

    console.log('Navigating to /admin...');
    await page.goto('/admin');
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // Get page title
    const title = await page.title();
    console.log('Page title:', title);

    // Check for any error messages
    const errorSelectors = [
      'text=Error',
      'text=error',
      'text=Erro',
      'text=erro',
      '[data-testid="error"]',
      '.error',
      '.error-message'
    ];

    for (const selector of errorSelectors) {
      const errorElement = page.locator(selector);
      const isVisible = await errorElement.isVisible().catch(() => false);
      if (isVisible) {
        const errorText = await errorElement.textContent();
        console.log('Found error:', errorText);
      }
    }

    // Look for any headings on the page
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    console.log('Found headings:', headings.length);
    for (let i = 0; i < headings.length; i++) {
      const text = await headings[i].textContent();
      console.log(`Heading ${i + 1}:`, text);
    }

    // Look for specific admin elements
    const adminElements = [
      'Dashboard Admin',
      'Dashboard',
      'Admin',
      'Total de Usuários',
      'GCs Ativos',
      'Gerenciar Usuários',
      'Gerenciar GCs'
    ];

    for (const element of adminElements) {
      const locator = page.getByText(element);
      const isVisible = await locator.isVisible().catch(() => false);
      console.log(`"${element}" visible:`, isVisible);
    }

    // Check for navigation links
    const navLinks = await page.locator('a').all();
    console.log('Found links:', navLinks.length);
    for (let i = 0; i < Math.min(navLinks.length, 10); i++) {
      const text = await navLinks[i].textContent();
      const href = await navLinks[i].getAttribute('href');
      console.log(`Link ${i + 1}:`, text, '->', href);
    }

    // Check page content
    const bodyText = await page.locator('body').textContent();
    console.log('Page contains "Dashboard Admin":', bodyText?.includes('Dashboard Admin'));
    console.log('Page contains "Dashboard":', bodyText?.includes('Dashboard'));
    console.log('Page contains "Admin":', bodyText?.includes('Admin'));

    // Take screenshot
    await page.screenshot({ path: 'debug-admin-page.png', fullPage: true });

    // Save HTML content for inspection
    const htmlContent = await page.content();
    console.log('HTML content length:', htmlContent.length);

    // Look for specific HTML patterns
    const hasAdminShell = htmlContent.includes('AdminShell') || htmlContent.includes('admin-shell');
    const hasErrorBoundary = htmlContent.includes('error') || htmlContent.includes('Error');
    const hasLoading = htmlContent.includes('Loading') || htmlContent.includes('loading');

    console.log('HTML patterns:');
    console.log('- AdminShell:', hasAdminShell);
    console.log('- Error boundary:', hasErrorBoundary);
    console.log('- Loading state:', hasLoading);
  });

  test('verificar console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('Console error:', msg.text());
      }
    });

    page.on('pageerror', error => {
      console.log('Page error:', error.message);
    });

    await loginAsAdmin(page);
    await page.goto('/admin');
    await page.waitForTimeout(5000);

    console.log('Console errors found:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach((error, index) => {
        console.log(`Error ${index + 1}:`, error);
      });
    }

    // Expect no console errors
    expect(consoleErrors.length).toBe(0);
  });

  test('verificar elementos DOM', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin');
    await page.waitForTimeout(5000);

    // Check for specific DOM elements
    const checks = [
      { name: 'body element', selector: 'body' },
      { name: 'main content', selector: 'main' },
      { name: 'header', selector: 'header' },
      { name: 'nav', selector: 'nav' },
      { name: 'admin shell', selector: '[data-testid="admin-shell"]' },
      { name: 'sidebar', selector: '[data-testid="admin-sidebar"]' },
      { name: 'content area', selector: '[data-testid="admin-content"]' }
    ];

    for (const check of checks) {
      const element = page.locator(check.selector);
      const exists = await element.count() > 0;
      console.log(`${check.name} exists:`, exists);

      if (exists) {
        const isVisible = await element.isVisible().catch(() => false);
        console.log(`${check.name} visible:`, isVisible);
      }
    }

    // Check for metrics cards
    const metricsSelectors = [
      'text=Total de Usuários',
      'text=GCs Ativos',
      'text=Membros Ativos',
      'text=Visitantes Ativos'
    ];

    for (const selector of metricsSelectors) {
      const element = page.locator(selector);
      const isVisible = await element.isVisible().catch(() => false);
      console.log(`Metric "${selector}" visible:`, isVisible);
    }

    // Check for action buttons
    const actionSelectors = [
      'text=Gerenciar Usuários',
      'text=Gerenciar GCs',
      'text=Gerenciar Lições'
    ];

    for (const selector of actionSelectors) {
      const element = page.locator(selector);
      const isVisible = await element.isVisible().catch(() => false);
      console.log(`Action "${selector}" visible:`, isVisible);
    }
  });
});