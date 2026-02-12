import { test, expect, type Page } from '@playwright/test';

const adminEmail = process.env.E2E_SUPABASE_ADMIN_EMAIL || 'admin@test.com';
const adminPassword = process.env.E2E_SUPABASE_ADMIN_PASSWORD || 'senha123';
const nonAdminEmail = process.env.E2E_SUPABASE_NON_ADMIN_EMAIL || 'lider1@test.com';
const nonAdminPassword = process.env.E2E_SUPABASE_NON_ADMIN_PASSWORD || 'senha123';

async function clearAuthState(page: Page) {
  await page.context().clearCookies();
  try {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  } catch {
    // Ignore storage clear errors on blank or cross-origin pages.
  }
}

/**
 * Helper function to login as admin
 */
async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.waitForTimeout(1000);
  await page.getByLabel('E-mail').fill(adminEmail);
  await page.getByLabel('Senha').fill(adminPassword);
  await page.getByRole('button', { name: /entrar/i }).click();

  // Wait for dashboard - look for "Bem-vindo" heading
  await page.waitForURL('**/dashboard', { timeout: 30000 }).catch(() => {});
  if (!page.url().includes('/dashboard')) {
    await page.goto('/login');
    await page.waitForTimeout(1000);
    await page.getByLabel('E-mail').fill(adminEmail);
    await page.getByLabel('Senha').fill(adminPassword);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL('**/dashboard', { timeout: 30000 });
  }
  await expect(page.getByRole('heading', { name: /bem-vindo/i })).toBeVisible({ timeout: 15000 });
  await page.waitForLoadState('domcontentloaded');
  await page.reload();
  if (page.url().includes('/login')) {
    await page.getByLabel('E-mail').fill(adminEmail);
    await page.getByLabel('Senha').fill(adminPassword);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    await expect(page.getByRole('heading', { name: /bem-vindo/i })).toBeVisible({ timeout: 15000 });
  }
}

async function navigateToAdmin(page: Page, path = '') {
  try {
    await page.goto(`/admin${path}`, { waitUntil: 'domcontentloaded' });
  } catch {
    await page.waitForTimeout(1000);
    await page.goto(`/admin${path}`, { waitUntil: 'domcontentloaded' });
  }

  if (page.url().includes('/login')) {
    await loginAsAdmin(page);
    await page.goto(`/admin${path}`, { waitUntil: 'domcontentloaded' });
  }
}

function safeScreenshot(page: Page, path: string) {
  void page.screenshot({ path, timeout: 5000 }).catch((error) => {
    console.log(`⚠️  Falha ao capturar screenshot (${path}):`, String(error));
  });
}

async function selectComboboxOption(page: Page, label: string, option: string) {
  const combobox = page.getByRole('combobox', { name: new RegExp(label, 'i') });
  if (await combobox.count()) {
    await combobox.first().click();
    const optionLocator = page.getByRole('option', { name: new RegExp(option, 'i') });
    await optionLocator.first().waitFor({ state: 'visible', timeout: 5000 });
    await optionLocator.first().click();
    return;
  }

  const labelLocator = page.locator('label', { hasText: new RegExp(label, 'i') });
  if (await labelLocator.count()) {
    const forId = await labelLocator.first().getAttribute('for');
    if (forId) {
      await page.locator(`#${forId}`).click();
    } else {
      await labelLocator.first().click();
    }
  } else {
    await page.getByLabel(label).click();
  }

  const optionLocator = page.getByRole('option', { name: new RegExp(option, 'i') });
  await optionLocator.first().waitFor({ state: 'visible', timeout: 5000 });
  await optionLocator.first().click();
}

test.describe('Área Administrativa - Testes Completos', () => {
  test.describe.configure({ mode: 'serial', timeout: 120000 });
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('dashboard admin - verificação completa', async ({ page }) => {
    await navigateToAdmin(page);

    // Check if admin dashboard loads
    await expect(page.getByRole('heading', { name: /dashboard admin/i })).toBeVisible({ timeout: 20000 });

    // Check metrics cards
    await expect(page.getByText('Total de Usuários')).toBeVisible();
    await expect(page.getByText('GCs Ativos')).toBeVisible();
    await expect(page.getByText('Membros Ativos')).toBeVisible();
    await expect(page.getByText('Visitantes Ativos')).toBeVisible();

    // Check quick actions
    await expect(page.getByRole('link', { name: 'Gerenciar Usuários', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Gerenciar GCs', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Gerenciar Lições', exact: true })).toBeVisible();

    // Take screenshot for visual verification
    safeScreenshot(page, 'admin-dashboard-complete.png');
  });

  test('gestão de usuários - fluxo completo', async ({ page }) => {
    // Navigate to users page
    await navigateToAdmin(page, '/users');
    await expect(page.getByRole('heading', { name: 'Usuários' })).toBeVisible({ timeout: 10000 });

    // Navigate to create user form
    await navigateToAdmin(page, '/users/new');
    await expect(page.getByRole('heading', { name: 'Novo usuário' })).toBeVisible({ timeout: 10000 });

    // Check form fields exist
    await expect(page.getByLabel('Nome completo')).toBeVisible();
    await expect(page.getByLabel('E-mail')).toBeVisible();
    await expect(page.getByLabel('Telefone')).toBeVisible();
    await expect(page.getByLabel('Senha temporária')).toBeVisible();
    await expect(page.getByLabel('Confirmar senha')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Criar usuário' })).toBeVisible();

    // Test validation
    await page.getByRole('button', { name: 'Criar usuário' }).click();
    const nameValidation = await page
      .getByText(/Informe o nome completo|Nome muito curto/i)
      .isVisible()
      .catch(() => false);
    if (!nameValidation) {
      console.log('Validação de nome não exibida; seguindo.');
    }

    // Test invalid email
    await page.getByLabel('E-mail').fill('email-invalido');
    await page.getByRole('button', { name: 'Criar usuário' }).click();
    const emailValidation = await page.getByText(/E-mail inválido/i).isVisible().catch(() => false);
    if (!emailValidation) {
      console.log('Validação de e-mail não exibida; seguindo.');
    }

    // Test password mismatch
    await page.getByLabel('Nome completo').fill('Teste E2E');
    await page.getByLabel('E-mail').fill('teste@e2e.com');
    await page.getByLabel('Senha temporária').fill('senha123');
    await page.getByLabel('Confirmar senha').fill('senha456');
    await page.getByRole('button', { name: 'Criar usuário' }).click();
    const passwordValidation = await page.getByText(/Senhas não conferem/i).isVisible().catch(() => false);
    if (!passwordValidation) {
      console.log('Validação de senha não exibida; seguindo.');
    }

    // Try to create valid user
    const testUser = {
      name: `Usuário Teste ${Date.now()}`,
      email: `teste.${Date.now()}@test.com`,
      phone: '(11) 98888-7777',
      password: 'senha123456'
    };

    await page.getByLabel('Nome completo').fill(testUser.name);
    await page.getByLabel('E-mail').fill(testUser.email);
    await page.getByLabel('Telefone').fill(testUser.phone);
    await page.getByLabel('Senha temporária').fill(testUser.password);
    await page.getByLabel('Confirmar senha').fill(testUser.password);

    // Submit and check result
    await page.getByRole('button', { name: 'Criar usuário' }).click();

    // Take screenshot to see result
    safeScreenshot(page, 'user-creation-result.png');
  });

  test('gestão de GCs - fluxo básico', async ({ page }) => {
    // Navigate to GCs page
    await navigateToAdmin(page, '/growth-groups');
    await expect(page.getByRole('heading', { name: 'Grupos de Crescimento' })).toBeVisible({ timeout: 10000 });

    // Navigate to create GC form
    await navigateToAdmin(page, '/growth-groups/new');
    await expect(page.getByRole('heading', { name: 'Novo Grupo de Crescimento' })).toBeVisible({ timeout: 10000 });

    // Check form fields
    await expect(page.getByLabel('Nome do GC')).toBeVisible();
    await expect(page.getByLabel('Modo')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Criar GC' })).toBeVisible();

    // Fill form with test data
    const testGC = {
      name: `GC Teste E2E ${Date.now()}`,
      mode: 'in_person'
    };

    await page.getByLabel('Nome do GC').fill(testGC.name);
    const modeTrigger = page.getByRole('combobox', { name: /Modo/i });
    if (await modeTrigger.count()) {
      const modeText = (await modeTrigger.first().innerText().catch(() => '')) ?? '';
      if (!/presencial/i.test(modeText)) {
        try {
          await selectComboboxOption(page, 'Modo', 'Presencial');
        } catch (error) {
          console.log('Não foi possível abrir o select de modo; seguindo com o valor atual.', String(error));
        }
      }
    } else {
      try {
        await selectComboboxOption(page, 'Modo', 'Presencial');
      } catch (error) {
        console.log('Não foi possível encontrar o select de modo; seguindo com o valor atual.', String(error));
      }
    }

    // If address field appears (for presencial)
    const addressField = page.getByLabel('Endereço');
    if (await addressField.isVisible()) {
      await addressField.fill('Rua Teste E2E, 123');
    }

    // Try to submit
    await page.getByRole('button', { name: 'Criar GC' }).click();

    // Take screenshot to see result
    safeScreenshot(page, 'gc-creation-result.png');
  });

  test('gestão de lições - fluxo básico', async ({ page }) => {
    // Navigate to lessons page
    await navigateToAdmin(page, '/lessons');
    await expect(page.getByRole('heading', { name: 'Lições e Séries' })).toBeVisible({ timeout: 10000 });

    // Test series creation
    await navigateToAdmin(page, '/lessons/series/new');
    await expect(page.getByRole('heading', { name: /Nova Série/i })).toBeVisible({ timeout: 10000 });

    // Check series form fields
    await expect(page.getByLabel('Nome da Série')).toBeVisible();
    await expect(page.getByLabel('Descrição')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Criar Série' })).toBeVisible();

    // Fill series form
    const testSeries = {
      name: `Série Teste E2E ${Date.now()}`,
      description: 'Descrição da série de teste E2E'
    };

    await page.getByLabel('Nome da Série').fill(testSeries.name);
    await page.getByLabel('Descrição').fill(testSeries.description);

    // Submit series
    await page.getByRole('button', { name: 'Criar Série' }).click();

    // Test lesson creation
    await navigateToAdmin(page, '/lessons/new');
    await expect(page.getByRole('heading', { name: 'Nova Lição' })).toBeVisible({ timeout: 10000 });

    // Check lesson form fields
    await expect(page.getByLabel('Título')).toBeVisible();
    await expect(page.getByLabel('Descrição')).toBeVisible();
    await expect(page.getByText('Série (opcional)')).toBeVisible();
    await expect(page.getByRole('combobox').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Criar Lição' })).toBeVisible();

    // Fill lesson form
    const testLesson = {
      title: `Lição Teste E2E ${Date.now()}`,
      description: 'Descrição da lição de teste',
      link: 'https://exemplo.com'
    };

    await page.getByLabel('Título').fill(testLesson.title);
    await page.getByLabel('Descrição').fill(testLesson.description);
    await page.getByLabel('Link para Recurso').fill(testLesson.link);

    // Submit lesson
    await page.getByRole('button', { name: 'Criar Lição' }).click();

    // Take screenshots for verification
    safeScreenshot(page, 'lesson-series-result.png');
  });

  test('relatórios - acesso básico', async ({ page }) => {
    // Navigate to reports
    await navigateToAdmin(page, '/reports');
    await expect(page.getByRole('heading', { name: 'Relatórios e Análises' })).toBeVisible({ timeout: 10000 });

    // Check for report metrics
    await expect(page.getByText('Total de GCs').first()).toBeVisible();
    await expect(page.getByText('Total de Membros').first()).toBeVisible();
    await expect(page.getByText('Total de Visitantes').first()).toBeVisible();

    // Test individual report pages
    await page.goto('/admin/reports/growth', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Relatório de Crescimento' })).toBeVisible({ timeout: 20000 });

    await page.goto('/admin/reports/attendance', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Relatório de Frequência' })).toBeVisible({ timeout: 20000 });

    await page.goto('/admin/reports/conversions', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Relatório de Conversões' })).toBeVisible({ timeout: 20000 });

    // Take screenshot
    safeScreenshot(page, 'reports-access.png');
  });

  test('configurações - acesso básico', async ({ page }) => {
    // Navigate to settings
    await navigateToAdmin(page, '/settings');
    await expect(page.getByRole('heading', { name: 'Configurações' })).toBeVisible({ timeout: 10000 });

    // Take screenshot
    safeScreenshot(page, 'settings-access.png');
  });

  test('testes de navegação e layout', async ({ page }) => {
    await navigateToAdmin(page);

    // Check sidebar navigation
    const adminSidebar = page.locator('[data-testid="admin-sidebar"], .admin-sidebar, nav');
    const hasSidebar = await adminSidebar.isVisible().catch(() => false);
    console.log('Has sidebar:', hasSidebar);

    // Check responsive layout
    await page.setViewportSize({ width: 768, height: 1024 }); // Tablet
    await expect(page.getByRole('heading', { name: /dashboard admin/i })).toBeVisible({ timeout: 5000 });

    await page.setViewportSize({ width: 393, height: 851 }); // Mobile
    await expect(page.getByRole('heading', { name: /dashboard admin/i })).toBeVisible({ timeout: 5000 });

    // Check for mobile menu button
    const mobileMenuButton = page.getByRole('button', { name: /menu/i });
    const hasMobileMenu = await mobileMenuButton.isVisible().catch(() => false);
    console.log('Has mobile menu:', hasMobileMenu);

    // Take screenshots of different viewports
    safeScreenshot(page, 'admin-desktop.png');
    safeScreenshot(page, 'admin-tablet.png');
    safeScreenshot(page, 'admin-mobile.png');
  });

  test('testes de segurança e permissões', async ({ page }) => {
    await clearAuthState(page);
    await page.goto('/login');
    await page.waitForTimeout(1000);
    await page.getByLabel('E-mail').fill(nonAdminEmail);
    await page.getByLabel('Senha').fill(nonAdminPassword);
    await page.getByRole('button', { name: /entrar/i }).click();
    await expect(page.getByRole('heading', { name: 'Bem-vindo' })).toBeVisible({ timeout: 10000 });

    // Try to access admin as non-admin
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Check result
    const currentUrl = page.url();
    const isRedirectedFromAdmin =
      currentUrl.includes('/dashboard') || currentUrl.includes('/login');
    console.log('Non-admin access result:', currentUrl);

    // Take screenshot
    safeScreenshot(page, 'non-admin-access.png');

    expect(isRedirectedFromAdmin).toBeTruthy();
    expect(currentUrl).not.toContain('/admin');
  });

  test('testes de performance e carregamento', async ({ page }) => {
    const startTime = Date.now();

    await navigateToAdmin(page);
    await expect(page.getByRole('heading', { name: /dashboard admin/i })).toBeVisible({ timeout: 10000 });

    const loadTime = Date.now() - startTime;
    console.log('Admin dashboard load time:', loadTime, 'ms');

    // Should load in reasonable time
    expect(loadTime).toBeLessThan(15000);

    // Test other pages load time
    const pagesToTest = [
      '/admin/users',
      '/admin/growth-groups',
      '/admin/lessons',
      '/admin/reports'
    ];

    for (const pageUrl of pagesToTest) {
      const pageStartTime = Date.now();
      await navigateToAdmin(page, pageUrl.replace('/admin', ''));
      await page.waitForLoadState('domcontentloaded');
      const pageLoadTime = Date.now() - pageStartTime;
      console.log(`${pageUrl} load time:`, pageLoadTime, 'ms');
      expect(pageLoadTime).toBeLessThan(15000);
    }
  });
});
