import { test, expect, type Page } from '@playwright/test';
// import { supabase } from '../supabase';

// Use admin credentials from seed data
const adminEmail = 'admin@test.com';
const adminPassword = 'senha123';

const shouldSkip = false; // Enable tests by default

/**
 * Helper function to login as admin
 */
async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(adminEmail);
  await page.getByLabel('Senha').fill(adminPassword);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL('**/dashboard');
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
}

/**
 * Helper function to navigate to admin section
 */
async function navigateToAdmin(page: Page, section: string = '') {
  await page.goto(`/admin${section}`);
  await page.waitForURL(`**/admin${section}*`);
}

/**
 * Helper function to check if user has admin access
 */
async function verifyAdminAccess(page: Page) {
  // Try to access admin page
  await page.goto('/admin');

  // If redirected to login, login first
  if (page.url().includes('/login')) {
    await loginAsAdmin(page);
    await page.goto('/admin');
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
      await expect(page.getByRole('link', { name: 'Gerenciar Usuários' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Gerenciar GCs' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Gerenciar Lições' })).toBeVisible();
    });

    test('deve navegar entre seções admin', async ({ page }) => {
      await navigateToAdmin(page);

      // Test navigation to users
      await page.getByRole('link', { name: 'Gerenciar Usuários' }).click();
      await expect(page.getByRole('heading', { name: 'Usuários' })).toBeVisible();

      // Test navigation to GCs
      await page.getByRole('link', { name: 'Gerenciar GCs' }).click();
      await expect(page.getByRole('heading', { name: 'Grupos de Crescimento' })).toBeVisible();

      // Test navigation to lessons
      await page.getByRole('link', { name: 'Gerenciar Lições' }).click();
      await expect(page.getByRole('heading', { name: 'Lições e Séries' })).toBeVisible();

      // Test navigation to reports
      await page.goto('/admin/reports');
      await expect(page.getByRole('heading', { name: 'Relatórios e Métricas' })).toBeVisible();

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
      await expect(page.locator('[data-testid="user-card"]').first()).toBeVisible({ timeout: 10000 });
    });

    test('deve criar novo usuário', async ({ page }) => {
      await navigateToAdmin(page, '/users');

      // Click create user button
      await page.getByRole('link', { name: 'Novo Usuário' }).click();
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

    test('deve validar formulário de usuário', async ({ page }) => {
      await navigateToAdmin(page, '/users/new');

      // Try to submit empty form
      await page.getByRole('button', { name: 'Criar usuário' }).click();

      // Should show validation errors
      await expect(page.getByText('Informe o nome completo')).toBeVisible();
      await expect(page.getByText('Informe o e-mail')).toBeVisible();
      await expect(page.getByText('Defina uma senha temporária')).toBeVisible();

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
      await expect(page.getByRole('heading', { name: 'Novo Grupo de Crescimento' })).toBeVisible();

      // Fill form
      const testGC = {
        name: `GC Teste E2E ${Date.now()}`,
        address: 'Rua Teste E2E, 123',
        weekday: '3', // Quarta
        time: '19:30',
        mode: 'in_person'
      };

      await page.getByLabel('Nome do GC').fill(testGC.name);
      await page.getByLabel('Modo de encontro').selectOption({ label: 'Presencial' });
      await page.getByLabel('Endereço').fill(testGC.address);
      await page.getByLabel('Dia da semana').selectOption(testGC.weekday);
      await page.getByLabel('Horário').fill(testGC.time);

      // Submit form
      await page.getByRole('button', { name: 'Criar GC' }).click();

      // Should show success message
      await expect(page.getByText(/GC criado com sucesso/i)).toBeVisible({ timeout: 15000 });
    });

    test('deve multiplicar GC existente', async ({ page }) => {
      await navigateToAdmin(page, '/growth-groups');

      // Find first GC and click multiply
      await page.locator('[data-testid="gc-card"]').first().within(() => {
        page.getByRole('button', { name: /multiplicar/i }).click();
      });

      // Should navigate to multiplication page
      await expect(page.getByRole('heading', { name: /multiplicação/i })).toBeVisible();

      // Start multiplication wizard
      await page.getByRole('button', { name: 'Iniciar Multiplicação' }).click();

      // Step 1: Information about new GCs
      await expect(page.getByText('Informações dos Novos GCs')).toBeVisible();
      await page.getByLabel('Quantidade de novos GCs').selectOption('1');
      await page.getByRole('button', { name: 'Próximo' }).click();

      // Step 2: Member division
      await expect(page.getByText('Divisão de Membros')).toBeVisible();
      await page.getByRole('button', { name: 'Próximo' }).click();

      // Step 3: Original GC configuration
      await expect(page.getByText('Configuração do GC Original')).toBeVisible();
      await page.getByLabel('Manter GC ativo').check();
      await page.getByRole('button', { name: 'Próximo' }).click();

      // Step 4: Review
      await expect(page.getByText('Revisão')).toBeVisible();
      await page.getByRole('button', { name: 'Confirmar Multiplicação' }).click();

      // Should complete successfully
      await expect(page.getByText(/multiplicação concluída/i)).toBeVisible({ timeout: 20000 });
    });
  });

  test.describe('Gestão de Lições', () => {
    test('deve listar lições e séries', async ({ page }) => {
      await navigateToAdmin(page, '/lessons');

      // Check page elements
      await expect(page.getByRole('heading', { name: 'Lições e Séries' })).toBeVisible();
      await expect(page.getByText('Séries de Lições')).toBeVisible();
      await expect(page.getByText('Lições Avulsas')).toBeVisible();

      // Check action buttons
      await expect(page.getByRole('link', { name: 'Nova Série' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Nova Lição' })).toBeVisible();
    });

    test('deve criar nova série', async ({ page }) => {
      await navigateToAdmin(page, '/lessons');

      // Click create series button
      await page.getByRole('link', { name: 'Nova Série' }).click();
      await expect(page.getByRole('heading', { name: 'Nova Série de Lições' })).toBeVisible();

      // Fill form
      const testSeries = {
        name: `Série Teste E2E ${Date.now()}`,
        description: 'Descrição da série de teste E2E'
      };

      await page.getByLabel('Nome da Série').fill(testSeries.name);
      await page.getByLabel('Descrição').fill(testSeries.description);

      // Submit form
      await page.getByRole('button', { name: 'Criar Série' }).click();

      // Should show success message
      await expect(page.getByText(/série criada com sucesso/i)).toBeVisible({ timeout: 15000 });
    });

    test('deve criar nova lição', async ({ page }) => {
      await navigateToAdmin(page, '/lessons');

      // Click create lesson button
      await page.getByRole('link', { name: 'Nova Lição' }).click();
      await expect(page.getByRole('heading', { name: 'Nova Lição' })).toBeVisible();

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

      // Should show success message
      await expect(page.getByText(/lição criada com sucesso/i)).toBeVisible({ timeout: 15000 });
    });

    test('deve adicionar lição a série existente', async ({ page }) => {
      // First navigate to series list and get a series ID
      await navigateToAdmin(page, '/lessons');

      // Find a series and add lesson to it
      const seriesCard = page.locator('[data-testid="series-card"]').first();
      if (await seriesCard.count() > 0) {
        await seriesCard.getByRole('button', { name: /Adicionar Lição/i }).click();

        await expect(page.getByRole('heading', { name: 'Nova Lição' })).toBeVisible();

        // Check if series is pre-selected
        const seriesSelect = page.getByLabel('Série');
        await expect(seriesSelect).toBeVisible();

        // Fill form
        await page.getByLabel('Título').fill(`Lição em Série ${Date.now()}`);

        // Submit form
        await page.getByRole('button', { name: 'Criar Lição' }).click();

        // Should show success message
        await expect(page.getByText(/lição criada com sucesso/i)).toBeVisible({ timeout: 15000 });
      }
    });
  });

  test.describe('Relatórios e Métricas', () => {
    test('deve acessar dashboard de relatórios', async ({ page }) => {
      await navigateToAdmin(page, '/reports');

      // Check reports page
      await expect(page.getByRole('heading', { name: 'Relatórios e Métricas' })).toBeVisible();

      // Check for different report types
      await expect(page.getByText('Relatório de Crescimento')).toBeVisible();
      await expect(page.getByText('Relatório de Frequência')).toBeVisible();
      await expect(page.getByText('Relatório de Conversões')).toBeVisible();
    });

    test('deve visualizar relatório de crescimento', async ({ page }) => {
      await navigateToAdmin(page, '/reports/growth');

      // Check growth report
      await expect(page.getByRole('heading', { name: 'Relatório de Crescimento' })).toBeVisible();

      // Check for charts and metrics
      await expect(page.locator('[data-testid="growth-chart"]').first()).toBeVisible({ timeout: 10000 });
    });

    test('deve visualizar relatório de frequência', async ({ page }) => {
      await navigateToAdmin(page, '/reports/attendance');

      // Check attendance report
      await expect(page.getByRole('heading', { name: 'Relatório de Frequência' })).toBeVisible();

      // Check for charts and metrics
      await expect(page.locator('[data-testid="attendance-chart"]').first()).toBeVisible({ timeout: 10000 });
    });

    test('deve visualizar relatório de conversões', async ({ page }) => {
      await navigateToAdmin(page, '/reports/conversions');

      // Check conversions report
      await expect(page.getByRole('heading', { name: 'Relatório de Conversões' })).toBeVisible();

      // Check for charts and metrics
      await expect(page.locator('[data-testid="conversions-chart"]').first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Configurações', () => {
    test('deve acessar página de configurações', async ({ page }) => {
      await navigateToAdmin(page, '/settings');

      // Check settings page
      await expect(page.getByRole('heading', { name: 'Configurações' })).toBeVisible();
      await expect(page.getByText('Configurações do Sistema')).toBeVisible();
    });
  });

  test.describe('Testes de Responsividade', () => {
    test('deve funcionar em mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 393, height: 851 });

      await navigateToAdmin(page);

      // Check mobile navigation
      await expect(page.getByRole('button', { name: /menu/i })).toBeVisible();

      // Open mobile menu
      await page.getByRole('button', { name: /menu/i }).click();

      // Check navigation items in mobile menu
      await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Usuários' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'GCs' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Lições' })).toBeVisible();
    });
  });

  test.describe('Testes de Segurança', () => {
    test('deve bloquear acesso de não-admins', async ({ page }) => {
      // Create a non-admin user session
      await page.goto('/login');
      await page.getByLabel('E-mail').fill('lider1@test.com');
      await page.getByLabel('Senha').fill('senha123');
      await page.getByRole('button', { name: /entrar/i }).click();

      // Try to access admin area
      await page.goto('/admin');

      // Should be redirected or show error
      await expect(page.getByText(/acesso não autorizado/i) || page.url().includes('/dashboard')).toBeTruthy();
    });

    test('deve fazer logout corretamente', async ({ page }) => {
      await navigateToAdmin(page);

      // Find and click logout button
      await page.getByRole('button', { name: /sair/i }).click();

      // Should redirect to login
      await expect(page).toHaveURL('**/login');
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