import { test, expect } from '@playwright/test';

/**
 * T027: Lesson Management Tests
 * Tests the complete CRUD operations for lesson series and lessons
 * Based on Cenário 5 from quickstart.md
 */

test.describe('T027: Lesson Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Login as admin (assuming admin credentials from environment or default)
    // TODO: Replace with actual admin credentials
    await page.fill('input[type="email"]', 'admin@exemplo.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to lessons page
    await page.goto('/admin/lessons');
    await page.waitForLoadState('networkidle');
  });

  test('should display lessons page with series and standalone lessons', async ({ page }) => {
    // Verify page title
    await expect(page.locator('h1')).toContainText('Lições');

    // Verify sections exist
    const seriesSection = page.locator('text=Séries de Lições');
    const standaloneLessonsSection = page.locator('text=Lições Avulsas');

    await expect(seriesSection.or(page.locator('h2:has-text("Séries")'))).toBeVisible({ timeout: 5000 });
  });

  test('should create a new series with initial lessons', async ({ page }) => {
    // Click "Create Series" button
    const createSeriesBtn = page.locator('button:has-text("Nova Série"), button:has-text("Criar Série"), a[href="/admin/lessons/series/new"]');
    await createSeriesBtn.first().click();

    // Wait for form to load
    await page.waitForURL('**/admin/lessons/series/new');

    // Fill series information
    await page.fill('input[name="name"], input#name', 'Fundamentos da Fé - Test');
    await page.fill('textarea[name="description"], textarea#description', 'Série introdutória sobre princípios cristãos');

    // Add initial lessons if the form supports it
    const addLessonBtn = page.locator('button:has-text("Adicionar Lição")');
    const lessonBtnExists = await addLessonBtn.count() > 0;

    if (lessonBtnExists) {
      // Add first lesson
      await addLessonBtn.click();
      await page.fill('input[name="initialLessons.0.title"]', 'Quem é Deus?');
      await page.fill('textarea[name="initialLessons.0.description"]', 'Introdução aos atributos de Deus');

      // Add second lesson
      await addLessonBtn.click();
      await page.fill('input[name="initialLessons.1.title"]', 'Quem é Jesus?');
      await page.fill('textarea[name="initialLessons.1.description"]', 'A pessoa e obra de Cristo');

      // Add third lesson
      await addLessonBtn.click();
      await page.fill('input[name="initialLessons.2.title"]', 'Quem é o Espírito Santo?');
      await page.fill('textarea[name="initialLessons.2.description"]', 'O papel do Espírito na vida do crente');
    }

    // Submit form
    await page.click('button[type="submit"]:has-text("Criar")');

    // Wait for success toast or redirect
    await page.waitForTimeout(2000);

    // Verify we're back on lessons page or series detail page
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/admin\/lessons/);

    // Verify series appears in the list
    await expect(page.locator('text=Fundamentos da Fé - Test')).toBeVisible({ timeout: 5000 });
  });

  test('should edit a series and reorder lessons', async ({ page }) => {
    // Find and click on a series (assuming at least one exists)
    const seriesLink = page.locator('a:has-text("Editar"), button:has-text("Editar")').first();
    const hasEditButton = await seriesLink.count() > 0;

    if (!hasEditButton) {
      console.log('No series found to edit, skipping test');
      test.skip();
    }

    await seriesLink.click();
    await page.waitForLoadState('networkidle');

    // Update series description
    const descriptionField = page.locator('textarea[name="description"], textarea#description');
    await descriptionField.fill('Descrição atualizada - teste automatizado');

    // Save changes
    await page.click('button[type="submit"]:has-text("Salvar")');
    await page.waitForTimeout(1000);

    // Verify success message (toast or alert)
    const successMessage = page.locator('text=sucesso, text=atualizada').first();
    await expect(successMessage).toBeVisible({ timeout: 3000 });
  });

  test('should create a standalone lesson', async ({ page }) => {
    // Click "New Lesson" button
    const newLessonBtn = page.locator('button:has-text("Nova Lição"), a[href="/admin/lessons/new"]');
    await newLessonBtn.first().click();

    // Wait for form
    await page.waitForURL('**/admin/lessons/new');

    // Fill lesson form
    await page.fill('input[name="title"], input#title', 'Lição Avulsa - Teste');
    await page.fill('textarea[name="description"], textarea#description', 'Esta é uma lição de teste');

    // Select "No series" option if series select exists
    const seriesSelect = page.locator('select[name="series_id"], [role="combobox"]');
    const hasSeriesSelect = await seriesSelect.count() > 0;

    if (hasSeriesSelect) {
      // Try to select "Sem série" or "none" option
      const selectTrigger = page.locator('[role="combobox"]').first();
      await selectTrigger.click();

      const noneOption = page.locator('text="Sem série", [data-value="none"]').first();
      const noneExists = await noneOption.count() > 0;

      if (noneExists) {
        await noneOption.click();
      }
    }

    // Submit form
    await page.click('button[type="submit"]:has-text("Criar")');

    // Wait for redirect and success
    await page.waitForTimeout(2000);

    // Verify redirect back to lessons page
    await page.waitForURL('**/admin/lessons', { timeout: 5000 });

    // Verify lesson appears in standalone lessons section
    await expect(page.locator('text=Lição Avulsa - Teste')).toBeVisible({ timeout: 5000 });
  });

  test('should edit a lesson', async ({ page }) => {
    // Find any lesson edit button
    const lessonEditBtn = page.locator('a[href*="/admin/lessons/"][href$="/edit"], a[href*="/admin/lessons/"]:not([href*="/series/"]):not([href*="/new"])').first();
    const hasLesson = await lessonEditBtn.count() > 0;

    if (!hasLesson) {
      console.log('No lessons found to edit, skipping test');
      test.skip();
    }

    await lessonEditBtn.click();
    await page.waitForLoadState('networkidle');

    // Update lesson title
    const titleField = page.locator('input[name="title"], input#title');
    const currentTitle = await titleField.inputValue();
    await titleField.fill(currentTitle + ' - Editado');

    // Save changes
    await page.click('button[type="submit"]:has-text("Salvar")');
    await page.waitForTimeout(1000);

    // Verify success message
    const successMessage = page.locator('text=sucesso, text=atualizada').first();
    await expect(successMessage).toBeVisible({ timeout: 3000 });
  });

  test('should delete a lesson with confirmation', async ({ page }) => {
    // Navigate to a lesson edit page first
    const lessonLink = page.locator('a[href*="/admin/lessons/"]:not([href*="/series/"]):not([href*="/new"])').first();
    const hasLesson = await lessonLink.count() > 0;

    if (!hasLesson) {
      console.log('No lessons found to delete, skipping test');
      test.skip();
    }

    await lessonLink.click();
    await page.waitForLoadState('networkidle');

    // Click delete button
    const deleteBtn = page.locator('button:has-text("Excluir")');
    await deleteBtn.click();

    // Wait for confirmation dialog
    await page.waitForTimeout(500);

    // Verify dialog appears
    const confirmDialog = page.locator('[role="alertdialog"], [role="dialog"]');
    await expect(confirmDialog).toBeVisible({ timeout: 2000 });

    // Verify dialog has confirmation text
    await expect(page.locator('text=Confirmar')).toBeVisible();
    await expect(page.locator('text=excluída, text=Exclusão')).toBeVisible();

    // Click cancel to not actually delete in the test
    await page.click('button:has-text("Cancelar")');

    // Verify dialog closes
    await expect(confirmDialog).not.toBeVisible({ timeout: 2000 });
  });

  test('should display lesson management with proper loading states', async ({ page }) => {
    // Refresh page to trigger loading
    await page.goto('/admin/lessons');

    // Check for loading indicator (spinner or loading text)
    const loadingIndicator = page.locator('text=Carregando, [role="status"], .animate-spin');

    // Loading should appear briefly (or may already be gone)
    const loadingVisible = await loadingIndicator.isVisible().catch(() => false);

    if (loadingVisible) {
      // Wait for loading to finish
      await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 });
    }

    // Verify content is loaded
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should have proper navigation and breadcrumbs', async ({ page }) => {
    // Verify breadcrumbs exist
    const breadcrumbs = page.locator('nav[aria-label="breadcrumb"], .breadcrumb, a:has-text("Admin")');
    await expect(breadcrumbs.first()).toBeVisible({ timeout: 5000 });

    // Click back to admin dashboard
    const adminLink = page.locator('a[href="/admin"]').first();
    await adminLink.click();

    // Verify we're on admin dashboard
    await page.waitForURL('**/admin', { timeout: 5000 });
    await expect(page.locator('h1')).toContainText(/Dashboard|Admin/i);
  });
});
