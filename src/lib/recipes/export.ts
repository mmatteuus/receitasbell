import type { Recipe } from "@/types/recipe";

type ExportRecipeToPdfInput = {
  recipe: Pick<Recipe, "title" | "description"> & { 
    totalTime?: number; 
    servings?: number;
  };
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
    .map((step, index) => `<li><span class="step-num">${index + 1}</span><div class="step-text">${escapeHtml(step)}</div></li>`)
    .join("");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(input.recipe.title)} - Receitas Bell</title>
    <style>
      @page { 
        size: A4; 
        margin: 15mm 20mm; 
      }
      body { 
        font-family: "Georgia", "Times New Roman", serif; 
        color: #1a1a1a; 
        line-height: 1.5;
        margin: 0;
        -webkit-print-color-adjust: exact;
      }
      .container { max-width: 800px; margin: 0 auto; }
      
      header { 
        border-bottom: 1px solid #e5e7eb; 
        padding-bottom: 15px; 
        margin-bottom: 30px; 
        display: flex; 
        justify-content: space-between; 
        align-items: center;
      }
      .brand { font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: #d97706; font-weight: bold; font-family: sans-serif; }
      .date { font-size: 10px; color: #9ca3af; font-family: sans-serif; }

      h1 { font-size: 32px; font-weight: 700; margin: 0 0 10px; color: #000; letter-spacing: -0.02em; }
      .description { font-size: 14px; color: #4b5563; margin-bottom: 25px; font-style: italic; line-height: 1.6; }

      .meta { display: flex; gap: 20px; font-size: 12px; font-family: sans-serif; color: #6b7280; margin-bottom: 30px; border-top: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6; padding: 10px 0; }
      .meta span { display: flex; align-items: center; gap: 4px; }

      h2 { font-size: 16px; text-transform: uppercase; letter-spacing: 0.1em; color: #000; border-bottom: 2px solid #000; padding-bottom: 5px; margin: 30px 0 15px; }

      ul { list-style: none; padding: 0; margin: 0; }
      ul li { padding-left: 20px; position: relative; margin-bottom: 8px; font-size: 14px; }
      ul li::before { content: "•"; position: absolute; left: 0; color: #d97706; font-weight: bold; }

      ol { list-style: none; padding: 0; margin: 0; }
      ol li { display: flex; gap: 15px; margin-bottom: 20px; page-break-inside: avoid; }
      .step-num { 
        display: flex; align-items: center; justify-content: center;
        width: 24px; height: 24px; min-width: 24px; 
        background: #000; color: #fff; font-size: 12px; font-weight: bold; border-radius: 4px; font-family: sans-serif;
      }
      .step-text { font-size: 14px; color: #1f2937; line-height: 1.6; }

      footer { 
        margin-top: 50px; 
        padding-top: 15px; 
        border-top: 1px solid #e5e7eb; 
        text-align: center; 
        font-size: 10px; 
        color: #9ca3af; 
        font-family: sans-serif;
        position: fixed;
        bottom: 20mm;
        width: calc(100% - 40mm);
      }
    </style>
  </head>
  <body>
    <div class="container">
      <header>
        <div class="brand">Receitas Bell</div>
        <div class="date">${new Date().toLocaleDateString("pt-BR")}</div>
      </header>

      <main>
        <h1>${escapeHtml(input.recipe.title)}</h1>
        ${input.recipe.description ? `<p class="description">${escapeHtml(input.recipe.description)}</p>` : ""}

        <div class="meta">
          ${input.recipe.totalTime ? `<span><strong>Tempo:</strong> ${input.recipe.totalTime} min</span>` : ""}
          ${input.recipe.servings ? `<span><strong>Porções:</strong> ${input.recipe.servings}</span>` : ""}
        </div>

        <h2>Ingredientes</h2>
        <ul>${ingredients}</ul>

        <h2>Modo de preparo</h2>
        <ol>${instructions}</ol>
      </main>

      <footer>
        Desenvolvido por MTSFerreira &bull; www.receitasbell.com.br
      </footer>
    </div>
  </body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
  
  // Imprimir
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 500);

  return true;
}
