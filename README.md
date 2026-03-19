# Receitas do Bell

Aplicação web para catálogo de receitas com área pública, painel administrativo, carrinho multi-itens, checkout com modo sandbox/real, exportação para PDF e gestão básica de pagamentos. A persistência principal do negócio roda em Vercel Functions com Google Sheets como banco do MVP, mas o frontend permanece isolado dessa integração por meio de repositórios e endpoints HTTP.

## Executando localmente

1. `npm install`
2. Configure as variáveis de ambiente do backend.
3. `npm run dev`
4. Abra a URL local exibida no terminal.

## Variáveis de ambiente

Obrigatórias:

- `GOOGLE_PROJECT_ID`
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_SPREADSHEET_ID`
- `GOOGLE_DRIVE_FOLDER_ID` para upload de imagens do admin
- `APP_BASE_URL`
- `ADMIN_API_SECRET`

O backend normaliza `\\n` para quebras de linha reais ao ler `GOOGLE_PRIVATE_KEY`.

Opcionais para integração real de pagamento:

- `MP_ACCESS_TOKEN`
- `MP_WEBHOOK_SECRET`

Nunca use prefixo `VITE_` para segredos.

## Arquitetura

- `api/`: Vercel Functions expostas para o frontend.
- `src/pages/public` e `src/pages/admin`: pontos de entrada de rotas públicas e administrativas.
- `src/features`: barrels por domínio (`recipes`, `cart`, `categories`, `payments`, `account`) para desacoplar UI, regras e repositórios.
- `src/lib/repos`: camada de acesso a dados no frontend, isolando chamadas HTTP da UI.
- `src/lib/services/googleSheetsService.ts`: autenticação compartilhada com Google Sheets e Google Drive via service account.
- `src/lib/services/mercadoPagoService.ts`: boundary do checkout e dos estados de pagamento, preparada para Mercado Pago via contrato `create-preference`.
- `src/server/sheets/`: repositórios por domínio para receitas, categorias, entitlements, comentários, ratings, favoritos, pagamentos, lista de compras, newsletter e settings.
- `src/lib/api/`: cliente HTTP do frontend para consumir `/api`.
- `src/contexts/app-context.tsx`: settings/categorias globais, tema e identidade leve por e-mail.
- `vercel.json`: mantém o fallback SPA para o React Router sem capturar `/api/*`, preservando Functions reais em `api/`.

## Diagnóstico desta etapa

- A base já possuía boa parte da arquitetura-alvo, mas com contratos sobrepostos entre `lib/api`, `lib/repos` e `src/server/sheets`.
- O front não acessava Sheets diretamente, porém faltava consolidar o caminho oficial de pagamentos para um backend real.
- O editor de receitas já tinha upload de imagem e slug automático, mas ainda havia hardcodes de categoria e pouca visibilidade do teaser.
- O admin de pagamentos ainda dependia de tabela horizontal em mobile, o que contrariava o requisito mobile-first.

## Organização de dados

- Tipos principais:
  - `Recipe`: slug automático, preço em reais com centavos, `accessTier`, `status`, `publishedAt`.
  - `Category`: criada dinamicamente no admin e reaproveitada em todo o site.
  - `Payment`: pagamento multi-item com `recipeIds[]`, `totalBRL`, pagador, status e metadados do gateway.
  - `Entitlement`: liberação por e-mail do comprador com `paymentId`, `recipeSlug` e `accessStatus`.
- Repositórios principais do frontend:
  - `recipeRepo.ts`
  - `categoryRepo.ts`
  - `paymentRepo.ts`
  - `entitlementRepo.ts`
  - `cartRepo.ts`
  - `profileRepo.ts`
- Abas centrais do Google Sheets:
  - `recipes`
  - `categories`
  - `payments`
  - `entitlements`
  - `settings`
- Abas auxiliares do MVP:
  - `recipe_ingredients`, `recipe_instructions`, `recipe_tags`, `recipe_unlocks`, `payment_events`, `payment_notes` e outras de interação.
  - `recipe_unlocks` permanece apenas como legado de backfill para popular `entitlements`.

## Endpoints principais

- `GET /api/recipes`
- `GET /api/recipes/:slug`
- `POST /api/recipes`
- `PUT /api/recipes/:id`
- `DELETE /api/recipes/:id`
- `GET /api/categories`
- `POST /api/categories`
- `GET /api/comments`
- `POST /api/comments`
- `POST /api/ratings`
- `GET /api/favorites`
- `POST /api/favorites`
- `DELETE /api/favorites/:id`
- `GET /api/settings`
- `PUT /api/settings`
- `GET /api/payments`
- `GET /api/payments/:id`
- `POST /api/payments/:id/note`
- `POST /api/payments/mercadopago/create-preference`
- `POST /api/payments/mercadopago/webhook`
- `GET /api/entitlements`
- `POST /api/entitlements`
- `DELETE /api/entitlements`
- `GET /api/admin/payments`
- `GET /api/admin/payments/:id`
- `POST /api/admin/payments/:id/note`
- `POST /api/uploads/recipe-image`
- `DELETE /api/uploads/recipe-image`
- `GET /api/shopping-list`
- `POST /api/shopping-list`
- `PUT /api/shopping-list/:id`
- `DELETE /api/shopping-list/:id`
- `POST /api/checkout`
- `POST /api/newsletter`

## Scripts

- `npm run dev`: inicia o ambiente de desenvolvimento.
- `npm run build`: gera o build de produção.
- `npm run lint`: executa o ESLint.
- `npm run preview`: serve o build localmente.

## Principais áreas

- Catálogo público: home, busca, categorias, página de receita, favoritos e institucionais.
- Fluxo comercial: carrinho local, checkout em modo sandbox ou Mercado Pago real e desbloqueio de receitas pagas no Sheets.
- Paywall real: receitas pagas só devolvem conteúdo completo quando existe entitlement ativo para o e-mail do comprador.
- Painel admin: listagem, criação e edição de receitas, categorias dinâmicas, configurações visuais e dashboard de pagamentos.
- Persistência server-side: o frontend consome `/api`, enquanto as Functions escrevem e leem do Google Sheets.
- Identidade leve: o usuário informa um e-mail uma vez, esse valor é salvo em cookie (`rb_user_email`) e o backend resolve/cria o `user_id` correspondente na aba `users`.

## Fluxos para validação manual

1. Criar uma receita paga em `/admin/receitas/nova` com upload de imagem, categoria dinâmica e preço em reais com centavos.
2. Confirmar que o slug aparece apenas como URL readonly e que ele congela após a primeira publicação.
3. Validar o bloco de teaser automático no editor e o teaser bloqueado em `/receitas/{slug}`.
4. Exportar a receita para PDF. Em receita paga bloqueada, o PDF deve sair apenas com o teaser visível.
5. Adicionar uma ou mais receitas ao carrinho, revisar total, remover item, limpar carrinho e concluir o checkout.
6. Criar uma categoria no editor ou em `/admin/categorias` e validar a aparição dela no painel e no site público.
7. Abrir o admin de pagamentos em mobile e confirmar que a listagem vira cards em vez de tabela horizontal.
8. Enviar um e-mail na newsletter e confirmar o registro na aba `newsletter_subscribers`.
9. Favoritar, comentar, avaliar e manipular a lista de compras para validar persistência nas abas correspondentes.

## Observações técnicas

- O editor normaliza slug, ingredientes, instruções e preço antes de persistir; a imagem é enviada por upload e o Sheets guarda apenas URL e metadados.
- O slug é automático, não editável no admin e fica congelado após a primeira publicação.
- Categoria agora é obrigatória e validada tanto no frontend quanto no repositório server-side.
- Receitas pagas bloqueadas exibem apenas os dois primeiros ingredientes e passos até a compra, inclusive no PDF exportado.
- O webhook do Mercado Pago grava `payments` e sincroniza `entitlements`; `approved` ativa acesso e `cancelled/refunded/charged_back` revoga.
- O carrinho continua local por enquanto, mas já usa snapshots multi-itens preparados para preferências do Mercado Pago.
- O checkout principal do frontend aponta para `POST /api/payments/mercadopago/create-preference`, enquanto `POST /api/checkout` permanece como alias compatível.
- O admin de pagamentos passou a consumir `GET /api/admin/payments` e `GET /api/admin/payments/:id`, deixando a estrutura pronta para troca futura do banco do MVP.
