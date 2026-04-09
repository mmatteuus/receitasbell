import type { Recipe } from '@/types/recipe';

type ExportRecipeToPdfInput = {
  recipe: Pick<Recipe, 'title' | 'description'> & {
    totalTime?: number;
    servings?: number;
  };
  ingredients: string[];
  instructions: string[];
  imageUrl?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function exportRecipeToPDF(input: ExportRecipeToPdfInput) {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    return false;
  }

  const ingredients = input.ingredients
    .map((ingredient) => `<li>${escapeHtml(ingredient)}</li>`)
    .join('');
  const instructions = input.instructions
    .map(
      (step, index) =>
        `<li><span class="step-num">${index + 1}</span><div class="step-text">${escapeHtml(step)}</div></li>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(input.recipe.title)} - Receitas Bell</title>
    <style>
      @page {
        size: A4;
        margin: 20mm 20mm;
        @bottom-center { content: '© Receitas Bell'; }
      }

      .print-bar {
        display: flex;
        justify-content: center;
        gap: 12px;
        padding: 14px 20px;
        background: #fff;
        border-bottom: 1px solid #e5e7eb;
        position: sticky;
        top: 0;
        z-index: 10;
      }

      .btn-print {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 24px;
        background: #ea580c;
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 15px;
        font-family: sans-serif;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s;
      }

      .btn-print:hover { background: #c2410c; }

      .btn-close {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 20px;
        background: transparent;
        color: #6b7280;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 15px;
        font-family: sans-serif;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.15s;
      }

      .btn-close:hover { background: #f3f4f6; }

      @media print {
        .print-bar { display: none; }
      }
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body { 
        font-family: "Georgia", "Times New Roman", serif; 
        color: #1a1a1a; 
        line-height: 1.6;
        background: #fff;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .container { 
        max-width: 800px; 
        margin: 0 auto;
        padding: 0;
      }
      
      .recipe-header {
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 3px solid #ea580c;
        padding-bottom: 20px;
      }

      .brand { 
        font-size: 12px; 
        text-transform: uppercase; 
        letter-spacing: 0.15em; 
        color: #ea580c; 
        font-weight: bold; 
        font-family: sans-serif;
        margin-bottom: 10px;
      }

      h1 { 
        font-size: 36px; 
        font-weight: 700; 
        margin: 15px 0; 
        color: #000; 
        letter-spacing: -0.01em;
      }

      .description { 
        font-size: 15px; 
        color: #555; 
        margin: 15px 0; 
        font-style: italic; 
        line-height: 1.7;
      }

      .recipe-image {
        width: 100%;
        max-height: 350px;
        object-fit: cover;
        margin: 20px 0 30px 0;
        page-break-after: avoid;
        border-radius: 4px;
      }

      .meta { 
        display: flex; 
        gap: 30px; 
        font-size: 13px; 
        font-family: sans-serif; 
        color: #666; 
        margin: 20px 0;
        border-top: 1px solid #e5e7eb; 
        border-bottom: 1px solid #e5e7eb; 
        padding: 15px 0;
        justify-content: center;
      }

      .meta span { 
        display: flex; 
        align-items: center; 
        gap: 6px;
        font-weight: 500;
      }

      h2 { 
        font-size: 18px; 
        text-transform: uppercase; 
        letter-spacing: 0.08em; 
        color: #000; 
        border-bottom: 2px solid #ea580c; 
        padding-bottom: 8px; 
        margin: 25px 0 15px;
        page-break-after: avoid;
      }

      ul { 
        list-style: none; 
        padding: 0; 
        margin: 0;
      }

      ul li { 
        padding-left: 24px; 
        position: relative; 
        margin-bottom: 10px; 
        font-size: 14px;
        line-height: 1.6;
      }

      ul li::before { 
        content: "✓"; 
        position: absolute; 
        left: 0; 
        color: #ea580c; 
        font-weight: bold;
        font-size: 16px;
      }

      ol { 
        list-style: none; 
        padding: 0; 
        margin: 0;
      }

      ol li { 
        display: flex; 
        gap: 15px; 
        margin-bottom: 18px; 
        page-break-inside: avoid;
      }

      .step-num { 
        display: flex; 
        align-items: flex-start; 
        justify-content: center;
        width: 28px; 
        height: 28px; 
        min-width: 28px; 
        background: #ea580c; 
        color: #fff; 
        font-size: 13px; 
        font-weight: bold; 
        border-radius: 50%;
        font-family: sans-serif;
        margin-top: 2px;
      }

      .step-text { 
        font-size: 14px; 
        color: #1f2937; 
        line-height: 1.7;
        flex: 1;
      }

      footer { 
        margin-top: 40px; 
        padding-top: 15px; 
        border-top: 1px solid #e5e7eb; 
        text-align: center; 
        font-size: 11px; 
        color: #999; 
        font-family: sans-serif;
        page-break-before: avoid;
      }

      @media print {
        body {
          margin: 0;
          padding: 0;
        }
        .container {
          width: 100%;
          max-width: 100%;
        }
      }
    </style>
  </head>
  <body>
    <div class="print-bar">
      <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
      <button class="btn-close" onclick="window.close()">✕ Fechar</button>
    </div>
    <div class="container">
      <div class="recipe-header">
        <div class="brand">Receitas Bell</div>
        <h1>${escapeHtml(input.recipe.title)}</h1>
        ${input.recipe.description ? `<p class="description">${escapeHtml(input.recipe.description)}</p>` : ''}
      </div>

      ${input.imageUrl ? `<img src="${input.imageUrl}" alt="${escapeHtml(input.recipe.title)}" class="recipe-image" />` : ''}

      <div class="meta">
        ${input.recipe.totalTime ? `<span>⏱️ <strong>${input.recipe.totalTime} min</strong></span>` : ''}
        ${input.recipe.servings ? `<span>🍽️ <strong>${input.recipe.servings} porções</strong></span>` : ''}
      </div>

      <main>
        <h2>Ingredientes</h2>
        <ul>${ingredients}</ul>

        <h2>Modo de Preparo</h2>
        <ol>${instructions}</ol>
      </main>

      <footer>
        © Receitas Bell - ${new Date().getFullYear()} • www.receitasbell.com.br
      </footer>
    </div>
  </body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  return true;
}
