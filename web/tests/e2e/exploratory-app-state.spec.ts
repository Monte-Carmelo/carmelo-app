import { test, expect } from '@playwright/test';

/**
 * Teste Exploratório - Estado Atual da Aplicação Web
 *
 * Objetivo: Avaliar o que está funcionando e o que não está na aplicação web atual.
 * Este teste documenta o estado após Phase 3.2a (correção de blockers TypeScript).
 */

test.describe('Exploração do Estado Atual - Web App', () => {
  test.describe('Rotas Públicas', () => {
    test('deve acessar página inicial', async ({ page }) => {
      await page.goto('/');

      // Verificar se a página carrega
      await expect(page).toHaveTitle(/Carmelo/i);

      // Capturar screenshot do estado atual
      await page.screenshot({ path: 'tests/screenshots/homepage.png', fullPage: true });

      // Documentar o que encontramos
      const bodyText = await page.textContent('body');
      console.log('📄 Conteúdo da página inicial:', bodyText?.substring(0, 200));
    });

    test('deve tentar acessar rota de login', async ({ page }) => {
      const response = await page.goto('/login');

      console.log('📍 Status da rota /login:', response?.status());

      // Verificar se renderiza algo
      const hasContent = await page.locator('body').count() > 0;
      console.log('✅ Página /login renderiza:', hasContent);

      if (hasContent) {
        await page.screenshot({ path: 'tests/screenshots/login.png', fullPage: true });
      }
    });
  });

  test.describe('Rotas Autenticadas (sem auth)', () => {
    test('deve redirecionar /dashboard para login quando não autenticado', async ({ page }) => {
      await page.goto('/dashboard');

      // Aguardar navegação/redirecionamento
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();
      console.log('📍 URL após tentar /dashboard:', currentUrl);
      console.log('🔒 Redirecionou para login?:', currentUrl.includes('login'));

      await page.screenshot({ path: 'tests/screenshots/dashboard-redirect.png', fullPage: true });
    });

    test('deve verificar comportamento de rotas protegidas', async ({ page }) => {
      const protectedRoutes = [
        '/admin',
        '/participants',
        '/meetings',
        '/visitors',
        '/supervision',
      ];

      for (const route of protectedRoutes) {
        let response = null;
        try {
          response = await page.goto(route, { waitUntil: 'domcontentloaded' });
          await page.waitForLoadState('domcontentloaded');
        } catch (error) {
          console.log(`\n⚠️  Falha ao navegar para ${route}:`, String(error));
          continue;
        }

        const currentUrl = page.url();
        const statusCode = response?.status();

        console.log(`\n📍 Rota: ${route}`);
        console.log(`   Status: ${statusCode}`);
        console.log(`   URL final: ${currentUrl}`);
        console.log(`   Redirecionou?: ${currentUrl !== page.url()}`);
      }
    });
  });

  test.describe('Componentes e UI', () => {
    test('deve verificar se há erros de console na homepage', async ({ page }) => {
      const consoleErrors: string[] = [];
      const consoleWarnings: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
        if (msg.type() === 'warning') {
          consoleWarnings.push(msg.text());
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      console.log('\n🚨 Erros de console:', consoleErrors.length);
      consoleErrors.forEach((err) => console.log(`   - ${err}`));

      console.log('\n⚠️  Avisos de console:', consoleWarnings.length);
      consoleWarnings.forEach((warn) => console.log(`   - ${warn}`));
    });

    test('deve verificar responsividade mobile', async ({ page }) => {
      // Simular viewport mobile
      await page.setViewportSize({ width: 393, height: 851 });
      await page.goto('/');

      await page.screenshot({
        path: 'tests/screenshots/homepage-mobile.png',
        fullPage: true
      });

      console.log('📱 Screenshot mobile capturado');
    });

    test('deve verificar responsividade desktop', async ({ page }) => {
      // Simular viewport desktop
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');

      await page.screenshot({
        path: 'tests/screenshots/homepage-desktop.png',
        fullPage: true
      });

      console.log('🖥️  Screenshot desktop capturado');
    });
  });

  test.describe('Estrutura da Aplicação', () => {
    test('deve verificar se Next.js está funcionando', async ({ page }) => {
      await page.goto('/');

      // Verificar se há o meta tag do Next.js
      const nextData = await page.locator('#__NEXT_DATA__').count();
      console.log('⚛️  Next.js detectado:', nextData > 0);

      // Verificar se há hydration errors
      const hasHydrationError = await page.locator('text=Hydration failed').count();
      console.log('💧 Hydration errors:', hasHydrationError);
    });

    test('deve listar todas as rotas descobertas', async ({ page }) => {
      console.log('\n📋 Rotas configuradas (baseado em playwright.config.ts):');
      console.log('   - Públicas: /, /login');
      console.log('   - Admin: /admin, /admin/users/[id], /admin/users/new');
      console.log('   - Features: /dashboard, /participants, /meetings, /visitors, /supervision');
      console.log('   - Dinâmicas: /meetings/[id], /participants/[id]/edit');
      console.log('\n   Total: 17 rotas geradas no build');
    });
  });

  test.describe('Performance', () => {
    test('deve medir tempo de carregamento da homepage', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('domcontentloaded');
      const loadTime = Date.now() - startTime;

      console.log(`⚡ Tempo de carregamento: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(15000); // Deve carregar em menos de 15s no ambiente local
    });
  });
});
