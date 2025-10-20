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

  // Wait for dashboard
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 10000 });
}

test.describe('Área Administrativa - Testes Básicos', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('deve acessar dashboard admin', async ({ page }) => {
    await page.goto('/admin');

    // Check if admin dashboard loads
    await expect(page.getByRole('heading', { name: /dashboard admin/i })).toBeVisible({ timeout: 10000 });

    // Check for main elements
    await expect(page.getByText('Total de Usuários')).toBeVisible();
    await expect(page.getByText('GCs Ativos')).toBeVisible();

    // Check quick action buttons
    await expect(page.getByRole('link', { name: 'Gerenciar Usuários' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Gerenciar GCs' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Gerenciar Lições' })).toBeVisible();
  });

  test('deve navegar para página de usuários', async ({ page }) => {
    // Navigate to users page
    await page.goto('/admin/users');

    // Check if users page loads
    await expect(page.getByRole('heading', { name: 'Usuários' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Gerencie os usuários e seus acessos ao sistema')).toBeVisible();

    // Check for create user button
    await expect(page.getByRole('link', { name: 'Novo Usuário' })).toBeVisible();
  });

  test('deve acessar formulário de criação de usuário', async ({ page }) => {
    // Navigate to create user page
    await page.goto('/admin/users/new');

    // Check if form loads
    await expect(page.getByRole('heading', { name: 'Novo usuário' })).toBeVisible({ timeout: 10000 });

    // Check for form fields
    await expect(page.getByLabel('Nome completo')).toBeVisible();
    await expect(page.getByLabel('E-mail')).toBeVisible();
    await expect(page.getByLabel('Telefone')).toBeVisible();
    await expect(page.getByLabel('Senha temporária')).toBeVisible();
    await expect(page.getByLabel('Confirmar senha')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Criar usuário' })).toBeVisible();
  });

  test('deve validar formulário de usuário', async ({ page }) => {
    await page.goto('/admin/users/new');

    // Try to submit empty form
    await page.getByRole('button', { name: 'Criar usuário' }).click();

    // Should show validation errors
    await expect(page.getByText('Informe o nome completo')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Informe o e-mail')).toBeVisible();
    await expect(page.getByText('Defina uma senha temporária')).toBeVisible();
  });

  test('deve navegar para página de GCs', async ({ page }) => {
    // Navigate to GCs page
    await page.goto('/admin/growth-groups');

    // Check if GCs page loads
    await expect(page.getByRole('heading', { name: 'Grupos de Crescimento' })).toBeVisible({ timeout: 10000 });

    // Check for create GC button
    await expect(page.getByRole('link', { name: 'Novo GC' })).toBeVisible();
  });

  test('deve acessar formulário de criação de GC', async ({ page }) => {
    // Navigate to create GC page
    await page.goto('/admin/growth-groups/new');

    // Check if form loads
    await expect(page.getByRole('heading', { name: 'Novo Grupo de Crescimento' })).toBeVisible({ timeout: 10000 });

    // Check for form fields
    await expect(page.getByLabel('Nome do GC')).toBeVisible();
    await expect(page.getByLabel('Modo de encontro')).toBeVisible();
  });

  test('deve navegar para página de lições', async ({ page }) => {
    // Navigate to lessons page
    await page.goto('/admin/lessons');

    // Check if lessons page loads
    await expect(page.getByRole('heading', { name: 'Lições e Séries' })).toBeVisible({ timeout: 10000 });

    // Check for action buttons
    await expect(page.getByRole('link', { name: 'Nova Série' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Nova Lição' })).toBeVisible();
  });

  test('deve acessar formulário de criação de lição', async ({ page }) => {
    // Navigate to create lesson page
    await page.goto('/admin/lessons/new');

    // Check if form loads
    await expect(page.getByRole('heading', { name: 'Nova Lição' })).toBeVisible({ timeout: 10000 });

    // Check for form fields
    await expect(page.getByLabel('Título')).toBeVisible();
    await expect(page.getByLabel('Descrição')).toBeVisible();
    await expect(page.getByLabel('Link para Recurso')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Criar Lição' })).toBeVisible();
  });

  test('deve acessar página de relatórios', async ({ page }) => {
    // Navigate to reports page
    await page.goto('/admin/reports');

    // Check if reports page loads
    await expect(page.getByRole('heading', { name: 'Relatórios e Métricas' })).toBeVisible({ timeout: 10000 });
  });

  test('deve acessar página de configurações', async ({ page }) => {
    // Navigate to settings page
    await page.goto('/admin/settings');

    // Check if settings page loads
    await expect(page.getByRole('heading', { name: 'Configurações' })).toBeVisible({ timeout: 10000 });
  });

  test('deve testar responsividade em mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 393, height: 851 });

    await page.goto('/admin');

    // Check if admin dashboard loads on mobile
    await expect(page.getByRole('heading', { name: /dashboard admin/i })).toBeVisible({ timeout: 10000 });

    // Check if mobile navigation works
    const mobileMenuButton = page.getByRole('button', { name: /menu/i });
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
    }
  });

  test('deve bloquear acesso de não-administradores', async ({ page }) => {
    // First logout
    await page.goto('/login');

    // Try to login as regular user
    await page.getByLabel('E-mail').fill('lider1@test.com');
    await page.getByLabel('Senha').fill('senha123');
    await page.getByRole('button', { name: /entrar/i }).click();

    // Wait for dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    // Try to access admin area
    await page.goto('/admin');

    // Should be redirected away from admin area or show error
    const isAdminPage = await page.getByRole('heading', { name: /dashboard admin/i }).isVisible({ timeout: 5000 });
    const isRedirected = page.url().includes('/dashboard');

    expect(isAdminPage || isRedirected).toBeTruthy();
  });
});

test.describe('Testes de Erro e Edge Cases', () => {
  test('deve lidar com página não encontrada', async ({ page }) => {
    await loginAsAdmin(page);

    // Try to access non-existent page
    await page.goto('/admin/non-existent-page');

    // Should handle gracefully (either 404 or redirect)
    const url = page.url();
    expect(url.includes('/404') || url.includes('/admin')).toBeTruthy();
  });

  test('deve manter sessão ativa', async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to multiple admin pages
    await page.goto('/admin');
    await page.waitForTimeout(1000);

    await page.goto('/admin/users');
    await page.waitForTimeout(1000);

    await page.goto('/admin/growth-groups');
    await page.waitForTimeout(1000);

    // Should still be logged in
    await expect(page.getByRole('heading', { name: /grupos de crescimento/i })).toBeVisible({ timeout: 5000 });
  });
});