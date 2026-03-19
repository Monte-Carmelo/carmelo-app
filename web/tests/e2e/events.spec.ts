import { expect, test, type Page } from '@playwright/test';

const adminEmail = process.env.E2E_SUPABASE_ADMIN_EMAIL || 'admin@test.com';
const adminPassword = process.env.E2E_SUPABASE_ADMIN_PASSWORD || 'senha123';
const userEmail = process.env.E2E_SUPABASE_EMAIL || 'lider1@test.com';
const userPassword = process.env.E2E_SUPABASE_PASSWORD || 'senha123';
const nonAdminEmail = process.env.E2E_SUPABASE_NON_ADMIN_EMAIL || userEmail;
const nonAdminPassword = process.env.E2E_SUPABASE_NON_ADMIN_PASSWORD || userPassword;

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 20000 });
}

async function createEvent(
  page: Page,
  data: { title: string; date: string; time?: string; location?: string; description?: string }
) {
  await page.goto('/admin/events/new');
  await expect(page.getByText('Criar Novo Evento')).toBeVisible();

  await page.getByLabel('Título *').fill(data.title);
  await page.getByLabel('Descrição').fill(data.description ?? `Descrição ${data.title}`);
  await page.getByLabel('Data do Evento *').fill(data.date);
  if (data.time) {
    await page.getByLabel('Horário').fill(data.time);
  }
  if (data.location) {
    await page.getByLabel('Local').fill(data.location);
  }

  await page.getByRole('button', { name: /criar evento/i }).click();
  await expect(page.locator('tbody tr').filter({ hasText: data.title }).first()).toBeVisible({
    timeout: 30000,
  });
}

async function clearSession(page: Page) {
  await page.context().clearCookies();
  await page.goto('/login');
}

test.describe('Eventos - E2E', () => {
  test('admin cria, edita e exclui evento', async ({ page }) => {
    const suffix = Date.now();
    const createdTitle = `Evento E2E ${suffix}`;
    const updatedTitle = `Evento E2E Editado ${suffix}`;

    await login(page, adminEmail, adminPassword);
    await createEvent(page, {
      title: createdTitle,
      date: '2099-11-15',
      time: '19:30',
      location: 'Auditório Central',
    });

    const row = page.locator('tr', { hasText: createdTitle });
    await expect(row).toBeVisible();

    const editLink = row.locator('a[href$="/edit"]').first();
    await editLink.click();
    await page.waitForURL('**/admin/events/**/edit', { timeout: 20000 });

    await page.getByLabel('Título *').fill(updatedTitle);
    await page.getByRole('button', { name: /salvar alterações/i }).click();
    const updatedRow = page.locator('tr', { hasText: updatedTitle });
    await expect(updatedRow).toBeVisible({ timeout: 30000 });

    await updatedRow.locator('button').first().click();
    await page.getByRole('button', { name: /^Excluir$/ }).click();
    await expect(page.getByText(/evento excluído com sucesso/i)).toBeVisible({ timeout: 10000 });

    // Deleção é lógica; valida que evento não aparece na listagem pública
    await page.goto('/events?year=2099');
    await expect(page.getByRole('link', { name: updatedTitle })).toHaveCount(0);
  });

  test('usuário autenticado visualiza lista e detalhes de eventos', async ({ page }) => {
    const suffix = Date.now();
    const title = `Evento Público ${suffix}`;

    await login(page, adminEmail, adminPassword);
    await createEvent(page, {
      title,
      date: '2099-04-20',
      time: '18:00',
      location: 'Templo Sede',
    });

    await clearSession(page);
    await login(page, userEmail, userPassword);

    await page.goto('/events?year=2099&filter=all');
    await expect(page.getByRole('heading', { name: /eventos da igreja/i })).toBeVisible();
    await expect(page.getByRole('link', { name: title }).first()).toBeVisible();

    await page.getByRole('link', { name: title }).click();
    await page.waitForURL('**/events/**', { timeout: 20000 });
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.getByText(/informações/i)).toBeVisible();
  });

  test('usuário navega entre anos na listagem de eventos', async ({ page }) => {
    const suffix = Date.now();
    const title2099 = `Evento Ano 2099 ${suffix}`;
    const title2098 = `Evento Ano 2098 ${suffix}`;

    await login(page, adminEmail, adminPassword);
    await createEvent(page, { title: title2099, date: '2099-06-10', time: '19:00' });
    await createEvent(page, { title: title2098, date: '2098-06-10', time: '19:00' });

    await clearSession(page);
    await login(page, userEmail, userPassword);

    await page.goto('/events?year=2099&filter=all');
    await expect(page.getByRole('link', { name: title2099 }).first()).toBeVisible();

    await page.getByRole('link', { name: /2098/ }).click();
    await page.waitForURL('**/events?year=2098*', { timeout: 20000 });
    await expect(page.getByRole('link', { name: title2098 }).first()).toBeVisible();
  });

  test('não-admin não acessa rotas administrativas de eventos', async ({ page }) => {
    await login(page, nonAdminEmail, nonAdminPassword);
    await page.goto('/admin/events');
    await page.waitForURL('**/dashboard', { timeout: 20000 });
    await expect(page.getByRole('heading', { name: /bem-vindo/i })).toBeVisible();
  });

  test('listagem pública de eventos é responsiva em mobile', async ({ page }) => {
    await login(page, userEmail, userPassword);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/events');
    await expect(page.getByRole('heading', { name: /eventos da igreja/i })).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(375);
  });
});
