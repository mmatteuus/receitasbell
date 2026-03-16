import { expect, test, type Page } from "@playwright/test";

const bootstrapUrl = process.env.PLAYWRIGHT_BOOTSTRAP_URL;

async function openRoute(page: Page, path: string) {
  if (bootstrapUrl) {
    await page.goto(bootstrapUrl, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    if (path !== "/") {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle");
    }

    return;
  }

  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
}

test.describe("ReceitasBell smoke", () => {
  test("home renderiza a vitrine publica", async ({ page }) => {
    await openRoute(page, "/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByPlaceholder("Busque por prato, ingrediente ou ocasião")).toBeVisible();
    await expect(page.getByText(/Curadoria editorial/i)).toBeVisible();
  });

  test("busca preserva a query na interface", async ({ page }) => {
    await openRoute(page, "/buscar?q=bolo");

    await expect(page.getByRole("heading", { name: "Buscar Receitas" })).toBeVisible();
    await expect(page.getByPlaceholder("Buscar por nome, ingrediente ou tag...")).toHaveValue("bolo");
    await expect(page.getByText(/resultado/)).toBeVisible();
  });

  test("categoria conhecida abre e mostra o estado atual", async ({ page }) => {
    await openRoute(page, "/categorias/bebidas");

    await expect(page.getByRole("heading", { name: /Bebidas/i })).toBeVisible();
    await expect(page.getByText("Bebidas refrescantes e especiais")).toBeVisible();
    await expect(page.getByText(/Nenhuma receita nesta categoria ainda\./i)).toBeVisible();
  });
});
