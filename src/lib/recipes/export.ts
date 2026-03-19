import { formatBRL } from "@/lib/helpers";
import type { Recipe } from "@/types/recipe";

type ExportRecipeToPdfInput = {
  recipe: Pick<Recipe, "title" | "description" | "accessTier" | "priceBRL" | "slug">;
  ingredients: string[];
  instructions: string[];
  isTeaserOnly?: boolean;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function exportRecipeToPDF(input: ExportRecipeToPdfInput) {
  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) {
    return false;
  }

  const teaserMessage = input.isTeaserOnly
    ? "<p class=\"notice\">Este PDF contém apenas o teaser liberado antes da compra.</p>"
    : "";

  const ingredients = input.ingredients
    .map((ingredient) => `<li>${escapeHtml(ingredient)}</li>`)
    .join("");
  const instructions = input.instructions
    .map((step, index) => `<li><span>${index + 1}.</span><p>${escapeHtml(step)}</p></li>`)
    .join("");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(input.recipe.title)} - PDF</title>
    <style>
      @page { size: A4; margin: 16mm; }
      body { font-family: "Georgia", serif; color: #1f2937; margin: 0; }
      main { max-width: 760px; margin: 0 auto; }
      h1 { font-size: 28px; margin-bottom: 8px; }
      h2 { font-size: 18px; margin: 28px 0 12px; }
      p { line-height: 1.7; }
      ul, ol { padding-left: 20px; }
      ul li { margin-bottom: 8px; }
      ol li { display: flex; gap: 10px; margin-bottom: 14px; }
      ol li span { font-weight: 700; min-width: 24px; }
      .meta { color: #6b7280; font-size: 12px; margin-bottom: 20px; }
      .notice { padding: 12px 14px; border: 1px dashed #d97706; background: #fff7ed; color: #9a3412; border-radius: 10px; }
      .price { display: inline-block; margin-top: 8px; padding: 6px 10px; border-radius: 999px; background: #111827; color: white; font-size: 12px; }
    </style>
  </head>
  <body>
    <main>
      <div class="meta">Receitas do Bell • /receitas/${escapeHtml(input.recipe.slug)}</div>
      <h1>${escapeHtml(input.recipe.title)}</h1>
      ${input.recipe.description ? `<p>${escapeHtml(input.recipe.description)}</p>` : ""}
      ${
        input.recipe.accessTier === "paid" && input.recipe.priceBRL
          ? `<div class="price">${escapeHtml(formatBRL(input.recipe.priceBRL))}</div>`
          : ""
      }
      ${teaserMessage}

      <h2>Ingredientes</h2>
      <ul>${ingredients}</ul>

      <h2>Modo de preparo</h2>
      <ol>${instructions}</ol>
    </main>
  </body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
  window.setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 300);

  return true;
}
