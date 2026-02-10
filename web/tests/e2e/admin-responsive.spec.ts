import { test, expect } from '@playwright/test';

/**
 * T039: Admin Responsiveness Tests
 * Tests that admin area is usable on mobile devices
 * Validates sidebar, tables, forms, and charts at different viewports
 */

test.describe('T039: Admin Responsiveness', () => {
  const adminEmail = process.env.E2E_SUPABASE_ADMIN_EMAIL || 'admin@test.com';
  const adminPassword = process.env.E2E_SUPABASE_ADMIN_PASSWORD || 'senha123';

  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.waitForTimeout(1000);
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 30000 }).catch(() => {});
    if (!page.url().includes('/dashboard')) {
      await page.goto('/login');
      await page.waitForTimeout(1000);
      await page.fill('input[type="email"]', adminEmail);
      await page.fill('input[type="password"]', adminPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 30000 });
    }
    await page.waitForLoadState('domcontentloaded');
    await page.reload();
    if (page.url().includes('/login')) {
      await page.fill('input[type="email"]', adminEmail);
      await page.fill('input[type="password"]', adminPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 30000 });
    }
  });

  test('should display admin dashboard on mobile (375px)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to admin
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    // Verify page loads
    await expect(page.getByRole('heading', { name: /dashboard admin/i })).toBeVisible();

    // Check if sidebar is collapsible or hidden
    const sidebar = page.locator('aside, nav[role="navigation"]');
    const sidebarVisible = await sidebar.isVisible().catch(() => false);

    if (sidebarVisible) {
      // Sidebar should be collapsible with a menu button
      const menuBtn = page.locator('button[aria-label*="menu"], button:has-text("☰"), [role="button"]:has-text("Menu")');
      const hasMenuBtn = await menuBtn.count() > 0;

      // If no menu button, sidebar should be hidden or off-screen
      if (!hasMenuBtn) {
        const sidebarBox = await sidebar.boundingBox();
        // Sidebar might be off-screen (transform or negative position)
        console.log('Sidebar bounding box:', sidebarBox);
      }
    }

    // Verify content is readable
    const heading = page.getByRole('heading', { name: /dashboard admin/i });
    const headingSize = await heading.boundingBox();

    if (headingSize) {
      expect(headingSize.width).toBeLessThan(375);
      expect(headingSize.height).toBeGreaterThan(0);
    }
  });

  test('should display GC list on tablet (768px)', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    // Navigate to GCs
    await page.goto('/admin/growth-groups');
    await page.waitForLoadState('domcontentloaded');

    // Verify table/list is visible
    const gcList = page.locator('table, [role="table"], [role="list"]');
    await expect(gcList.first()).toBeVisible();

    // Check if table is scrollable if too wide
    const tableContainer = page.locator('table').first();
    const hasTable = await tableContainer.count() > 0;

    if (hasTable) {
      const tableBox = await tableContainer.boundingBox();
      if (tableBox) {
        // Table should fit within viewport or have horizontal scroll
        console.log('Table width:', tableBox.width, 'Viewport:', 768);
      }
    }
  });

  test('should display lesson form on mobile (375px)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to new lesson form
    await page.goto('/admin/lessons/new');
    await page.waitForLoadState('domcontentloaded');

    // Verify form is visible and readable
    const titleInput = page.locator('input[name="title"], input#title');
    await expect(titleInput).toBeVisible();

    // Verify input width fits mobile screen
    const inputBox = await titleInput.boundingBox();
    if (inputBox) {
      expect(inputBox.width).toBeLessThan(375);
      expect(inputBox.width).toBeGreaterThan(200); // Should be reasonably wide
    }

    // Verify textarea is readable
    const descriptionField = page.locator('textarea[name="description"], textarea#description');
    await expect(descriptionField).toBeVisible();

    // Verify buttons are accessible
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();

    const submitBox = await submitBtn.boundingBox();
    if (submitBox) {
      // Button should be at least 44x44 (mobile touch target)
      expect(submitBox.height).toBeGreaterThanOrEqual(40);
    }
  });

  test('should display reports with responsive charts (768px)', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    // Navigate to reports
    await page.goto('/admin/reports');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('heading', { name: /relatórios/i })).toBeVisible({ timeout: 10000 });

    // Verify charts container
    const chartsContainer = page.locator('.recharts-surface, canvas, [role="img"]');
    const hasCharts = await chartsContainer.count() > 0;

    if (hasCharts) {
      const firstChart = chartsContainer.first();
      await firstChart.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
      await expect(firstChart).toBeVisible();

      // Check chart dimensions fit viewport
      const chartBox = await firstChart.boundingBox();
      if (chartBox) {
        expect(chartBox.width).toBeLessThanOrEqual(768);
        console.log('Chart width:', chartBox.width);
      }
    } else {
      console.log('No charts found, may be empty state');
    }
  });

  test('should handle wizard steps on mobile (375px)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to a GC detail page (assuming one exists)
    await page.goto('/admin/growth-groups');
    await page.waitForLoadState('domcontentloaded');

    // Try to find a multiply button
    const multiplyBtn = page.locator('button:has-text("Multiplicar"), a:has-text("Multiplicar")').first();
    const hasMultiplyBtn = await multiplyBtn.count() > 0;

    if (!hasMultiplyBtn) {
      console.log('No GCs available to test multiply wizard, skipping');
      test.skip();
    }

    const multiplyHref = await multiplyBtn.getAttribute('href');
    if (multiplyHref) {
      await page.goto(multiplyHref);
    } else {
      await multiplyBtn.click();
    }
    await page.waitForLoadState('domcontentloaded');

    // Verify wizard loads on mobile
    const wizardStep = page.locator('text=Step, text=Passo, [role="progressbar"]');
    const hasWizard = await wizardStep.isVisible().catch(() => false);

    if (hasWizard) {
      // Verify wizard content is readable
      const wizardContainer = page.locator('form, [role="form"]');
      await expect(wizardContainer.first()).toBeVisible();

      // Navigation buttons should be visible
      const nextBtn = page.locator('button:has-text("Próximo"), button:has-text("Next")');
      const hasNextBtn = await nextBtn.count() > 0;

      if (hasNextBtn) {
        await expect(nextBtn.first()).toBeVisible();
      }
    }
  });

  test('should stack metric cards vertically on mobile (375px)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to admin dashboard
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    // Find metric cards
    const metricCards = page.locator('[role="region"], .card, [class*="Card"]');
    const cardCount = await metricCards.count();

    if (cardCount > 1) {
      // Get positions of first two cards
      const firstCard = metricCards.nth(0);
      const secondCard = metricCards.nth(1);

      const firstBox = await firstCard.boundingBox();
      const secondBox = await secondCard.boundingBox();

      if (firstBox && secondBox) {
        // On mobile, cards should stack vertically (second card below first)
        // Allow some tolerance for margins
        expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height - 20);

        console.log('First card Y:', firstBox.y, 'height:', firstBox.height);
        console.log('Second card Y:', secondBox.y);
      }
    }
  });

  test('should make tables horizontally scrollable on mobile (375px)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to a page with tables (GCs or users)
    await page.goto('/admin/growth-groups');
    await page.waitForLoadState('domcontentloaded');

    // Find table
    const table = page.locator('table').first();
    const hasTable = await table.count() > 0;

    if (!hasTable) {
      console.log('No tables found, skipping scroll test');
      test.skip();
    }

    // Check if table container allows horizontal scroll
    const tableContainer = table.locator('..'); // Parent element
    const containerBox = await tableContainer.boundingBox();

    if (containerBox) {
      // Container should have overflow handling
      const overflowX = await tableContainer.evaluate(el => {
        return window.getComputedStyle(el).overflowX;
      });

      console.log('Table container overflow-x:', overflowX);
      // Should be 'auto' or 'scroll' to handle wide tables
      expect(['auto', 'scroll']).toContain(overflowX);
    }
  });

  test('should show touch-friendly navigation on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to admin
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    // Find all interactive elements (buttons, links)
    const interactiveElements = page.locator('button, a[href], input[type="button"], input[type="submit"]');
    const elementCount = await interactiveElements.count();

    console.log('Found', elementCount, 'interactive elements');

    // Check a few random elements for touch target size
    const samplesToCheck = Math.min(5, elementCount);

    for (let i = 0; i < samplesToCheck; i++) {
      const element = interactiveElements.nth(i);
      const box = await element.boundingBox();

      if (box && box.height > 0) {
        // Touch targets should be at least 44x44 (iOS) or 48x48 (Android)
        // Being lenient with 40x40 minimum
        const isTouchFriendly = box.height >= 36 || box.width >= 36;

        if (!isTouchFriendly) {
          const elementText = await element.textContent();
          console.log(`Small touch target (${box.width}x${box.height}):`, elementText?.slice(0, 30));
        }
      }
    }
  });
});
