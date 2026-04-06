# Dossiê Guto - Finalização PWA e Stripe (Ambiente de Produção)

## O Que Falta Fazer

A aplicação Receitas Bell já passou pela remoção total do Baserow, implementação do cadastro/login/recuperação por senha com Supabase Auth e correção dos slugs de PWA. No entanto, o Stripe Connect na Vercel ainda está operando com chaves de teste (`pk_test` e `sk_test`).

Para concluir o projeto 100%, é necessário **extrair as chaves reais de produção da Stripe**, **configurá-las na Vercel** e **testar o fluxo E2E (ponta a ponta)** realizando uma simulação de compra e cadastro de conta.

---

## Passo a Passo (Como, Onde e Quando)

### 1. Obtenção das Chaves de Produção (Live)
- **Quando:** Imediatamente no início da sessão.
- **Onde:** No Stripe Dashboard (via Navegador/Browser Subagent).
- **Como:**
  1. Acessar `https://dashboard.stripe.com/acct_1T4JafCuHeylIIjI/apikeys`.
  2. Garantir que a chave seletora superior "Test mode" (Modo de teste) esteja **desativada** (off).
  3. Copiar a **Publishable key** (`pk_live_...`).
  4. Clicar em "Reveal" para a **Secret key** (`sk_live_...`) e copiar (A verificação de 2FA/SMS já foi realizada e aprovada pelo dono da conta).
  5. Acessar `https://dashboard.stripe.com/webhooks`.
  6. Selecionar o webhook que aponta para `https://receitasbell.mtsferreira.dev/api/payments/webhook/stripe`.
  7. Clicar em "Reveal" no "Signing secret" e copiar a chave (`whsec_...`).

### 2. Configuração de Variáveis de Ambiente na Vercel
- **Quando:** Após possuir as três chaves acima em mãos.
- **Onde:** CLI da Vercel (rodando local via comandos) ou no Vercel Dashboard.
- **Como:**
  * Utilizar os comandos:
    ```bash
    vercel env add STRIPE_PUBLISHABLE_KEY production
    vercel env add STRIPE_SECRET_KEY production
    vercel env add STRIPE_WEBHOOK_SECRET production
    ```
  * Inserir os valores `pk_live_...`, `sk_live_...`, e `whsec_...` respectivos.

### 3. Deploy de Atualização
- **Quando:** Logo após as variáveis serem atribuídas.
- **Onde:** Repositório local (CLI) e Vercel.
- **Como:**
  * Rodar `vercel deploy --prod` para enviar o ambiente e forçar um novo deploy utilizando as credenciais recém-cadastradas.
  * Acompanhar os logs simulando interações para atestar sucesso.

### 4. Testes End-to-End (E2E) em Produção
- **Quando:** Assim que o novo deploy estiver online.
- **Onde:** No navegador, com a URL base em https://receitasbell.vercel.app ou o link de prod exato.
- **Como:**
  1. Criar um novo usuário normal pelo App PWA (`/pwa/login`). Validar se o erro de "Organização não identificada" sumiu de vez (já resolvido pelo fallback no código).
  2. Fazer Login na conta recém-cadastrada.
  3. Clicar em comprar uma receita paga qualquer e processar o checkout de simulação (requer cartão real devido ao modo produção, avalie o estorno se cobrar de verdade, ou veja cupons habilitados).

---

## Tratativas de Erros Futuros Previstas

1. **"Erro ao Revelar Chaves / Stripe Bloqueia Acesso":** O agente deve lembrar o usuário de enviar o token SMS caso a sessão do Stripe caia, assim que clicar para revelar `sk_live_`.
2. **"Vercel Env Add não Substitui Chave Existente":** Se atente que pode ser necessário rodar `vercel env rm NOME_DA_VARIAVEL production` antes de adicionar o valor novo, pois a Vercel pode rejeitar sobreposições na CLI. 
3. **"401 Falha de Login / Refresh Token Inválido na Vercel":** Isso ocorre caso a migração do Baserow para Supabase nos cookies persistíveis entre em conflito, falhando o state. Limpe *Application Data / Cookies* testando anonimamente via "Browser Subagent".
4. **"Pagamento Funciona, mas não Desbloqueia na Tela":** Sintoma de falha no Webhook com HMAC diferente. Verifique minuciosamente se `STRIPE_WEBHOOK_SECRET` que está na Vercel é IDENTICO ao que o dashboard da Stripe na aba Developers -> Webhooks mostra.

---

**Nota Final:** O código já se encontra maduro. O trabalho final é exclusivamente gerencial e operacional sobre a Infraestrutura e Teste. 
