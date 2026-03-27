import { test, expect } from "@playwright/test";

test.describe("PWA Namespace and Auth Flow", () => {
  test("should show PWA entry page and redirect to login", async ({ page }) => {
    // Navigate to PWA entry
    await page.goto("/pwa/entry");
    
    // Check for loading state or immediate redirection
    // Since we're in a browser and installContext is empty, it should default to /pwa/login
    await page.waitForURL("**/pwa/login");
    expect(page.url()).toContain("/pwa/login");
    
    // Validate User Login Page content
    await expect(page.locator("h1")).toContainText("Receitas Bell");
    await expect(page.locator("button:has-text('Entrar com link mágico')")).toBeVisible();
  });

  test("should show Admin Login Page in PWA namespace", async ({ page }) => {
    await page.goto("/pwa/admin/login");
    
    await expect(page.locator("h1")).toContainText("Painel Admin");
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
    await expect(page.locator("button:has-text('Entrar no Painel')")).toBeVisible();
  });

  test("should redirect unauthenticated PWA app access to login", async ({ page }) => {
    // Attempt to access authenticated PWA shell
    await page.goto("/pwa/app");
    
    // Should redirect to login
    await page.waitForURL("**/pwa/login");
    expect(page.url()).toContain("/pwa/login");
  });

  test("should show install button on login pages", async ({ page }) => {
    await page.goto("/pwa/login");
    
    // Note: The InstallAppButton only shows if beforeinstallprompt is triggered
    // In automated tests, it might be hidden unless we mock the event.
    // For now we check if the container for the button exists or the 'instale' text.
    await expect(page.locator("text=Ou instale o app")).toBeVisible();
  });

  test("should show 404 for non-existent PWA routes", async ({ page }) => {
    await page.goto("/pwa/non-existent-page");
    await expect(page.locator("h1")).toContainText("Página não encontrada");
    await expect(page.locator("a:has-text('Voltar para o Início')")).toBeVisible();
  });
});
