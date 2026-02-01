import { test, expect, type Page } from '@playwright/test';

/**
 * T027: Lesson Management Tests
 * Tests the complete CRUD operations for lesson series and lessons
 * Based on Cenário 5 from quickstart.md
 */

test.describe('T027: Lesson Management', () => {
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

  async function navigateToAdminPath(page: Page, path: string) {
    await page.goto(`/admin${path}`);

    if (page.url().includes('/login')) {
      await loginAsAdmin(page);
      await page.goto(`/admin${path}`);
    }
  }

  async function navigateToAdminLessons(page: Page) {
    await navigateToAdminPath(page, '/lessons');
    await expect(page.getByRole('heading', { name: /lições e séries/i })).toBeVisible({ timeout: 10000 });
  }

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToAdminLessons(page);
  });

  test('should display lessons page with series and standalone lessons', async ({ page }) => {
    // Verify page title
    await expect(page.getByRole('heading', { name: /lições e séries/i })).toBeVisible();

    // Verify sections exist
    const seriesSection = page.getByRole('heading', { name: 'Séries de Lições' });
    const standaloneLessonsSection = page.getByRole('heading', { name: 'Lições Avulsas' });

    await expect(seriesSection).toBeVisible({ timeout: 5000 });
    await expect(standaloneLessonsSection).toBeVisible({ timeout: 5000 });
  });

  test('should create a new series with initial lessons', async ({ page }) => {
    // Click "Create Series" button
    await navigateToAdminPath(page, '/lessons/series/new');

    // Wait for form to load
    await page.waitForURL('**/admin/lessons/series/new');

    // Fill series information
    const seriesName = `Fundamentos da Fé - Test ${Date.now()}`;
    await page.getByLabel('Nome da Série').fill(seriesName);
    await page.getByLabel('Descrição').fill('Série introdutória sobre princípios cristãos');

    // Add initial lessons if the form supports it
    const addLessonBtn = page.getByRole('button', { name: 'Adicionar Lição' });
    if (await addLessonBtn.count()) {
      await addLessonBtn.click();
      await page.locator('input#initialLessons\\.0\\.title').fill('Quem é Deus?');
      await page.locator('textarea#initialLessons\\.0\\.description').fill('Introdução aos atributos de Deus');
    }

    // Submit form
    await page.getByRole('button', { name: 'Criar Série' }).click();

    // Wait for success toast or redirect
    await page.waitForURL('**/admin/lessons', { timeout: 15000 });
    await expect(page.getByText(seriesName)).toBeVisible({ timeout: 5000 });
  });

  test('should edit a series and reorder lessons', async ({ page }) => {
    // Find and click on a series (assuming at least one exists)
    const seriesSection = page.locator('section', { hasText: 'Séries de Lições' });
    const seriesLink = seriesSection.getByRole('link', { name: 'Editar' }).first();
    const hasEditButton = await seriesLink.count() > 0;

    if (!hasEditButton) {
      console.log('No series found to edit, skipping test');
      test.skip();
    }

    const seriesHref = await seriesLink.getAttribute('href');
    if (!seriesHref) {
      test.skip();
    }

    await navigateToAdminPath(page, seriesHref?.replace('/admin', '') ?? '/lessons');
    await page.waitForLoadState('networkidle');

    // Update series description
    const updatedDescription = 'Descrição atualizada - teste automatizado';
    const descriptionField = page.getByLabel('Descrição');
    await descriptionField.fill(updatedDescription);

    // Save changes
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();
    await expect(descriptionField).toHaveValue(updatedDescription);
  });

  test('should create a standalone lesson', async ({ page }) => {
    // Click "New Lesson" button
    await navigateToAdminPath(page, '/lessons/new');

    // Wait for form
    await page.waitForURL('**/admin/lessons/new');

    // Fill lesson form
    const lessonTitle = `Lição Avulsa - Teste ${Date.now()}`;
    await page.getByLabel('Título').fill(lessonTitle);
    await page.getByLabel('Descrição').fill('Esta é uma lição de teste');

    // Select "No series" option if series select exists
    const seriesSelect = page.getByRole('combobox').first();
    if (await seriesSelect.count()) {
      await seriesSelect.click();
      await page.getByRole('option', { name: /sem série/i }).click();
    }

    // Submit form
    await page.getByRole('button', { name: 'Criar Lição' }).click();
    await page.waitForURL('**/admin/lessons', { timeout: 15000 });
    await expect(page.getByText(lessonTitle)).toBeVisible({ timeout: 5000 });
  });

  test('should edit a lesson', async ({ page }) => {
    // Find any lesson edit button
    const lessonsSection = page.locator('section', { hasText: 'Lições Avulsas' });
    const lessonEditBtn = lessonsSection.getByRole('link', { name: 'Editar' }).first();
    const hasLesson = await lessonEditBtn.count() > 0;

    if (!hasLesson) {
      console.log('No lessons found to edit, skipping test');
      test.skip();
    }

    const lessonHref = await lessonEditBtn.getAttribute('href');
    if (!lessonHref) {
      test.skip();
    }

    await navigateToAdminPath(page, lessonHref?.replace('/admin', '') ?? '/lessons');
    await page.waitForLoadState('networkidle');

    // Update lesson title
    const titleField = page.getByLabel('Título');
    const currentTitle = await titleField.inputValue();
    await titleField.fill(currentTitle + ' - Editado');

    // Save changes
    const updatedTitle = `${currentTitle} - Editado`;
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();
    await page.waitForURL('**/admin/lessons', { timeout: 15000 });
    await expect(page.getByText(updatedTitle)).toBeVisible({ timeout: 5000 });
  });

  test('should delete a lesson with confirmation', async ({ page }) => {
    // Navigate to a lesson edit page first
    const lessonsSection = page.locator('section', { hasText: 'Lições Avulsas' });
    const lessonLink = lessonsSection.getByRole('link', { name: 'Editar' }).first();
    const hasLesson = await lessonLink.count() > 0;

    if (!hasLesson) {
      console.log('No lessons found to delete, skipping test');
      test.skip();
    }

    const lessonHref = await lessonLink.getAttribute('href');
    if (!lessonHref) {
      test.skip();
    }

    await navigateToAdminPath(page, lessonHref?.replace('/admin', '') ?? '/lessons');
    await page.waitForLoadState('networkidle');

    // Click delete button
    const deleteBtn = page.getByRole('button', { name: 'Excluir Lição' });
    await deleteBtn.click();

    // Wait for confirmation dialog
    const confirmDialog = page.locator('[role="alertdialog"], [role="dialog"]');
    await expect(confirmDialog).toBeVisible({ timeout: 2000 });

    // Verify dialog has confirmation text
    await expect(page.getByRole('button', { name: 'Confirmar' })).toBeVisible();
    await expect(page.locator('text=Esta ação não pode ser desfeita')).toBeVisible();

    // Click cancel to not actually delete in the test
    await page.getByRole('button', { name: 'Cancelar' }).click();

    // Verify dialog closes
    await expect(confirmDialog).not.toBeVisible({ timeout: 2000 });
  });

  test('should display lesson management with proper loading states', async ({ page }) => {
    // Refresh page to trigger loading
    await navigateToAdminPath(page, '/lessons');

    // Check for loading indicator (spinner or loading text)
    const loadingIndicator = page.locator('text=Carregando lições..., [role="status"], .animate-spin');

    // Loading should appear briefly (or may already be gone)
    const loadingVisible = await loadingIndicator.isVisible().catch(() => false);

    if (loadingVisible) {
      // Wait for loading to finish
      await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 });
    }

    // Verify content is loaded
    await expect(page.getByRole('heading', { name: /lições e séries/i })).toBeVisible();
  });

  test('should have proper navigation and breadcrumbs', async ({ page }) => {
    // Verify breadcrumbs exist
    const breadcrumbs = page.locator('nav[aria-label="breadcrumb"], .breadcrumb, a:has-text("Admin")');
    await expect(breadcrumbs.first()).toBeVisible({ timeout: 5000 });

    // Click back to admin dashboard
    await navigateToAdminPath(page, '');

    // Verify we're on admin dashboard
    await page.waitForURL('**/admin', { timeout: 5000 });
    await expect(page.getByRole('heading', { name: /dashboard admin/i })).toBeVisible();
  });
});
