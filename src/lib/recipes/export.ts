import type { Recipe } from "@/types/recipe";

type ExportRecipeToPdfInput = {
  recipe: Pick<Recipe, "title" | "description">;
  ingredients: string[];
  instructions: string[];
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function exportRecipeToPDF(input: ExportRecipeToPdfInput) {
  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) {
    return false;
  }

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
      @page { size: A4; margin: 20mm; }
      body { 
        font-family: "Georgia", serif; 
        color: #1f2937; 
        margin: 0; 
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }
      main { flex: 1; max-width: 760px; margin: 0 auto; width: 100%; }
      .brand { font-size: 14px; font-weight: bold; color: #d97706; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 24px; border-bottom: 2px solid #fef3c7; padding-bottom: 8px; }
      h1 { font-size: 32px; margin: 0 0 12px; color: #111827; }
      .description { font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 32px; font-style: italic; }
      h2 { font-size: 20px; color: #1f2937; margin: 32px 0 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
      p { line-height: 1.7; margin: 0; }
      ul, ol { padding-left: 20px; margin: 0; }
      ul li { margin-bottom: 10px; line-height: 1.6; }
      ol li { display: flex; gap: 12px; margin-bottom: 16px; line-height: 1.6; }
      ol li span { font-weight: 700; color: #d97706; min-width: 24px; }
      footer { margin-top: 48px; border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center; color: #9ca3af; font-size: 12px; font-family: sans-serif; }
    </style>
  </head>
  <body>
    <main>
      <div class="brand">Receitas Bell</div>
      <h1>${escapeHtml(input.recipe.title)}</h1>
      ${input.recipe.description ? `<div class="description">${escapeHtml(input.recipe.description)}</div>` : ""}

      <h2>Ingredientes</h2>
      <ul>${ingredients}</ul>

      <h2>Modo de preparo</h2>
      <ol>${instructions}</ol>
    </main>
    <footer>
      Desenvolvido por MTSFerreira
    </footer>
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
