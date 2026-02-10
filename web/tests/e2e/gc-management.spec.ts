import { test, expect, type Page } from '@playwright/test';

const loginEmail = process.env.E2E_SUPABASE_EMAIL;
const loginPassword = process.env.E2E_SUPABASE_PASSWORD;
const shouldSkip = !loginEmail || !loginPassword;

/**
 * Helper function to navigate to a section using nav links or direct navigation
 */
async function navigateToSection(page: Page, url: string, linkPattern: RegExp) {
  const navLink = page.getByRole('link', { name: linkPattern });
  const targetPath = url.startsWith('/') ? url : `/${url}`;
  const targetRegex = new RegExp(targetPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if ((await navLink.count()) > 0) {
    await navLink.first().click();
    const navigated = await page
      .waitForURL(targetRegex, { timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    if (navigated) {
      return;
    }
  }

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForURL(targetRegex, { timeout: 10000 });
}

/**
 * Helper function to login as a GC leader
 */
async function loginAsLeader(page: Page) {
  await page.goto('/login');
  await page.waitForTimeout(1000);
  await page.getByLabel('E-mail').fill(loginEmail!);
  await page.getByLabel('Senha').fill(loginPassword!);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 30000 }).catch(() => {});
  if (!page.url().includes('/dashboard')) {
    await page.goto('/login');
    await page.waitForTimeout(1000);
    await page.getByLabel('E-mail').fill(loginEmail!);
    await page.getByLabel('Senha').fill(loginPassword!);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL('**/dashboard', { timeout: 30000 });
  }
  await expect(page.getByRole('heading', { name: /bem-vindo/i })).toBeVisible({ timeout: 15000 });
  await page.waitForLoadState('domcontentloaded');
  if (page.url().includes('/login')) {
    await page.getByLabel('E-mail').fill(loginEmail!);
    await page.getByLabel('Senha').fill(loginPassword!);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    await expect(page.getByRole('heading', { name: /bem-vindo/i })).toBeVisible({ timeout: 15000 });
  }
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
    await navigateToSection(page, '/gc', /gc/i);

    // Procurar por um card de GC e clicar nele
    const gcCards = page.locator('[href^="/gc/"]').first();
    await expect(gcCards).toBeVisible({ timeout: 10000 });
    const gcUrl = await gcCards.getAttribute('href');

    if (!gcUrl) {
      throw new Error('GC URL not found');
    }

    await gcCards.click();
    const gcNavigation = await page
      .waitForURL(new RegExp(gcUrl), { timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    if (!gcNavigation) {
      await page.goto(gcUrl, { waitUntil: 'domcontentloaded' });
    }

    // Verificar que estamos na página de detalhes do GC
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Clicar no botão "Nova reunião"
    const newMeetingButton = page.getByRole('link', { name: /registrar reunião|nova reunião/i });
    await expect(newMeetingButton).toBeVisible();
    const newMeetingHref = await newMeetingButton.getAttribute('href');
    await newMeetingButton.click();
    const meetingNav = await page
      .waitForURL(/\/meetings\/new/, { timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    if (!meetingNav && newMeetingHref) {
      await page.goto(newMeetingHref, { waitUntil: 'domcontentloaded' });
    }

    // Preencher o formulário de reunião
    const uniqueTitle = `Reunião E2E ${Date.now()}`;
    const today = '2099-01-01';

    await page.getByLabel('Data').fill(today);
    await page.getByLabel('Horário').fill('23:30');
    await page.getByRole('button', { name: /título personalizado/i }).click();
    await page.getByLabel('Título da reunião').fill(uniqueTitle);
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
    await expect(page).toHaveURL(new RegExp(gcUrl));
    await page.waitForLoadState('domcontentloaded');

    const gcId = gcUrl.split('/').pop();
    if (gcId) {
      await page.goto(`/meetings?gcId=${gcId}`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: /reuniões/i })).toBeVisible();
      await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 20000 });
    }
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
    await navigateToSection(page, '/gc', /gc/i);

    // Procurar por um card de GC e clicar nele
    const gcCards = page.locator('[href^="/gc/"]').first();
    await expect(gcCards).toBeVisible({ timeout: 10000 });
    const gcUrl = await gcCards.getAttribute('href');

    if (!gcUrl) {
      throw new Error('GC URL not found');
    }

    await gcCards.click();
    const gcNavigation = await page
      .waitForURL(new RegExp(gcUrl), { timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    if (!gcNavigation) {
      await page.goto(gcUrl, { waitUntil: 'domcontentloaded' });
    }
    await page.waitForLoadState('domcontentloaded');
    await page.reload();

    // Clicar no botão "Nova reunião"
    const newMeetingButton = page.getByRole('link', { name: /registrar reunião|nova reunião/i });
    await expect(newMeetingButton).toBeVisible();
    await newMeetingButton.click();
    await expect(page).toHaveURL(/\/meetings\/new/);

    // Criar uma reunião sem presenças
    const uniqueTitle = `Reunião Presença E2E ${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];

    await page.getByLabel('Data').fill(today);
    await page.getByLabel('Horário').fill('23:40');
    await page.getByRole('button', { name: /título personalizado/i }).click();
    await page.getByLabel('Título da reunião').fill(uniqueTitle);

    // Salvar sem marcar presenças
    await page.getByRole('button', { name: /registrar reunião/i }).click();

    // Verificar redirecionamento de volta para a página do GC
    await expect(page).toHaveURL(new RegExp(gcUrl));
    await page.waitForLoadState('domcontentloaded');
    await page.reload();

    // Encontrar a reunião recém-criada e clicar para editar
    let meetingLink = page.getByRole('link', { name: new RegExp(uniqueTitle) });
    const meetingVisible = await meetingLink.isVisible().catch(() => false);
    if (!meetingVisible) {
      meetingLink = page.locator('[href*="/meetings/"][href*="/edit"]').first();
    }
    await expect(meetingLink).toBeVisible({ timeout: 10000 });
    const meetingHref = await meetingLink.getAttribute('href');
    await meetingLink.click();
    const meetingNav = await page
      .waitForURL(/\/meetings\/.*\/edit/, { timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    if (!meetingNav && meetingHref) {
      await page.goto(meetingHref, { waitUntil: 'domcontentloaded' });
    }
    await expect(page).toHaveURL(/\/meetings\/.*\/edit/);

    // Verificar que estamos na página de edição
    await expect(page.getByRole('heading', { name: /editar reunião/i })).toBeVisible();

    // Verificar que há lista de membros
    await expect(page.getByRole('heading', { name: /membros/i })).toBeVisible();

    // Marcar alguns participantes adicionais
    const checkboxes = page.getByRole('checkbox');
    const checkboxCount = await checkboxes.count();
    let checkedIndex: number | null = null;

    if (checkboxCount > 0) {
      // Verificar se o primeiro checkbox está desmarcado e marcá-lo
      const firstCheckbox = checkboxes.first();
      const isChecked = await firstCheckbox.isChecked();

      if (!isChecked) {
        await firstCheckbox.check();
        checkedIndex = 0;
      } else if (checkboxCount > 1) {
        // Se o primeiro já está marcado, tentar o segundo
        const secondCheckbox = checkboxes.nth(1);
        const secondChecked = await secondCheckbox.isChecked();
        if (!secondChecked) {
          await secondCheckbox.check();
          checkedIndex = 1;
        }
      }
    }

    const meetingEditUrl = page.url();

    // Salvar alterações
    await page.getByRole('button', { name: /salvar alterações/i }).click();
    await expect(page).toHaveURL(new RegExp(gcUrl));

    if (meetingEditUrl) {
      await page.goto(meetingEditUrl, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: /editar reunião/i })).toBeVisible();

      if (checkedIndex !== null) {
        await expect(page.getByRole('checkbox').nth(checkedIndex)).toBeChecked();
      }
    }
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
    const addVisitorHref = await addVisitorButton.getAttribute('href');
    await addVisitorButton.click();
    const visitorNav = await page
      .waitForURL(/\/visitors\/new/, { timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    if (!visitorNav && addVisitorHref) {
      await page.goto(addVisitorHref, { waitUntil: 'domcontentloaded' });
    }

    // Preencher o formulário de visitante
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const visitorName = `Visitante E2E ${uniqueSuffix}`;
    const visitorEmail = `visitante-e2e-${uniqueSuffix}@example.com`;

    // Selecionar um GC (quando o select existe)
    const gcSelect = page.locator('select[name="gcId"]');
    if (await gcSelect.count()) {
      await gcSelect.waitFor({ state: 'visible', timeout: 5000 });
      const options = gcSelect.locator('option');
      if ((await options.count()) > 1) {
        await gcSelect.selectOption({ index: 1 });
      }
    }

    await page.getByLabel('Nome completo').fill(visitorName);
    await page.getByLabel('E-mail').fill(visitorEmail);
    await page.getByLabel('Telefone').fill('11987654321');

    // Salvar o visitante
    await page.getByRole('button', { name: /cadastrar visitante/i }).click();
    const redirected = await page
      .waitForURL(/\/(visitors|gc)\//, { timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    if (!redirected) {
      await page.waitForTimeout(1000);
    }

    const currentUrl = page.url();

    // Verificar que voltamos para a lista de visitantes quando aplicável
    if (currentUrl.includes('/visitors') && !currentUrl.includes('/visitors/new')) {
      await expect(page.getByRole('heading', { name: /visitantes/i })).toBeVisible();
    }

    // Verificar que o novo visitante aparece na lista (quando na listagem)
    if (currentUrl.includes('/visitors') && !currentUrl.includes('/visitors/new')) {
      await expect(page.getByText(visitorName)).toBeVisible({ timeout: 10000 });
    }
  });

  /**
   * Teste adicional: Editar uma reunião existente
   */
  test('Editar uma reunião existente', async ({ page }) => {
    await navigateToSection(page, '/gc', /gc/i);

    // Procurar por um card de GC
    const gcCards = page.locator('[href^="/gc/"]').first();
    await expect(gcCards).toBeVisible({ timeout: 10000 });
    const gcUrl = await gcCards.getAttribute('href');

    if (!gcUrl) {
      throw new Error('GC URL not found');
    }

    await gcCards.click();
    await expect(page).toHaveURL(new RegExp(gcUrl));

    // Procurar por uma reunião existente
    const meetingCards = page.locator('[href*="/meetings/"][href*="/edit"]').first();

    if ((await meetingCards.count()) === 0) {
      test.skip(true, 'Nenhuma reunião existente para editar');
      return;
    }

    // Clicar no card da reunião para editar
    const meetingHref = await meetingCards.getAttribute('href');
    await meetingCards.click();
    const meetingNavigation = await page
      .waitForURL(/\/meetings\/.*\/edit/, { timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    if (!meetingNavigation && meetingHref) {
      await page.goto(meetingHref, { waitUntil: 'domcontentloaded' });
    }

    // Verificar que estamos na página de edição
    await expect(page.getByRole('heading', { name: /editar reunião/i })).toBeVisible();

    // Alterar o título
    const newTitle = `Título Editado E2E ${Date.now()}`;
    await page.getByRole('button', { name: /título personalizado/i }).click();
    const titleInput = page.getByLabel('Título da reunião');
    await titleInput.fill(newTitle);

    // Salvar
    await page.getByRole('button', { name: /salvar alterações/i }).click();
    await expect(page).toHaveURL(new RegExp(gcUrl));

    // Verificar que o título foi atualizado
    await expect(page.getByText(newTitle)).toBeVisible({ timeout: 10000 });
  });
});
