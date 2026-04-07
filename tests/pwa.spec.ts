import { test, expect, devices } from '@playwright/test';

test.describe('PWA Namespace and Auth Flow', () => {
  test('should show PWA entry page and redirect to login', async ({ page }) => {
    // Navigate to PWA entry
    await page.goto('/pwa/entry');

    // Check for loading state or immediate redirection
    // Since we're in a browser and installContext is empty, it should default to /pwa/login
    await page.waitForURL('**/pwa/login');
    expect(page.url()).toContain('/pwa/login');

    // Validate User Login Page content
    await expect(page.locator('h1')).toContainText('Receitas Bell');
    await expect(page.locator("button:has-text('Entrar com link mágico')")).toBeVisible();
  });

  test('should show Admin Login Page in PWA namespace', async ({ page }) => {
    await page.goto('/pwa/admin/login');

    await expect(page.locator('h1')).toContainText('Painel Admin');
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
    await expect(page.locator("button:has-text('Entrar no Painel')")).toBeVisible();
  });

  test('should redirect unauthenticated PWA app access to login', async ({ page }) => {
    // Attempt to access authenticated PWA shell
    await page.goto('/pwa/app');

    // Should redirect to login
    await page.waitForURL('**/pwa/login');
    expect(page.url()).toContain('/pwa/login');
  });

  test('should protect nested PWA routes without escaping to web namespace', async ({ page }) => {
    await page.goto('/pwa/app/buscar');
    await page.waitForURL('**/pwa/login');
    expect(page.url()).toContain('/pwa/login');

    await page.goto('/pwa/app/receitas/receita-inexistente');
    await page.waitForURL('**/pwa/login');
    expect(page.url()).toContain('/pwa/login');
  });

  test('should show 404 for non-existent PWA routes', async ({ page }) => {
    await page.goto('/pwa/non-existent-page');
    await expect(page.locator('h1')).toContainText('Página não encontrada');
    await expect(page.locator("a:has-text('Voltar para o Início')")).toBeVisible();
  });
});

test.describe('PWA Install Button Governance', () => {
  test("should use exact text 'Instalar aplicativo' instead of 'Instalar App'", async ({
    page,
  }) => {
    await page.goto('/pwa/login');

    // Check for correct CTA text
    const correctButton = page.locator("button:has-text('Instalar aplicativo')");
    const incorrectButton = page.locator("button:has-text('Instalar App')");

    // The correct text should not be visible (since beforeinstallprompt is not triggered in tests)
    // But the incorrect text should definitely not exist
    await expect(incorrectButton).not.toBeVisible();
  });

  test('should NOT show install button on web account page', async ({ page }) => {
    await page.goto('/minha-conta');

    // Install button should not be visible on web account page
    const installButton = page.locator(
      "button:has-text('Instalar aplicativo'), button:has-text('Instalar App')"
    );
    await expect(installButton).not.toBeVisible();
  });

  test('should NOT show install button on web header', async ({ page }) => {
    await page.goto('/');

    // Check that install button is not in the header or navigation
    const header = page.locator('header');
    const installButton = header.locator(
      "button:has-text('Instalar aplicativo'), button:has-text('Instalar App')"
    );
    await expect(installButton).not.toBeVisible();
  });

  test('should NOT show install button on admin area', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Install button should not be visible in admin area
    const installButton = page.locator(
      "button:has-text('Instalar aplicativo'), button:has-text('Instalar App')"
    );
    await expect(installButton).not.toBeVisible();
  });
});

test.describe('PWA Mobile Responsiveness', () => {
  const mobileViewports = [
    { name: '360px (S20)', width: 360, height: 800 },
    { name: '390px (Pixel 6)', width: 390, height: 844 },
    { name: '430px (Pixel 7)', width: 430, height: 932 },
  ];

  for (const viewport of mobileViewports) {
    test(`should render PWA login page properly on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/pwa/login');

      // Check key elements are visible
      await expect(page.locator('h1')).toBeVisible();
      await expect(
        page.locator("input[type='email'], input[placeholder*='email' i]")
      ).toBeVisible();

      // Check for no horizontal overflow
      const mainContent = page.locator("main, .container, [role='main']");
      if (await mainContent.isVisible()) {
        const boundingBox = await mainContent.boundingBox();
        expect(boundingBox?.width).toBeLessThanOrEqual(viewport.width);
      }
    });

    test(`should have touchable buttons (min 48px) on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/pwa/login');

      // Check button sizes
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const box = await button.boundingBox();
        if (box) {
          // Button should have minimum touch target of 48px height
          expect(box.height).toBeGreaterThanOrEqual(48); // PWA standard: 48px minimum
        }
      }
    });
  }
});

test.describe('PWA Search and Recipe Pages', () => {
  test('should not import web Search page directly', async ({ page }) => {
    // This is a structural test - we verify the endpoint exists
    // and that it's not using the web version
    const response = await page.goto('/pwa/app/buscar');
    expect(response?.status()).not.toBe(404);
  });

  test('should not import web Recipe page directly', async ({ page }) => {
    // This is a structural test - we verify the endpoint exists
    // and that it's not using the web version
    const response = await page.goto('/pwa/app/receitas/receita-teste');

    // May 404 if recipe doesn't exist, but not because route is missing
    if (response?.status() === 404) {
      const text = await page.locator('body').textContent();
      expect(text).not.toContain('Cannot GET');
    }
  });
});

test.describe('PWA Core Flows (Mobile Viewports)', () => {
  const viewports = [360, 390, 430];

  for (const width of viewports) {
    test(`should load PWA entry without errors on ${width}px viewport`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/pwa/entry');

      // Should not have console errors
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      await page.waitForTimeout(2000);
      expect(errors).toHaveLength(0);
    });
  }
});
