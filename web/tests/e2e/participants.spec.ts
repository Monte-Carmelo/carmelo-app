import { test, expect } from '@playwright/test';
import { loginAsLeader } from './helpers/auth';
import { fillByLabel } from './helpers/forms';
import { navigateToSection } from './helpers/navigation';

const loginEmail = process.env.E2E_SUPABASE_EMAIL;
const loginPassword = process.env.E2E_SUPABASE_PASSWORD;
const shouldSkip = false;

test.describe('Participantes', () => {
  test.skip(shouldSkip, 'Defina E2E_SUPABASE_EMAIL e E2E_SUPABASE_PASSWORD para executar este fluxo.');

  test('visualizar participantes e acessar cadastro rápido', async ({ page }) => {
    await loginAsLeader(page);

    await navigateToSection(page, '/participants', /participantes/i);

    await expect(page.getByRole('heading', { name: /participantes/i })).toBeVisible();

    await page.getByRole('link', { name: /Cadastrar participante/i }).click();
    await page.waitForURL('**/participants/new');

    await expect(page.getByRole('heading', { name: /cadastrar participante/i })).toBeVisible();
  });

  test('navegar para visitantes pela listagem de participantes', async ({ page }) => {
    await loginAsLeader(page);

    await navigateToSection(page, '/participants', /participantes/i);

    await page.getByRole('link', { name: /Acompanhar visitantes/i }).click();
    await page.waitForURL('**/visitors');

    await expect(page.getByRole('heading', { name: /visitantes/i })).toBeVisible();
  });

  test('cadastrar participante via rota interna autenticada', async ({ page }) => {
    await loginAsLeader(page);
    await page.goto('/participants/new', { waitUntil: 'domcontentloaded' });

    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const participantName = `Participante E2E ${uniqueSuffix}`;
    const participantEmail = `participante-${uniqueSuffix}@example.com`;
    await expect(page.getByLabel('Grupo de Crescimento')).toBeEnabled({ timeout: 15000 });
    await page.getByLabel('Grupo de Crescimento').selectOption({ index: 1 });
    await fillByLabel(page, 'Nome completo', participantName);
    await fillByLabel(page, 'E-mail', participantEmail);
    await fillByLabel(page, 'Telefone', '(11) 98888-7777');
    // Birth date is required for members - use type="date" input directly
    await page.locator('input[type="date"]').fill('1990-01-01');

    await page.getByRole('button', { name: /cadastrar participante/i }).click();

    // Form uses window.location.assign() which causes full page reload
    // Wait for the page to navigate and the heading to appear
    await expect(page.getByRole('heading', { name: /participantes/i })).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByText(participantName)).toBeVisible({ timeout: 15000 });
  });
});
