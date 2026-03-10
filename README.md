# Receitas do Bell

Aplicação web para catálogo de receitas com área pública, painel administrativo, carrinho, checkout simulado e gestão básica de pagamentos. Os dados são persistidos localmente em `localStorage`.

## Executando localmente

1. `npm install`
2. `npm run dev`
3. Abra a URL local exibida no terminal.

## Scripts

- `npm run dev`: inicia o ambiente de desenvolvimento.
- `npm run build`: gera o build de produção.
- `npm run lint`: executa o ESLint.
- `npm run preview`: serve o build localmente.

## Principais áreas

- Catálogo público: home, busca, categorias, página de receita, favoritos e institucionais.
- Fluxo comercial: carrinho, checkout simulado e histórico de desbloqueio de receitas pagas.
- Painel admin: listagem, criação e edição de receitas, configurações visuais e dashboard de pagamentos.
- Persistência local: repositórios em `src/lib/repos` e `src/lib/payments` encapsulam leitura, seed e atualização de dados.

## Fluxos para validação manual

1. Criar uma receita paga em `/admin/receitas/nova` com imagem, categoria e preço em reais.
2. Confirmar a presença da receita na home e verificar o teaser bloqueado em `/receitas/{slug}`.
3. Adicionar a receita ao carrinho, concluir o checkout simulado e confirmar a liberação do conteúdo completo.
4. Criar uma categoria no editor e validar a aparição dela no painel e no site público.
5. Enviar um email na newsletter e confirmar o registro em `localStorage`.

## Observações técnicas

- O editor normaliza slug, ingredientes, instruções, imagem e preço antes de persistir.
- Receitas pagas bloqueadas exibem apenas os dois primeiros ingredientes e passos até a compra.
- Os dados iniciais são carregados automaticamente quando o armazenamento local está vazio.
