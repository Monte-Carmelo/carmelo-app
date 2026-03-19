import { expect, type Locator, type Page } from '@playwright/test';

type LoginOptions = {
  email: string;
  password: string;
  expectedPath?: string;
};

async function fillLoginField(locator: Locator, value: string) {
  await expect(locator).toBeEnabled({ timeout: 30000 });
  await locator.fill(value);
}

export async function clearBrowserState(page: Page) {
  await page.context().clearCookies();
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

export async function loginWithCredentials(page: Page, options: LoginOptions) {
  const expectedPath = options.expectedPath ?? '/dashboard';
  let submitted = false;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await clearBrowserState(page);
    await page.waitForTimeout(1000 * (attempt + 1));

    const emailField = page.getByLabel('E-mail');
    const passwordField = page.getByLabel('Senha');
    const submitButton = page.getByRole('button', { name: /entrar/i });

    const fieldsReady = await expect(emailField)
      .toBeEnabled({ timeout: 10000 })
      .then(() => true)
      .catch(() => false);

    if (!fieldsReady) {
      continue;
    }

    await fillLoginField(emailField, options.email);
    await fillLoginField(passwordField, options.password);
    await expect(submitButton).toBeEnabled({ timeout: 15000 });
    await submitButton.click();
    submitted = true;
    break;
  }

  if (!submitted) {
    throw new Error(`Campos de login nao ficaram habilitados para ${options.email}.`);
  }

  const expectedUrlPattern = `**${expectedPath}`;
  const navigated = await page
    .waitForURL(expectedUrlPattern, { timeout: 30000 })
    .then(() => true)
    .catch(() => false);

  if (!navigated) {
    await page.goto(expectedPath, { waitUntil: 'domcontentloaded' });
  }

  if (!page.url().includes(expectedPath)) {
    throw new Error(`Falha no login para ${options.email}.`);
  }

  await expect(page.getByRole('heading', { name: /bem-vindo/i })).toBeVisible({ timeout: 15000 });
}

export async function loginAsAdmin(page: Page) {
  const adminEmail = process.env.E2E_SUPABASE_ADMIN_EMAIL || 'admin@test.com';
  const adminPassword = process.env.E2E_SUPABASE_ADMIN_PASSWORD || 'senha123';
  await loginWithCredentials(page, { email: adminEmail, password: adminPassword });
}

export async function loginAsLeader(page: Page) {
  const email = process.env.E2E_SUPABASE_EMAIL || 'lider1@test.com';
  const password = process.env.E2E_SUPABASE_PASSWORD || 'senha123';
  await loginWithCredentials(page, { email, password });
}

export async function loginAsNonAdmin(page: Page) {
  const nonAdminEmail = process.env.E2E_SUPABASE_NON_ADMIN_EMAIL || 'lider1@test.com';
  const nonAdminPassword = process.env.E2E_SUPABASE_NON_ADMIN_PASSWORD || 'senha123';
  await loginWithCredentials(page, { email: nonAdminEmail, password: nonAdminPassword });
}
