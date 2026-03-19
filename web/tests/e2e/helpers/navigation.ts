import { expect, type Page } from '@playwright/test';
import { loginAsAdmin } from './auth';

export async function navigateToAdminPath(page: Page, path = '') {
  await page.goto(`/admin${path}`, { waitUntil: 'domcontentloaded' });

  if (page.url().includes('/login')) {
    await loginAsAdmin(page);
    await page.goto(`/admin${path}`, { waitUntil: 'domcontentloaded' });
  }
}

export async function navigateToAdminLessons(page: Page) {
  await navigateToAdminPath(page, '/lessons');
  await expect(page.getByRole('heading', { name: /lições e séries/i })).toBeVisible({ timeout: 10000 });
}

export async function navigateToSection(page: Page, url: string, linkPattern: RegExp) {
  const navLink = page.getByRole('link', { name: linkPattern });
  const targetPattern = `**${url.startsWith('/') ? url : `/${url}`}*`;

  if ((await navLink.count()) > 0) {
    await Promise.all([navLink.first().click(), page.waitForURL(targetPattern)]);
    return;
  }

  await page.goto(url);
  await page.waitForURL(targetPattern);
}
