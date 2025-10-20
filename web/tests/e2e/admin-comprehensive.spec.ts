import { test, expect, type Page } from '@playwright/test';

// Use admin credentials from seed data
const adminEmail = 'admin@test.com';
const adminPassword = 'senha123';

/**
 * Helper function to login as admin
 */
async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(adminEmail);
  await page.getByLabel('Senha').fill(adminPassword);
  await page.getByRole('button', { name: /entrar/i }).click();

  // Wait for dashboard - look for "Bem-vindo" heading
  await expect(page.getByRole('heading', { name: 'Bem-vindo' })).toBeVisible({ timeout: 10000 });
}

test.describe('Área Administrativa - Testes Completos', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('dashboard admin - verificação completa', async ({ page }) => {
    await page.goto('/admin');

    // Check if admin dashboard loads
    await expect(page.getByRole('heading', { name: 'Dashboard Admin' })).toBeVisible({ timeout: 10000 });

    // Check metrics cards
    await expect(page.getByText('Total de Usuários')).toBeVisible();
    await expect(page.getByText('GCs Ativos')).toBeVisible();
    await expect(page.getByText('Membros Ativos')).toBeVisible();
    await expect(page.getByText('Visitantes Ativos')).toBeVisible();

    // Check quick actions
    await expect(page.getByRole('link', { name: 'Gerenciar Usuários' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Gerenciar GCs' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Gerenciar Lições' })).toBeVisible();

    // Take screenshot for visual verification
    await page.screenshot({ path: 'admin-dashboard-complete.png' });
  });

  test('gestão de usuários - fluxo completo', async ({ page }) => {
    // Navigate to users page
    await page.getByRole('link', { name: 'Gerenciar Usuários' }).click();
    await expect(page.getByRole('heading', { name: 'Usuários' })).toBeVisible({ timeout: 10000 });

    // Check create user button
    await expect(page.getByRole('link', { name: 'Novo Usuário' })).toBeVisible();

    // Navigate to create user form
    await page.getByRole('link', { name: 'Novo Usuário' }).click();
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
    await expect(page.getByText('Informe o nome completo')).toBeVisible({ timeout: 5000 });

    // Test invalid email
    await page.getByLabel('E-mail').fill('email-invalido');
    await page.getByRole('button', { name: 'Criar usuário' }).click();
    await expect(page.getByText('E-mail inválido')).toBeVisible({ timeout: 5000 });

    // Test password mismatch
    await page.getByLabel('Nome completo').fill('Teste E2E');
    await page.getByLabel('E-mail').fill('teste@e2e.com');
    await page.getByLabel('Senha temporária').fill('senha123');
    await page.getByLabel('Confirmar senha').fill('senha456');
    await page.getByRole('button', { name: 'Criar usuário' }).click();
    await expect(page.getByText('Senhas não conferem')).toBeVisible({ timeout: 5000 });

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

    // Wait for result (either success or error)
    await page.waitForTimeout(3000);

    // Take screenshot to see result
    await page.screenshot({ path: 'user-creation-result.png' });
  });

  test('gestão de GCs - fluxo básico', async ({ page }) => {
    // Navigate to GCs page
    await page.getByRole('link', { name: 'Gerenciar GCs' }).click();
    await expect(page.getByRole('heading', { name: 'Grupos de Crescimento' })).toBeVisible({ timeout: 10000 });

    // Check create GC button
    await expect(page.getByRole('link', { name: 'Novo GC' })).toBeVisible();

    // Navigate to create GC form
    await page.getByRole('link', { name: 'Novo GC' }).click();
    await expect(page.getByRole('heading', { name: 'Novo Grupo de Crescimento' })).toBeVisible({ timeout: 10000 });

    // Check form fields
    await expect(page.getByLabel('Nome do GC')).toBeVisible();
    await expect(page.getByLabel('Modo de encontro')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Criar GC' })).toBeVisible();

    // Fill form with test data
    const testGC = {
      name: `GC Teste E2E ${Date.now()}`,
      mode: 'in_person'
    };

    await page.getByLabel('Nome do GC').fill(testGC.name);
    await page.getByLabel('Modo de encontro').selectOption({ label: 'Presencial' });

    // If address field appears (for presencial)
    const addressField = page.getByLabel('Endereço');
    if (await addressField.isVisible()) {
      await addressField.fill('Rua Teste E2E, 123');
    }

    // Try to submit
    await page.getByRole('button', { name: 'Criar GC' }).click();
    await page.waitForTimeout(3000);

    // Take screenshot to see result
    await page.screenshot({ path: 'gc-creation-result.png' });
  });

  test('gestão de lições - fluxo básico', async ({ page }) => {
    // Navigate to lessons page
    await page.getByRole('link', { name: 'Gerenciar Lições' }).click();
    await expect(page.getByRole('heading', { name: 'Lições e Séries' })).toBeVisible({ timeout: 10000 });

    // Check action buttons
    await expect(page.getByRole('link', { name: 'Nova Série' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Nova Lição' })).toBeVisible();

    // Test series creation
    await page.getByRole('link', { name: 'Nova Série' }).click();
    await expect(page.getByRole('heading', { name: 'Nova Série de Lições' })).toBeVisible({ timeout: 10000 });

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
    await page.waitForTimeout(3000);

    // Test lesson creation
    await page.goto('/admin/lessons/new');
    await expect(page.getByRole('heading', { name: 'Nova Lição' })).toBeVisible({ timeout: 10000 });

    // Check lesson form fields
    await expect(page.getByLabel('Título')).toBeVisible();
    await expect(page.getByLabel('Descrição')).toBeVisible();
    await expect(page.getByLabel('Série')).toBeVisible();
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
    await page.waitForTimeout(3000);

    // Take screenshots for verification
    await page.screenshot({ path: 'lesson-series-result.png' });
  });

  test('relatórios - acesso básico', async ({ page }) => {
    // Navigate to reports
    await page.goto('/admin/reports');
    await expect(page.getByRole('heading', { name: 'Relatórios e Métricas' })).toBeVisible({ timeout: 10000 });

    // Check for report types
    await expect(page.getByText('Relatório de Crescimento')).toBeVisible();
    await expect(page.getByText('Relatório de Frequência')).toBeVisible();
    await expect(page.getByText('Relatório de Conversões')).toBeVisible();

    // Test individual report pages
    await page.goto('/admin/reports/growth');
    await expect(page.getByRole('heading', { name: 'Relatório de Crescimento' })).toBeVisible({ timeout: 10000 });

    await page.goto('/admin/reports/attendance');
    await expect(page.getByRole('heading', { name: 'Relatório de Frequência' })).toBeVisible({ timeout: 10000 });

    await page.goto('/admin/reports/conversions');
    await expect(page.getByRole('heading', { name: 'Relatório de Conversões' })).toBeVisible({ timeout: 10000 });

    // Take screenshot
    await page.screenshot({ path: 'reports-access.png' });
  });

  test('configurações - acesso básico', async ({ page }) => {
    // Navigate to settings
    await page.goto('/admin/settings');
    await expect(page.getByRole('heading', { name: 'Configurações' })).toBeVisible({ timeout: 10000 });

    // Take screenshot
    await page.screenshot({ path: 'settings-access.png' });
  });

  test('testes de navegação e layout', async ({ page }) => {
    await page.goto('/admin');

    // Check sidebar navigation
    const adminSidebar = page.locator('[data-testid="admin-sidebar"], .admin-sidebar, nav');
    const hasSidebar = await adminSidebar.isVisible().catch(() => false);
    console.log('Has sidebar:', hasSidebar);

    // Check responsive layout
    await page.setViewportSize({ width: 768, height: 1024 }); // Tablet
    await page.waitForTimeout(1000);
    await expect(page.getByRole('heading', { name: 'Dashboard Admin' })).toBeVisible({ timeout: 5000 });

    await page.setViewportSize({ width: 393, height: 851 }); // Mobile
    await page.waitForTimeout(1000);
    await expect(page.getByRole('heading', { name: 'Dashboard Admin' })).toBeVisible({ timeout: 5000 });

    // Check for mobile menu button
    const mobileMenuButton = page.getByRole('button', { name: /menu/i });
    const hasMobileMenu = await mobileMenuButton.isVisible().catch(() => false);
    console.log('Has mobile menu:', hasMobileMenu);

    // Take screenshots of different viewports
    await page.screenshot({ path: 'admin-desktop.png' });
    await page.screenshot({ path: 'admin-tablet.png' });
    await page.screenshot({ path: 'admin-mobile.png' });
  });

  test('testes de segurança e permissões', async ({ page }) => {
    // First logout
    await page.goto('/login');
    await page.getByLabel('E-mail').fill('lider1@test.com');
    await page.getByLabel('Senha').fill('senha123');
    await page.getByRole('button', { name: /entrar/i }).click();
    await expect(page.getByRole('heading', { name: 'Bem-vindo' })).toBeVisible({ timeout: 10000 });

    // Try to access admin as non-admin
    await page.goto('/admin');
    await page.waitForTimeout(3000);

    // Check result
    const currentUrl = page.url();
    const isRedirectedFromAdmin = !currentUrl.includes('/admin');
    console.log('Non-admin access result:', currentUrl);

    // Take screenshot
    await page.screenshot({ path: 'non-admin-access.png' });

    expect(isRedirectedFromAdmin).toBeTruthy();
  });

  test('testes de performance e carregamento', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Dashboard Admin' })).toBeVisible({ timeout: 10000 });

    const loadTime = Date.now() - startTime;
    console.log('Admin dashboard load time:', loadTime, 'ms');

    // Should load in reasonable time
    expect(loadTime).toBeLessThan(5000);

    // Test other pages load time
    const pagesToTest = [
      '/admin/users',
      '/admin/growth-groups',
      '/admin/lessons',
      '/admin/reports'
    ];

    for (const pageUrl of pagesToTest) {
      const pageStartTime = Date.now();
      await page.goto(pageUrl);
      await page.waitForTimeout(2000); // Wait for content to load
      const pageLoadTime = Date.now() - pageStartTime;
      console.log(`${pageUrl} load time:`, pageLoadTime, 'ms');
      expect(pageLoadTime).toBeLessThan(5000);
    }
  });
});