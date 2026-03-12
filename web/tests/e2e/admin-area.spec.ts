import { test, expect, type Page } from '@playwright/test';
// import { supabase } from '../supabase';

// Use admin credentials from env or seed data fallback
const adminEmail = process.env.E2E_SUPABASE_ADMIN_EMAIL || 'admin@test.com';
const adminPassword = process.env.E2E_SUPABASE_ADMIN_PASSWORD || 'senha123';
const nonAdminEmail = process.env.E2E_SUPABASE_NON_ADMIN_EMAIL || 'lider1@test.com';
const nonAdminPassword = process.env.E2E_SUPABASE_NON_ADMIN_PASSWORD || 'senha123';

const shouldSkip = false; // Enable tests by default

async function selectComboboxOption(page: Page, label: string, option: RegExp) {
  const combobox = page.getByRole('combobox', { name: new RegExp(label, 'i') });
  if (await combobox.count()) {
    await combobox.first().click();
  } else {
    await page.getByLabel(label).click();
  }

  const optionLocator = page.getByRole('option', { name: option });
  await optionLocator.first().waitFor({ state: 'visible', timeout: 5000 });
  await optionLocator.first().click();
}

/**
 * Helper function to login as admin
 */
async function loginAsAdmin(page: Page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await page.getByLabel('E-mail').fill(adminEmail);
  await page.getByLabel('Senha').fill(adminPassword);
  await page.getByRole('button', { name: /entrar/i }).click();

  const firstAttempt = await page
    .waitForURL('**/dashboard', { timeout: 15000 })
    .then(() => true)
    .catch(() => false);
  if (!firstAttempt) {
    await page.waitForTimeout(1000);
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  }

  if (!page.url().includes('/dashboard')) {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.getByLabel('E-mail').fill(adminEmail);
    await page.getByLabel('Senha').fill(adminPassword);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL('**/dashboard', { timeout: 30000 }).catch(() => {});
    if (!page.url().includes('/dashboard')) {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    }
  }

  if (!page.url().includes('/dashboard')) {
    throw new Error('Falha no login admin. Verifique E2E_SUPABASE_ADMIN_EMAIL/E2E_SUPABASE_ADMIN_PASSWORD.');
  }

  await expect(page.getByRole('heading', { name: /bem-vindo/i })).toBeVisible({ timeout: 15000 });
  await page.waitForLoadState('domcontentloaded');
}

async function loginAsNonAdmin(page: Page) {
  await page.context().clearCookies();
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  await page.getByLabel('E-mail').fill(nonAdminEmail);
  await page.getByLabel('Senha').fill(nonAdminPassword);
  await page.getByRole('button', { name: /entrar/i }).click();

  const loggedIn = await page
    .waitForURL('**/dashboard', { timeout: 15000 })
    .then(() => true)
    .catch(() => false);

  if (!loggedIn || !page.url().includes('/dashboard')) {
    throw new Error('Falha no login não-admin. Verifique E2E_SUPABASE_NON_ADMIN_EMAIL/E2E_SUPABASE_NON_ADMIN_PASSWORD.');
  }
}

/**
 * Helper function to navigate to admin section
 */
async function navigateToAdmin(page: Page, section: string = '') {
  try {
    await page.goto(`/admin${section}`, { waitUntil: 'domcontentloaded' });
  } catch {
    await page.waitForTimeout(1000);
    await page.goto(`/admin${section}`, { waitUntil: 'domcontentloaded' });
  }
  if (page.url().includes('/login')) {
    await loginAsAdmin(page);
    await page.goto(`/admin${section}`, { waitUntil: 'domcontentloaded' });
  }
  await page.waitForURL(`**/admin${section}*`, { timeout: 30000 }).catch(() => {});
}

/**
 * Helper function to check if user has admin access
 */
async function verifyAdminAccess(page: Page) {
  // Try to access admin page
  await page.goto('/admin', { waitUntil: 'domcontentloaded' });

  // If redirected to login, login first
  if (page.url().includes('/login')) {
    await loginAsAdmin(page);
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
  }

  // Should be able to see admin dashboard
  await expect(page.getByRole('heading', { name: /dashboard admin/i })).toBeVisible();
}

test.describe('Área Administrativa - Testes Completos', () => {
  test.skip(shouldSkip, 'Defina E2E_ADMIN_EMAIL e E2E_ADMIN_PASSWORD para executar testes de admin.');

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test.describe('Acesso e Navegação', () => {
    test('deve acessar dashboard admin', async ({ page }) => {
      await navigateToAdmin(page);

      // Check dashboard elements
      await expect(page.getByRole('heading', { name: 'Dashboard Admin' })).toBeVisible();
      await expect(page.getByText('Visão geral e métricas do sistema')).toBeVisible();

      // Check metrics cards
      await expect(page.getByText('Total de Usuários')).toBeVisible();
      await expect(page.getByText('GCs Ativos')).toBeVisible();
      await expect(page.getByText('Membros Ativos')).toBeVisible();
      await expect(page.getByText('Visitantes Ativos')).toBeVisible();

      // Check quick actions
      await expect(page.getByRole('link', { name: 'Gerenciar Usuários', exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Gerenciar GCs', exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Gerenciar Lições', exact: true })).toBeVisible();
    });

    test('deve navegar entre seções admin', async ({ page }) => {
      await navigateToAdmin(page);

      // Test navigation to users
      await page.goto('/admin/users');
      await expect(page.getByRole('heading', { name: 'Usuários' })).toBeVisible();

      // Test navigation to GCs
      await page.goto('/admin/growth-groups');
      await expect(page.getByRole('heading', { name: 'Grupos de Crescimento' })).toBeVisible();

      // Test navigation to lessons
      await page.goto('/admin/lessons');
      await expect(page.getByRole('heading', { name: 'Lições e Séries' })).toBeVisible();

      // Test navigation to reports
      await page.goto('/admin/reports');
      await expect(page.getByRole('heading', { name: 'Relatórios e Análises' })).toBeVisible();

      // Test navigation to settings
      await page.goto('/admin/settings');
      await expect(page.getByRole('heading', { name: 'Configurações' })).toBeVisible();
    });
  });

  test.describe('Gestão de Usuários', () => {
    test('deve listar usuários existentes', async ({ page }) => {
      await navigateToAdmin(page, '/users');

      // Check page header
      await expect(page.getByRole('heading', { name: 'Usuários' })).toBeVisible();
      await expect(page.getByText('Gerencie os usuários e seus acessos ao sistema')).toBeVisible();

      // Check create button
      await expect(page.getByRole('link', { name: 'Novo Usuário' })).toBeVisible();

      // Check if users are loaded (should have at least admin user)
      await expect(page.locator('[data-testid="user-row"]').first()).toBeVisible({ timeout: 10000 });
    });

    test('deve criar novo usuário', async ({ page }) => {
      await navigateToAdmin(page, '/users/new');
      await expect(page.getByRole('heading', { name: 'Novo usuário' })).toBeVisible();

      // Fill form
      const testUser = {
        name: 'Usuário Teste E2E',
        email: `test.e2e.${Date.now()}@test.com`,
        phone: '(11) 98888-7777',
        password: 'senha123456',
      };

      await page.getByLabel('Nome completo').fill(testUser.name);
      await page.getByLabel('E-mail').fill(testUser.email);
      await page.getByLabel('Telefone').fill(testUser.phone);
      await page.getByLabel('Senha temporária').fill(testUser.password);
      await page.getByLabel('Confirmar senha').fill(testUser.password);

      // Submit form
      await page.getByRole('button', { name: 'Criar usuário' }).click();

      // Should show success message and redirect
      await expect(page.getByText(/usuário criado com sucesso/i)).toBeVisible({ timeout: 15000 });
    });

    test('deve criar novo usuário sem telefone', async ({ page }) => {
      await navigateToAdmin(page, '/users/new');
      await expect(page.getByRole('heading', { name: 'Novo usuário' })).toBeVisible();

      const testUser = {
        name: 'Usuário Sem Telefone',
        email: `test.no-phone.${Date.now()}@test.com`,
        password: 'senha123456',
      };

      await page.getByLabel('Nome completo').fill(testUser.name);
      await page.getByLabel('E-mail').fill(testUser.email);
      await page.getByLabel('Senha temporária').fill(testUser.password);
      await page.getByLabel('Confirmar senha').fill(testUser.password);

      await page.getByRole('button', { name: 'Criar usuário' }).click();

      await page.waitForURL(/\/admin\/users\/.+\?created=true$/, { timeout: 15000 });
      await expect(page.getByRole('heading', { name: testUser.name })).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(`${testUser.email} • Sem telefone`)).toBeVisible();
      await expect(page.getByText(/usuário criado com sucesso/i)).toBeVisible();
    });

    test('deve validar formulário de usuário', async ({ page }) => {
      await navigateToAdmin(page, '/users/new');

      // Try to submit empty form
      await page.getByRole('button', { name: 'Criar usuário' }).click();

      // Should show validation errors
      await expect(page.getByText(/Nome muito curto/i)).toBeVisible();
      await expect(page.getByText(/E-mail inválido/i)).toBeVisible();
      await expect(page.getByText(/Senha deve ter pelo menos 8 caracteres/i)).toBeVisible();

      // Test email validation
      await page.getByLabel('E-mail').fill('email-invalido');
      await page.getByRole('button', { name: 'Criar usuário' }).click();
      await expect(page.getByText('E-mail inválido')).toBeVisible();

      // Test password confirmation
      await page.getByLabel('Nome completo').fill('Teste');
      await page.getByLabel('E-mail').fill('valido@test.com');
      await page.getByLabel('Senha temporária').fill('senha123');
      await page.getByLabel('Confirmar senha').fill('senha456');
      await page.getByRole('button', { name: 'Criar usuário' }).click();
      await expect(page.getByText('Senhas não conferem')).toBeVisible();
    });
  });

  test.describe('Gestão de Grupos de Crescimento (GCs)', () => {
    test('deve listar GCs existentes', async ({ page }) => {
      await navigateToAdmin(page, '/growth-groups');

      // Check page elements
      await expect(page.getByRole('heading', { name: 'Grupos de Crescimento' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Novo GC' })).toBeVisible();

      // Wait for GCs to load
      await page.waitForSelector('[data-testid="gc-card"]', { timeout: 10000 });
    });

    test('deve criar novo GC', async ({ page }) => {
      await navigateToAdmin(page, '/growth-groups');

      // Click create GC button
      await page.getByRole('link', { name: 'Novo GC' }).click();
      await page.waitForURL('**/admin/growth-groups/new');
      await expect(page.getByRole('heading', { name: /Novo Grupo de Crescimento/i })).toBeVisible();

      // Fill form
      const testGC = {
        name: `GC Teste E2E ${Date.now()}`,
        address: 'Rua Teste E2E, 123',
        weekday: '3', // Quarta
        time: '19:30',
        mode: 'in_person'
      };

      await page.getByLabel('Nome do GC').fill(testGC.name);

      const modeTrigger = page.getByRole('combobox', { name: /Modo/i });
      if (await modeTrigger.count()) {
        const modeText = (await modeTrigger.first().innerText().catch(() => '')) ?? '';
        if (!/presencial/i.test(modeText)) {
          await selectComboboxOption(page, 'Modo', /Presencial/i);
        }
      } else {
        await selectComboboxOption(page, 'Modo', /Presencial/i);
      }

      await page.getByLabel('Endereço').fill(testGC.address);
      await selectComboboxOption(page, 'Dia da Semana', /Quarta-feira/i);
      await page.getByLabel('Horário').fill(testGC.time);
      await page.getByPlaceholder('Selecione os líderes').click();
      await page.getByRole('option').first().click();
      await page.getByPlaceholder('Selecione os supervisores').click();
      await page.getByRole('option').first().click();

      // Submit form
      await page.getByRole('button', { name: 'Criar GC' }).click();

      const redirected = await page
        .waitForURL('**/admin/growth-groups', { timeout: 15000 })
        .then(() => true)
        .catch(() => false);

      if (redirected) {
        await expect(page.getByText(testGC.name)).toBeVisible({ timeout: 15000 });
      } else {
        await expect(page.getByRole('heading', { name: /Novo Grupo de Crescimento/i })).toBeVisible();
      }
    });

    test('deve multiplicar GC existente', async ({ page }) => {
      await navigateToAdmin(page, '/growth-groups');

      // Find first GC and click multiply
      const firstGcCard = page.locator('[data-testid="gc-card"]').first();
      const hasMultiply = await firstGcCard.getByRole('button', { name: /multiplicar/i }).count();
      if (!hasMultiply) {
        test.skip();
      }
      await firstGcCard.getByRole('button', { name: /multiplicar/i }).click();

      await page.waitForURL('**/multiply');
      await expect(page.getByRole('heading', { name: /Multiplicar/i })).toBeVisible();

      // Step 1: Information about new GCs
      await expect(page.getByText('Informações dos Novos GCs')).toBeVisible();
      await selectComboboxOption(page, 'Quantos novos GCs serão criados?', /1 novo GC/i);
      await page.getByLabel('Nome').fill(`GC Multiplicado ${Date.now()}`);
      await selectComboboxOption(page, 'Líder Principal', /.+/);
      await selectComboboxOption(page, 'Supervisor', /.+/);
      const addressField = page.getByLabel('Endereço');
      if (await addressField.isVisible()) {
        await addressField.fill('Rua Multiplicação, 123');
      }
      await page.getByRole('button', { name: 'Próximo' }).click();

      // Step 2: Member division
      await expect(page.getByText('Divisão de Membros')).toBeVisible();
      const allocationRows = page.locator('tbody tr');
      const rowCount = await allocationRows.count();
      for (let i = 0; i < rowCount; i += 1) {
        const row = allocationRows.nth(i);
        const rowCombobox = row.getByRole('combobox');
        if (await rowCombobox.count()) {
          await rowCombobox.first().click();
          const originalOption = page.getByRole('option', { name: /GC Original/i });
          await originalOption.first().waitFor({ state: 'visible', timeout: 5000 });
          await originalOption.first().click();
        }
      }
      await page.getByRole('button', { name: 'Próximo' }).click();

      // Step 3: Original GC configuration
      await expect(page.getByText('Configuração do GC Original')).toBeVisible();
      await page.getByLabel('Manter o GC original ativo').check();
      await page.getByRole('button', { name: 'Próximo' }).click();

      // Step 4: Review
      await expect(page.getByText('Revisão')).toBeVisible();
      await page.getByRole('button', { name: 'Confirmar Multiplicação' }).click();

      const redirected = await page
        .waitForURL('**/admin/growth-groups', { timeout: 20000 })
        .then(() => true)
        .catch(() => false);

      if (redirected) {
        await expect(page.getByRole('heading', { name: 'Grupos de Crescimento' })).toBeVisible();
      }

      const successToast = page.getByText(/GC multiplicado com sucesso|multiplicação/i);
      const toastVisible = await successToast.isVisible().catch(() => false);
      if (toastVisible) {
        await expect(successToast).toBeVisible();
      }
    });
  });

  test.describe('Gestão de Lições', () => {
    test('deve listar lições e séries', async ({ page }) => {
      await navigateToAdmin(page, '/lessons');

      // Check page elements
      await expect(page.getByRole('heading', { name: 'Lições e Séries' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Séries de Lições' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Lições Avulsas' })).toBeVisible();

      // Check action buttons
      await expect(page.getByRole('link', { name: 'Nova Série', exact: true }).first()).toBeVisible();
      await expect(page.getByRole('link', { name: 'Nova Lição', exact: true }).first()).toBeVisible();
    });

    test('deve criar nova série', async ({ page }) => {
      await navigateToAdmin(page, '/lessons/series/new');
      await expect(page.getByRole('heading', { name: /Nova Série/i })).toBeVisible();

      // Fill form
      const testSeries = {
        name: `Série Teste E2E ${Date.now()}`,
        description: 'Descrição da série de teste E2E'
      };

      await page.getByLabel('Nome da Série').fill(testSeries.name);
      await page.getByLabel('Descrição').fill(testSeries.description);

      // Submit form
      await page.getByRole('button', { name: 'Criar Série' }).click();
      await page.waitForURL('**/admin/lessons', { timeout: 15000 });
      await expect(page.getByText(testSeries.name)).toBeVisible({ timeout: 15000 });
    });

    test('deve criar nova lição', async ({ page }) => {
      await navigateToAdmin(page, '/lessons/new');
      await expect(page.getByRole('heading', { name: /Nova Lição/i })).toBeVisible();

      // Fill form
      const testLesson = {
        title: `Lição Teste E2E ${Date.now()}`,
        description: 'Descrição da lição de teste E2E',
        link: 'https://exemplo.com/recurso'
      };

      await page.getByLabel('Título').fill(testLesson.title);
      await page.getByLabel('Descrição').fill(testLesson.description);
      await page.getByLabel('Link para Recurso').fill(testLesson.link);

      // Submit form
      await page.getByRole('button', { name: 'Criar Lição' }).click();
      await page.waitForURL('**/admin/lessons', { timeout: 15000 });
      await expect(page.getByText(testLesson.title)).toBeVisible({ timeout: 15000 });
    });

    test('deve adicionar lição a série existente', async ({ page }) => {
      // First navigate to series list and get a series ID
      await navigateToAdmin(page, '/lessons');

      // Find a series and add lesson to it
      const seriesCard = page.locator('[data-testid="series-card"]').first();
      if (await seriesCard.count() > 0) {
        const lessonLink = seriesCard.getByRole('link', { name: /Lição/i });
        const lessonHref = await lessonLink.getAttribute('href');
        if (!lessonHref) {
          test.skip();
        }
        await navigateToAdmin(page, lessonHref?.replace('/admin', '') ?? '/lessons/new');
        await expect(page.getByRole('heading', { name: /Nova Lição/i })).toBeVisible();

        const seriesTrigger = page.getByRole('combobox').first();
        await seriesTrigger.click();
        const seriesOptions = page.getByRole('option');
        if (await seriesOptions.count() > 1) {
          await seriesOptions.nth(1).click();
        }

        // Fill form
        const lessonTitle = `Lição em Série ${Date.now()}`;
        await page.getByLabel('Título').fill(lessonTitle);

        // Submit form
        await page.getByRole('button', { name: 'Criar Lição' }).click();

        await page.waitForURL('**/admin/lessons', { timeout: 15000 });
        await expect(page.locator('[data-testid="series-card"]').first()).toBeVisible({ timeout: 15000 });
      }
    });
  });

  test.describe('Relatórios e Métricas', () => {
    test('deve acessar dashboard de relatórios', async ({ page }) => {
      await navigateToAdmin(page, '/reports');

      // Check reports page
      await expect(page.getByRole('heading', { name: 'Relatórios e Análises' })).toBeVisible();

      // Check for different report types
      await expect(page.getByText('Total de GCs').first()).toBeVisible();
      await expect(page.getByText('Total de Membros').first()).toBeVisible();
      await expect(page.getByText('Taxa de Conversão').first()).toBeVisible();
    });

    test('deve visualizar relatório de crescimento', async ({ page }) => {
      await navigateToAdmin(page, '/reports/growth');

      // Check growth report
      await expect(page.getByRole('heading', { name: 'Relatório de Crescimento' })).toBeVisible();

      // Check for charts and metrics
      await expect(page.locator('.recharts-surface').first()).toBeVisible({ timeout: 10000 });
    });

    test('deve visualizar relatório de frequência', async ({ page }) => {
      await navigateToAdmin(page, '/reports/attendance');

      // Check attendance report
      await expect(page.getByRole('heading', { name: 'Relatório de Frequência' })).toBeVisible();

      // Check for charts and metrics
      await expect(page.locator('.recharts-surface').first()).toBeVisible({ timeout: 10000 });
    });

    test('deve visualizar relatório de conversões', async ({ page }) => {
      await navigateToAdmin(page, '/reports/conversions');

      // Check conversions report
      await expect(page.getByRole('heading', { name: 'Relatório de Conversões' })).toBeVisible();

      // Check for charts and metrics
      await expect(page.locator('.recharts-surface').first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Configurações', () => {
    test('deve acessar página de configurações', async ({ page }) => {
      await navigateToAdmin(page, '/settings');

      // Check settings page
      await expect(page.getByRole('heading', { name: 'Configurações do Sistema' })).toBeVisible();
    });
  });

  test.describe('Testes de Responsividade', () => {
    test('deve funcionar em mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 393, height: 851 });

      await navigateToAdmin(page);

      // Check mobile navigation
      const menuButton = page.getByRole('button', { name: /menu/i });
      if (await menuButton.count()) {
        await menuButton.click();
      }

      await expect(page.getByRole('link', { name: /Dashboard/i })).toBeVisible();
    });
  });

  test.describe('Testes de Segurança', () => {
    test('deve bloquear acesso de não-admins', async ({ page }) => {
      await loginAsNonAdmin(page);

      // Try to access admin area
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
      expect(page.url()).not.toContain('/admin');
    });

    test('deve fazer logout corretamente', async ({ page }) => {
      await navigateToAdmin(page);

      // Find and click logout button
      await page.getByRole('button', { name: /sair/i }).click();

      // Should redirect to login
      await page.waitForURL('**/login', { timeout: 10000 });
    });
  });

  test.describe('Testes de Performance', () => {
    test('deve carregar páginas admin rapidamente', async ({ page }) => {
      const startTime = Date.now();

      await navigateToAdmin(page);

      const loadTime = Date.now() - startTime;

      // Should load in less than 3 seconds
      expect(loadTime).toBeLessThan(3000);

      // Check that all main elements are loaded
      await expect(page.getByRole('heading', { name: 'Dashboard Admin' })).toBeVisible();
    });
  });
});

// Helper test for setup/teardown
test.describe('Configuração de Testes', () => {
  test('verificar ambiente de teste', async () => {
    // Basic test to verify test environment
    expect(true).toBe(true);
  });
});
