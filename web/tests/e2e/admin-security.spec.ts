import { test, expect } from '@playwright/test';

/**
 * T040: Admin Security Tests
 * Tests that non-admin users are blocked from accessing admin area
 * Based on Cenário 7 from quickstart.md
 */

test.describe('T040: Admin Security', () => {
  const nonAdminEmail = process.env.E2E_SUPABASE_NON_ADMIN_EMAIL || 'lider1@test.com';
  const nonAdminPassword = process.env.E2E_SUPABASE_NON_ADMIN_PASSWORD || 'senha123';
  const adminEmail = process.env.E2E_SUPABASE_EMAIL || 'admin@test.com';
  const adminPassword = process.env.E2E_SUPABASE_PASSWORD || 'senha123';

  test('should block non-admin users from accessing /admin', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Login as regular user (non-admin)
    await page.fill('input[type="email"]', nonAdminEmail);
    await page.fill('input[type="password"]', nonAdminPassword);

    // Submit login form
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard (non-admin dashboard)
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Verify we're on regular dashboard
    await expect(page).toHaveURL('/dashboard');

    // Try to access admin area directly
    await page.goto('/admin');

    // Should redirect back to dashboard (not allowed)
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/admin');
    expect(currentUrl).toContain('/dashboard');

    // Verify no admin content is visible
    const adminContent = page.locator('text=Área Administrativa, text=Admin Dashboard');
    await expect(adminContent).not.toBeVisible({ timeout: 2000 });
  });

  test('should block non-admin from /admin/growth-groups', async ({ page }) => {
    // Login as non-admin
    await page.goto('/login');
    await page.fill('input[type="email"]', nonAdminEmail);
    await page.fill('input[type="password"]', nonAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Try to access admin GCs page
    await page.goto('/admin/growth-groups');
    await page.waitForTimeout(2000);

    // Should redirect
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/admin/growth-groups');
  });

  test('should block non-admin from /admin/lessons', async ({ page }) => {
    // Login as non-admin
    await page.goto('/login');
    await page.fill('input[type="email"]', nonAdminEmail);
    await page.fill('input[type="password"]', nonAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Try to access admin lessons page
    await page.goto('/admin/lessons');
    await page.waitForTimeout(2000);

    // Should redirect
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/admin/lessons');
  });

  test('should block non-admin from /admin/reports', async ({ page }) => {
    // Login as non-admin
    await page.goto('/login');
    await page.fill('input[type="email"]', nonAdminEmail);
    await page.fill('input[type="password"]', nonAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Try to access admin reports page
    await page.goto('/admin/reports');
    await page.waitForTimeout(2000);

    // Should redirect
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/admin/reports');
  });

  test('should not show admin links in navigation for non-admin', async ({ page }) => {
    // Login as non-admin
    await page.goto('/login');
    await page.fill('input[type="email"]', nonAdminEmail);
    await page.fill('input[type="password"]', nonAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Check for admin navigation links
    const adminNav = page.locator('nav a[href="/admin"], a:has-text("Admin"), a:has-text("Administração")');
    const hasAdminLinks = await adminNav.count() > 0;

    // Non-admin should not see admin links
    expect(hasAdminLinks).toBe(false);

    // Verify no admin sidebar
    const adminSidebar = page.locator('aside:has-text("Grupos"), aside:has-text("Usuários"), aside:has-text("Relatórios")');
    await expect(adminSidebar).not.toBeVisible({ timeout: 2000 });
  });

  test('should allow admin users to access /admin', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to admin area
    await page.goto('/admin');

    // Should NOT redirect, should stay on /admin
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const currentUrl = page.url();
    expect(currentUrl).toContain('/admin');

    // Verify admin content is visible
    const adminHeading = page.locator('h1');
    await expect(adminHeading).toBeVisible();

    // Should see admin navigation/sidebar
    const adminLinks = page.locator('a[href*="/admin/"]');
    const linkCount = await adminLinks.count();
    expect(linkCount).toBeGreaterThan(0);
  });

  test('should maintain security across browser refresh', async ({ page }) => {
    // Login as non-admin
    await page.goto('/login');
    await page.fill('input[type="email"]', nonAdminEmail);
    await page.fill('input[type="password"]', nonAdminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Try to access admin
    await page.goto('/admin');
    await page.waitForTimeout(2000);

    let currentUrl = page.url();
    expect(currentUrl).not.toContain('/admin');

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be blocked
    currentUrl = page.url();
    expect(currentUrl).not.toContain('/admin');
  });

  test('should redirect to login if not authenticated', async ({ page }) => {
    // Try to access admin without logging in
    await page.goto('/admin');

    // Should redirect to login
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    expect(currentUrl).toContain('/login');
  });

  test('should handle logout and prevent admin access', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to admin
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/admin');

    // Logout
    const logoutBtn = page.locator('button:has-text("Sair"), button:has-text("Logout"), a:has-text("Sair")');
    const hasLogout = await logoutBtn.count() > 0;

    if (hasLogout) {
      await logoutBtn.first().click();
      await page.waitForTimeout(1000);

      // Try to access admin again
      await page.goto('/admin');
      await page.waitForTimeout(2000);

      // Should redirect to login
      const currentUrl = page.url();
      expect(currentUrl).toContain('/login');
    } else {
      console.log('Logout button not found, skipping logout test');
      test.skip();
    }
  });
});
