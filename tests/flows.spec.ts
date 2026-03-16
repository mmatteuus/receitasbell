import { expect, test, type Page } from "@playwright/test";
import {
  adminSecret,
  appRequest,
  createRecipeFixture,
  createSuffix,
  deleteRecipeFixture,
  openRoute,
  primeSession,
  waitForRecipeAvailability,
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
  test.describe.configure({ mode: "serial" });

  test("favoritos persistem para o usuario identificado", async ({ page }) => {
    test.setTimeout(180_000);
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
      await waitForRecipeAvailability(page, recipe.slug);
      await page.goto(`/receitas/${recipe.slug}`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle");

      await expect(page.getByRole("heading", { name: recipeTitle })).toBeVisible();
      await page.getByRole("button", { name: "Favoritar" }).first().click();

      await page.goto("/minha-conta/favoritos", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle");

      await expect(page.getByRole("heading", { name: "Meus Favoritos" })).toBeVisible();
      await expect(page.getByRole("link", { name: recipeTitle, exact: true }).first()).toBeVisible();
    } finally {
      await deleteRecipeFixture(page, recipe.id);
    }
  });

  test("checkout desbloqueia receita paga e o pagamento abre no admin", async ({ page }) => {
    test.setTimeout(180_000);
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
      await waitForRecipeAvailability(page, recipe.slug);
      await page.goto(`/receitas/${recipe.slug}`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle");

      await expect(page.getByRole("heading", { name: recipeTitle })).toBeVisible();
      await expect(page.getByText("Conteúdo Exclusivo")).toBeVisible();
      await expect(page.getByText(secretIngredient)).toHaveCount(0);
      await expect(page.getByText(secretStep)).toHaveCount(0);

      await page.getByRole("link", { name: "Comprar Agora" }).click();
      await expect(page).toHaveURL(new RegExp(`/checkout\\?slug=${recipe.slug}`));
      await expect(page.getByRole("heading", { name: "Finalizar Compra" })).toBeVisible();
      const payButton = page.locator("button", { hasText: "Pagar R$ 29,90" }).first();
      await expect(payButton).toBeVisible();

      const checkoutResponse = await appRequest<{
        primaryPaymentId: string | null;
        unlockedCount: number;
        payments: Array<{ id: string }>;
      }>(page, "/api/checkout", {
        method: "POST",
        body: {
          recipeIds: [recipe.id],
          buyerEmail: email,
          checkoutReference: `playwright-${suffix}`,
        },
      });

      expect([200, 201], JSON.stringify(checkoutResponse.body)).toContain(checkoutResponse.status);
      expect(checkoutResponse.body.primaryPaymentId).toBeTruthy();
      expect(checkoutResponse.body.unlockedCount).toBe(1);

      await page.goto(
        `/compra/sucesso?slug=${recipe.slug}&status=approved&payment_id=${checkoutResponse.body.primaryPaymentId}&count=${checkoutResponse.body.unlockedCount}`,
        { waitUntil: "domcontentloaded" },
      );
      await page.waitForLoadState("networkidle");
      await expect(page.getByRole("heading", { name: "Compra Confirmada!" })).toBeVisible();

      const paymentId = (await page.locator("code").textContent())?.trim();
      expect(paymentId).toBeTruthy();

      for (let attempt = 0; attempt < 4; attempt += 1) {
        await page.goto(`/admin/pagamentos/transacoes/${paymentId}`, { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("networkidle");
        if (await page.getByRole("heading", { name: "Detalhes da Transação" }).count()) {
          break;
        }
        await page.waitForTimeout(2_000);
      }

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

  test("admin lista a receita e abre o editor preenchido", async ({ page }) => {
    test.setTimeout(180_000);
    test.skip(!adminSecret, "PLAYWRIGHT_ADMIN_SECRET e necessario para montar os dados de teste.");
    const suffix = createSuffix();
    const recipeTitle = `Admin Playwright ${suffix}`;
    const recipeSlug = `admin-playwright-${suffix}`;

    await primeSession(page, { adminSecret });
    await openRoute(page, "/");

    const recipe = await createRecipeFixture(page, {
      title: recipeTitle,
      slug: recipeSlug,
      description: "Receita criada para validar o admin.",
      ingredients: ["1 item de teste", "2 itens de teste"],
      instructions: ["Misture", "Sirva"],
    });

    try {
      await waitForRecipeAvailability(page, recipe.slug);
      await page.goto("/admin/receitas", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle");

      await expect(page.getByRole("heading", { name: "Receitas" })).toBeVisible();
      const row = page.locator("tr").filter({ hasText: recipeSlug }).first();
      await expect(row).toBeVisible();
      await expect(row).toContainText(recipeSlug);

      await row.getByTitle("Editar").click();
      await page.waitForLoadState("networkidle");

      await expect(page.getByRole("heading", { name: "Editar Receita" })).toBeVisible();
      await expect(page.getByPlaceholder("Ex: Bolo de Cenoura")).toHaveValue(recipeTitle);
      await expect(fieldByLabel(page, "Slug")).toHaveValue(recipeSlug);
      await expect(fieldByLabel(page, "Descrição", "textarea")).toHaveValue("Receita criada para validar o admin.");
    } finally {
      await deleteRecipeFixture(page, recipe.id);
    }
  });
});
