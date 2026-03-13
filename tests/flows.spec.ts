import { expect, test, type Page } from "@playwright/test";
import {
  adminSecret,
  createRecipeFixture,
  createSuffix,
  deleteRecipeFixture,
  openRoute,
  primeSession,
} from "./helpers";

function fieldByLabel(page: Page, label: string, selector = "input, textarea") {
  return page
    .locator("div.space-y-2")
    .filter({ has: page.locator(`label:has-text("${label}")`) })
    .first()
    .locator(selector)
    .first();
}

test.describe("ReceitasBell user flows", () => {
  test("favoritos persistem para o usuario identificado", async ({ page }) => {
    test.skip(!adminSecret, "PLAYWRIGHT_ADMIN_SECRET e necessario para montar os dados de teste.");
    const suffix = createSuffix();
    const email = `playwright-favoritos-${suffix}@example.com`;
    const recipeTitle = `Receita Favorita ${suffix}`;
    const recipeSlug = `receita-favorita-${suffix}`;

    await primeSession(page, { identityEmail: email, adminSecret });
    await openRoute(page, "/");

    const recipe = await createRecipeFixture(page, {
      title: recipeTitle,
      slug: recipeSlug,
      description: "Fluxo de favoritos validado com Playwright.",
    });

    try {
      await page.goto(`/receitas/${recipe.slug}`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle");

      await expect(page.getByRole("heading", { name: recipeTitle })).toBeVisible();
      await page.getByRole("button", { name: "Favoritar" }).click();
      await expect(page.getByRole("button", { name: "Salvo" })).toBeVisible();

      await page.goto("/minha-conta/favoritos", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle");

      await expect(page.getByRole("heading", { name: "Meus Favoritos" })).toBeVisible();
      await expect(page.getByRole("link", { name: recipeTitle })).toBeVisible();

      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle");
      await expect(page.getByRole("link", { name: recipeTitle })).toBeVisible();
    } finally {
      await deleteRecipeFixture(page, recipe.id);
    }
  });

  test("checkout desbloqueia receita paga e o pagamento abre no admin", async ({ page }) => {
    test.skip(!adminSecret, "PLAYWRIGHT_ADMIN_SECRET e necessario para montar os dados de teste.");
    const suffix = createSuffix();
    const email = `playwright-checkout-${suffix}@example.com`;
    const secretIngredient = `Ingrediente secreto ${suffix}`;
    const secretStep = `Passo secreto ${suffix}`;
    const recipeTitle = `Receita Premium ${suffix}`;
    const recipeSlug = `receita-premium-${suffix}`;

    await primeSession(page, { identityEmail: email, adminSecret });
    await openRoute(page, "/");

    const recipe = await createRecipeFixture(page, {
      title: recipeTitle,
      slug: recipeSlug,
      description: "Fluxo premium validado com Playwright.",
      accessTier: "paid",
      priceBRL: 29.9,
      ingredients: ["1 xicara de base", "2 colheres de recheio", secretIngredient],
      instructions: ["Misture a base", "Asse por 20 minutos", secretStep],
      tags: ["premium", "playwright"],
    });

    try {
      await page.goto(`/receitas/${recipe.slug}`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle");

      await expect(page.getByRole("heading", { name: recipeTitle })).toBeVisible();
      await expect(page.getByText("Conteúdo Exclusivo")).toBeVisible();
      await expect(page.getByText(secretIngredient)).toHaveCount(0);
      await expect(page.getByText(secretStep)).toHaveCount(0);

      await page.getByRole("link", { name: "Comprar Agora" }).click();
      await expect(page).toHaveURL(new RegExp(`/checkout\\?slug=${recipe.slug}`));
      await expect(page.getByRole("heading", { name: "Finalizar Compra" })).toBeVisible();

      await page.getByRole("button", { name: /Pagar R\\$ 29,90/i }).click();
      await expect(page.getByRole("heading", { name: "Compra Confirmada!" })).toBeVisible();

      const paymentId = (await page.locator("code").textContent())?.trim();
      expect(paymentId).toBeTruthy();

      await page.getByRole("link", { name: /Ver Receita Completa/i }).click();
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveURL(new RegExp(`/receitas/${recipe.slug}`));
      await expect(page.getByText("Conteúdo Exclusivo")).toHaveCount(0);
      await expect(page.getByText(secretIngredient)).toBeVisible();
      await expect(page.getByText(secretStep)).toBeVisible();

      await page.goto(`/admin/pagamentos/transacoes/${paymentId}`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle");

      await expect(page.getByRole("heading", { name: "Detalhes da Transação" })).toBeVisible();
      await expect(page.getByText(`Payment ID: ${paymentId}`)).toBeVisible();
      await expect(page.getByText(email)).toBeVisible();
      await expect(page.getByRole("link", { name: new RegExp(recipe.slug) })).toBeVisible();

      const noteText = `Nota Playwright ${suffix}`;
      await page.getByPlaceholder("Adicione uma nota interna sobre este pagamento...").fill(noteText);
      await page.getByRole("button", { name: "Salvar Nota" }).click();
      await expect(page.getByText(noteText)).toBeVisible();
    } finally {
      await deleteRecipeFixture(page, recipe.id);
    }
  });

  test("admin publica e exclui uma receita pela interface", async ({ page }) => {
    test.skip(!adminSecret, "PLAYWRIGHT_ADMIN_SECRET e necessario para montar os dados de teste.");
    const suffix = createSuffix();
    const recipeTitle = `Admin Playwright ${suffix}`;
    const recipeSlug = `admin-playwright-${suffix}`;

    await primeSession(page, { adminSecret });
    await openRoute(page, "/admin/receitas/nova");

    await expect(page.getByRole("heading", { name: "Nova Receita" })).toBeVisible();
    await page.getByPlaceholder("Ex: Bolo de Cenoura").fill(recipeTitle);
    await fieldByLabel(page, "Descrição", "textarea").fill("Receita criada pela suíte do Playwright.");
    await fieldByLabel(page, "Ingredientes", "textarea").fill("1 item de teste\n2 itens de teste");
    await fieldByLabel(page, "Modo de preparo", "textarea").fill("Misture\nSirva");

    await page.getByRole("button", { name: "Publicar" }).click();
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/\/admin\/receitas$/);
    const row = page.locator("tr").filter({ hasText: recipeTitle }).first();
    await expect(row).toBeVisible();
    await expect(row).toContainText(recipeSlug);

    await page.goto(`/receitas/${recipeSlug}`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: recipeTitle })).toBeVisible();

    await page.goto("/admin/receitas", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    const currentRow = page.locator("tr").filter({ hasText: recipeTitle }).first();
    page.once("dialog", (dialog) => {
      void dialog.accept();
    });
    await currentRow.getByTitle("Excluir").click();
    await expect(page.locator("tr").filter({ hasText: recipeTitle })).toHaveCount(0);
  });
});
