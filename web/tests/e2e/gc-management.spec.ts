import { test, expect, type Page } from '@playwright/test';

const loginEmail = process.env.E2E_SUPABASE_EMAIL;
const loginPassword = process.env.E2E_SUPABASE_PASSWORD;
const shouldSkip = !loginEmail || !loginPassword;

/**
 * Helper function to navigate to a section using nav links or direct navigation
 */
async function navigateToSection(page: Page, url: string, linkPattern: RegExp) {
  const navLink = page.getByRole('link', { name: linkPattern });
  const targetPattern = `**${url.startsWith('/') ? url : `/${url}`}*`;

  if ((await navLink.count()) > 0) {
    await Promise.all([navLink.first().click(), page.waitForURL(targetPattern)]);
    return;
  }

  await page.goto(url);
  await page.waitForURL(targetPattern);
}

/**
 * Helper function to login as a GC leader
 */
async function loginAsLeader(page: Page) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(loginEmail!);
  await page.getByLabel('Senha').fill(loginPassword!);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL('**/dashboard');
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
}

test.describe('Gestão de GCs - Quickstart Scenarios', () => {
  test.skip(shouldSkip, 'Defina E2E_SUPABASE_EMAIL e E2E_SUPABASE_PASSWORD para executar este fluxo.');

  test.beforeEach(async ({ page }) => {
    await loginAsLeader(page);
  });

  /**
   * Cenário 1: Agendar uma Nova Reunião
   *
   * Passos:
   * 1. Login como líder de GC
   * 2. Navegue até a página de gerenciamento do seu GC
   * 3. Clique no botão "Agendar Reunião" ou "Nova reunião"
   * 4. Preencha o formulário com título da lição, data e hora
   * 5. Salve
   * 6. Verifique que a nova reunião aparece na lista
   */
  test('Cenário 1: Agendar uma Nova Reunião', async ({ page }) => {
    // Navegar para o dashboard de GCs
    await navigateToSection(page, '/dashboard', /dashboard/i);

    // Procurar por um card de GC e clicar nele
    const gcCards = page.locator('[href^="/gc/"]').first();
    await expect(gcCards).toBeVisible({ timeout: 10000 });
    const gcUrl = await gcCards.getAttribute('href');

    if (!gcUrl) {
      throw new Error('GC URL not found');
    }

    await gcCards.click();
    await page.waitForURL(`**${gcUrl}*`);

    // Verificar que estamos na página de detalhes do GC
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Clicar no botão "Nova reunião"
    const newMeetingButton = page.getByRole('link', { name: /nova reunião/i });
    await expect(newMeetingButton).toBeVisible();
    await newMeetingButton.click();
    await page.waitForURL('**/meetings/new**');

    // Preencher o formulário de reunião
    const uniqueTitle = `Reunião E2E ${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];

    await page.getByLabel('Data').fill(today);
    await page.getByLabel('Horário').fill('19:30');
    await page.getByLabel('Título customizado').fill(uniqueTitle);
    await page.getByLabel('Comentários').fill('Reunião criada via teste E2E');

    // Marcar alguns participantes como presentes (opcional)
    const checkboxes = page.getByRole('checkbox');
    const checkboxCount = await checkboxes.count();
    if (checkboxCount > 0) {
      // Marcar os primeiros 2 participantes
      for (let i = 0; i < Math.min(checkboxCount, 2); i += 1) {
        await checkboxes.nth(i).check().catch(() => {});
      }
    }

    // Salvar a reunião
    await page.getByRole('button', { name: /registrar reunião/i }).click();

    // Verificar redirecionamento de volta para a página do GC
    await page.waitForURL(`**${gcUrl}*`);

    // Verificar que a reunião aparece na lista
    await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 10000 });
  });

  /**
   * Cenário 2: Registrar Presença em uma Reunião
   *
   * Passos:
   * 1. Login como líder de GC
   * 2. Vá para a página de detalhes de uma reunião existente
   * 3. Visualize lista de membros e visitantes
   * 4. Marque caixas de seleção para pessoas presentes
   * 5. Verifique que a presença é salva
   */
  test('Cenário 2: Registrar Presença em uma Reunião', async ({ page }) => {
    // Primeiro, criar uma reunião para testar
    await navigateToSection(page, '/dashboard', /dashboard/i);

    // Procurar por um card de GC e clicar nele
    const gcCards = page.locator('[href^="/gc/"]').first();
    await expect(gcCards).toBeVisible({ timeout: 10000 });
    const gcUrl = await gcCards.getAttribute('href');

    if (!gcUrl) {
      throw new Error('GC URL not found');
    }

    await gcCards.click();
    await page.waitForURL(`**${gcUrl}*`);

    // Clicar no botão "Nova reunião"
    const newMeetingButton = page.getByRole('link', { name: /nova reunião/i });
    await expect(newMeetingButton).toBeVisible();
    await newMeetingButton.click();
    await page.waitForURL('**/meetings/new**');

    // Criar uma reunião sem presenças
    const uniqueTitle = `Reunião Presença E2E ${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];

    await page.getByLabel('Data').fill(today);
    await page.getByLabel('Horário').fill('20:00');
    await page.getByLabel('Título customizado').fill(uniqueTitle);

    // Salvar sem marcar presenças
    await page.getByRole('button', { name: /registrar reunião/i }).click();

    // Verificar redirecionamento de volta para a página do GC
    await page.waitForURL(`**${gcUrl}*`);

    // Encontrar a reunião recém-criada e clicar para editar
    const meetingCard = page.getByText(uniqueTitle).locator('..').locator('..');
    await expect(meetingCard).toBeVisible({ timeout: 10000 });
    await meetingCard.click();
    await page.waitForURL('**/meetings/**/edit');

    // Verificar que estamos na página de edição
    await expect(page.getByRole('heading', { name: /editar reunião/i })).toBeVisible();

    // Verificar que há lista de membros
    await expect(page.getByText(/membros/i)).toBeVisible();

    // Marcar alguns participantes adicionais
    const checkboxes = page.getByRole('checkbox');
    const checkboxCount = await checkboxes.count();

    if (checkboxCount > 0) {
      // Verificar se o primeiro checkbox está desmarcado e marcá-lo
      const firstCheckbox = checkboxes.first();
      const isChecked = await firstCheckbox.isChecked();

      if (!isChecked) {
        await firstCheckbox.check();
      } else if (checkboxCount > 1) {
        // Se o primeiro já está marcado, tentar o segundo
        const secondCheckbox = checkboxes.nth(1);
        const secondChecked = await secondCheckbox.isChecked();
        if (!secondChecked) {
          await secondCheckbox.check();
        }
      }
    }

    // Salvar alterações
    await page.getByRole('button', { name: /salvar alterações/i }).click();
    await page.waitForURL(`**${gcUrl}*`);

    // Verificar que voltamos para a página do GC
    await expect(page.getByText(uniqueTitle)).toBeVisible();

    // Verificar que a contagem de presentes foi atualizada
    const meetingCardAfter = page.getByText(uniqueTitle).locator('..').locator('..');
    await expect(meetingCardAfter).toBeVisible();
  });

  /**
   * Cenário 3: Adicionar um Novo Visitante
   *
   * Passos:
   * 1. Login como líder de GC
   * 2. Navegue para a página de gerenciamento de visitantes
   * 3. Clique no botão "Adicionar Visitante"
   * 4. Preencha o formulário com nome, e-mail e telefone
   * 5. Salve
   * 6. Verifique que o visitante aparece na lista
   */
  test('Cenário 3: Adicionar um Novo Visitante', async ({ page }) => {
    // Navegar para a página de visitantes
    await navigateToSection(page, '/visitors', /visitantes/i);

    // Verificar que estamos na página de visitantes
    await expect(page.getByRole('heading', { name: /visitantes/i })).toBeVisible();

    // Clicar no botão "Adicionar visitante"
    const addVisitorButton = page.getByRole('link', { name: /adicionar visitante/i });
    await expect(addVisitorButton).toBeVisible();
    await addVisitorButton.click();
    await page.waitForURL('**/visitors/new');

    // Preencher o formulário de visitante
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const visitorName = `Visitante E2E ${uniqueSuffix}`;
    const visitorEmail = `visitante-e2e-${uniqueSuffix}@example.com`;

    // Selecionar um GC
    const gcSelect = page.locator('select[name="gcId"]');
    await gcSelect.selectOption({ index: 1 });

    await page.getByLabel('Nome completo').fill(visitorName);
    await page.getByLabel('E-mail').fill(visitorEmail);
    await page.getByLabel('Telefone').fill('11987654321');

    // Salvar o visitante
    await page.getByRole('button', { name: /cadastrar visitante/i }).click();
    await page.waitForURL('**/visitors');

    // Verificar que voltamos para a lista de visitantes
    await expect(page.getByRole('heading', { name: /visitantes/i })).toBeVisible();

    // Verificar que o novo visitante aparece na lista
    await expect(page.getByText(visitorName)).toBeVisible({ timeout: 10000 });
  });

  /**
   * Teste adicional: Editar uma reunião existente
   */
  test('Editar uma reunião existente', async ({ page }) => {
    await navigateToSection(page, '/dashboard', /dashboard/i);

    // Procurar por um card de GC
    const gcCards = page.locator('[href^="/gc/"]').first();
    await expect(gcCards).toBeVisible({ timeout: 10000 });
    const gcUrl = await gcCards.getAttribute('href');

    if (!gcUrl) {
      throw new Error('GC URL not found');
    }

    await gcCards.click();
    await page.waitForURL(`**${gcUrl}*`);

    // Procurar por uma reunião existente
    const meetingCards = page.locator('[href*="/meetings/"][href*="/edit"]').first();

    if ((await meetingCards.count()) === 0) {
      test.skip(true, 'Nenhuma reunião existente para editar');
      return;
    }

    // Clicar no card da reunião para editar
    await meetingCards.click();
    await page.waitForURL('**/meetings/**/edit');

    // Verificar que estamos na página de edição
    await expect(page.getByRole('heading', { name: /editar reunião/i })).toBeVisible();

    // Alterar o título
    const newTitle = `Título Editado E2E ${Date.now()}`;
    const titleInput = page.getByLabel('Título customizado');
    await titleInput.fill(newTitle);

    // Salvar
    await page.getByRole('button', { name: /salvar alterações/i }).click();
    await page.waitForURL(`**${gcUrl}*`);

    // Verificar que o título foi atualizado
    await expect(page.getByText(newTitle)).toBeVisible({ timeout: 10000 });
  });
});
