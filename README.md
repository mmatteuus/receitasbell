# Receitas do Bell (Frontend)

Este monorepo concentra as melhorias propositalmente solicitadas pela Lovable: reforçar o modelo de receitas, preparar o carrinho & paywall demo, permitir categorias dinâmicas, cuidar do upload de imagem e do preço em R$, e garantir que todas as telas rodem bem em mobile. Nenhum backend real é conectado — tudo roda com `localStorage`.

## Executando localmente

1. `npm install`
2. `npm run dev`
3. Abra http://localhost:5173 (ou a porta que o Vite indicar).

## Principais áreas entregues

| Domínio | Onde está | Observações |
| --- | --- | --- |
| Repositório das receitas | `src/lib/repos/recipeRepo.ts` | normalize, migra dados legados e garante `fullIngredients` + `fullInstructions`. |
| Helper de slug / moeda | `src/lib/helpers.ts` | exporta `generateSlug` e `formatBRL`, reusados por storage, categorias e UI. |
| Editor Admin | `src/pages/admin/RecipeEditor.tsx` | coleções `full*`, slug invisível, upload de imagem em `imageDataUrl`, preço em R$. |
| Carrinho | `src/lib/repos/cartRepo.ts` + `src/pages/CartPage.tsx` + `Header` | badge no cabeçalho, totais com `formatBRL`, checkout simulado (`/checkout?cart=1`). |
| Newsletter | `src/components/NewsletterSignup.tsx` | salva emails em `localStorage` (`rdb_newsletter_subscribers`). |

## Fluxos obrigatórios para QA

1. **Responsividade:** executar DevTools em 320px, 360px, 375px, 390px, 768px, 1024px e 1280px; todas as telas devem manter o footer, evitar overflow horizontal e apresentar botões com targets confortáveis. Admin lista deve trocar entre tabela (desktop) e cards (mobile).
2. **Admin > nova receita paga:** vá em `/admin/receitas/nova`, escreva título e descrição, selecione ou crie uma nova categoria via o modal (+), faça upload de uma imagem local (gera preview), defina nível pago e coloque “R$ 12,90”, publique. O slug roda automaticamente, aparece no preview “/receitas/{slug}” e não pode ser editado.
3. **Ver site público:** depois da publicação, a receita deve aparecer na home/listas; ao abrir `/receitas/{slug}` enquanto não comprada, só aparecem os dois primeiros ingredientes e passos. O paywall mostra os dois itens e o botão “Adicionar ao carrinho”; ao comprar, o conteúdo completo aparece.
4. **Carrinho + checkout:** adicione a receita paga ao carrinho, confirme o badge no header e o card em `/carrinho`, finalize em “Finalizar Compra (simulado)” (vai para `/checkout?cart=1`), clique em pagar, veja o toast de sucesso e confirme que o carrinho esvazia e o paywall deixa de bloquear a receita.
5. **Categorias dinâmicas:** no editor, clique no botão “+” próximo ao select de categorias, preencha nome/emoji/descritivo, confirme que a categoria nova é selecionada e aparece nos selects e no site público.
6. **Newsletter:** na home, abaixo do texto “Inscreva-se em nossa newsletter...”, use o campo de email (validação básica); os envios vão para `localStorage` em `rdb_newsletter_subscribers` e exibem mensagens de sucesso/erro.

## Observações técnicas

- **LocalStorage:** o data layer usa repositórios (`recipeRepo`, `cartRepo`, `categoryRepo`) para encapsular leitura/gravação. O `recipeRepo` garante migrações de campos antigos (`priceCents`, `ingredients`, `instructions`) e mantém compatibilidade com dados existentes.
- **Imagem:** o editor gera `imageDataUrl` compactado (max width 1280px, JPEG), persistido no recipe e usado para preview + site público. Upload de arquivo é obrigatório para receitas novas.
- **Preço:** no editor, o campo aceita “7.90”, “7,90” ou “7”; internamente grava `priceBRL` com duas casas e o público sempre usa `formatBRL`.
- **Teaser:** para receitas pagas bloqueadas, o frontend mostra apenas os dois primeiros ingredientes e passos (`fullIngredients.slice(0, 2)` / `fullInstructions.slice(0, 2)`). O paywall reforça que o restante é liberado após a compra.
- **Favicon:** o ícone agora é um emoji de cozinheiro (`👩‍🍳`) com fundo alaranjado, refletindo o pedido do produto.

## Próximos passos potenciais

1. Adicionar validações mais ricas no editor (ex.: checklists obrigatórios).
2. Persistir assinaturas da newsletter em um mock HTTP para testes E2E.
3. Complementar o README com roteiro de testes automatizados quando o backend estiver disponível.
