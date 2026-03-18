# Receitas do Bell

Aplicação web para catálogo de receitas com área pública, painel administrativo, carrinho, checkout simulado e gestão básica de pagamentos. A persistência principal do negócio roda em Vercel Functions com Google Sheets como banco do MVP.

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
- `MP_PUBLIC_KEY`
- `MP_WEBHOOK_SECRET`

Nunca use prefixo `VITE_` para segredos.

## Arquitetura

- `api/`: Vercel Functions expostas para o frontend.
- `src/pages/public` e `src/pages/admin`: pontos de entrada de rotas públicas e administrativas.
- `src/features`: barrels por domínio (`recipes`, `cart`, `categories`, `payments`, `account`) para desacoplar UI, regras e repositórios.
- `src/lib/repos`: camada de acesso a dados no frontend, isolando chamadas HTTP da UI.
- `src/lib/services/googleSheetsService.ts`: autenticação compartilhada com Google Sheets e Google Drive via service account.
- `src/lib/services/mercadoPagoService.ts`: boundary do checkout e dos estados de pagamento, pronta para evolução gradual da integração.
- `src/server/sheets/`: repositórios por domínio para receitas, categorias, comentários, ratings, favoritos, pagamentos, lista de compras, newsletter e settings.
- `src/lib/api/`: cliente HTTP do frontend para consumir `/api`.
- `src/contexts/app-context.tsx`: settings/categorias globais, tema e identidade leve por e-mail.

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
- `POST /api/uploads/recipe-image`
- `DELETE /api/uploads/recipe-image`
- `GET /api/shopping-list`
- `POST /api/shopping-list`
- `PUT /api/shopping-list/:id`
- `DELETE /api/shopping-list/:id`
- `POST /api/checkout`
- `POST /api/newsletter`
- `POST /api/mercadopago/webhook`

## Scripts

- `npm run dev`: inicia o ambiente de desenvolvimento.
- `npm run build`: gera o build de produção.
- `npm run lint`: executa o ESLint.
- `npm run preview`: serve o build localmente.

## Principais áreas

- Catálogo público: home, busca, categorias, página de receita, favoritos e institucionais.
- Fluxo comercial: carrinho local, checkout simulado persistente e desbloqueio de receitas pagas no Sheets.
- Painel admin: listagem, criação e edição de receitas, configurações visuais e dashboard de pagamentos.
- Persistência server-side: o frontend consome `/api`, enquanto as Functions escrevem e leem do Google Sheets.
- Identidade leve: o usuário informa um e-mail uma vez, esse valor é salvo em cookie (`rb_user_email`) e o backend resolve/cria o `user_id` correspondente na aba `users`.

## Fluxos para validação manual

1. Criar uma receita paga em `/admin/receitas/nova` com upload de imagem, categoria dinâmica e preço em reais.
2. Confirmar que o slug aparece apenas como preview automático e verificar o teaser bloqueado em `/receitas/{slug}`.
3. Adicionar uma ou mais receitas ao carrinho, concluir o checkout simulado e confirmar a liberação do conteúdo completo.
4. Criar uma categoria no editor e validar a aparição dela no painel e no site público.
5. Enviar um e-mail na newsletter e confirmar o registro na aba `newsletter_subscribers`.
6. Favoritar, comentar, avaliar e manipular a lista de compras para validar persistência nas abas correspondentes.

## Observações técnicas

- O editor normaliza slug, ingredientes, instruções e preço antes de persistir; a imagem é enviada por upload e o Sheets guarda apenas URL e metadados.
- O slug é automático, não editável no admin e fica congelado após a primeira publicação.
- Receitas pagas bloqueadas exibem apenas os dois primeiros ingredientes e passos até a compra.
- O carrinho continua local por enquanto, mas já usa snapshots multi-itens preparados para preferências do Mercado Pago.
