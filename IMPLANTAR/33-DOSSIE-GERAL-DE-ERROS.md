# DOSSIÊ GERAL DE ERROS E DÉBITOS TÉCNICOS - ReceitasBell

## 1. ERROS CRÍTICOS (PRODUÇÃO)

### 1.1. Falha no Stripe Connect (Status 500)
- **Onde**: `POST /api/payments/connect/account`
- **Erro**: `StripePermissionError: You can only create new accounts if you've signed up for Connect...`
- **Causa**: A conta plataforma do Stripe não ativou o recurso Connect.
- **Ação**: O usuário deve ativar o Connect no Dashboard do Stripe.

### 1.2. Falha de Contexto de Tenant (Status 401)
- **Onde**: `/api/public/catalog`, `/api/public/categories`, `/api/settings`
- **Erro**: `Tenant context is required.`
- **Causa**: O `requireTenantFromRequest` não encontra o tenant via host em domínios de preview ou quando o host não bate exatamente com o cadastrado.
- **Impacto**: Site carregando em branco ou com erro para visitantes.

### 1.3. Caching de Erros API (Bug de Performance/UX)
- **Onde**: Todos os handlers que usam `setPublicCache` (como `categories.ts`).
- **Problema**: O cache é definido **antes** da validação do tenant. Se a validação falha, o erro 401 é "carimbado" como cache de 1 hora na Vercel.
- **Impacto**: Uma falha momentânea de DNS ou DB pode "derrubar" o site por 1 hora para todos os usuários via cache da CDN.

---

## 2. DADOS E INTEGRIDADE (SUPABASE)

### 2.1. Receitas com Dados Nulos
- **Imagens**: 3 de 8 receitas iniciais estão com `image_url` nulo.
- **SEO**: 100% das receitas estão com `seo_title` e `seo_description` nulos.
- **Impacto**: SEO pobre e interface visual incompleta (placeholders).

### 2.2. Ambiguidade de Multi-tenancy
- **Organizações**: Existem 3 organizações ativas (`default`, `receitasbell`, `receitasbell-preview`).
- **Problema**: A lógica de fallback do sistema espera apenas **uma** organização para funcionar sem host definido. Ter 3 organizações ativas quebra o acesso local (localhost) e previews.

---

## 3. INFRAESTRUTURA E ENV VARS

### 3.1. APP_BASE_URL Inconsistente
- **Suspeita**: O sistema de redirecionamento do Stripe/Auth às vezes tenta usar a URL detectada em vez da configurada, ou a configurada está errada no Vercel (apontando para localhost ou domínio antigo).

---

## 4. AUDITORIA DE CÓDIGO (EXECUTOR)

### 4.1. Arquivos com Bugs Lógicos Confirmados
1. `api_handlers/public/categories.ts`: Ordem de `setPublicCache` errada (causa cache de erro).
2. `src/server/tenancy/resolver.ts`: Lógica de host muito rígida (não suporta previews de forma nativa).
3. `src/server/shared/http.ts`: `sendProblem` não limpa headers de cache pré-existentes.

---

## SOLICITAÇÃO AO AGENTE PENSANTE

Solicito que o Agente Pensante analise este dossiê e o de Stripe (`32-DOSSIE-STRIPE-CONNECT-BOTAO-NAO-FUNCIONA.md`) para gerar um plano de correção unificado.

**Destaque especial para o BUG DE CACHE**: Este é o mais urgente, pois propaga falhas de 401/500 por 1 hora.

---
*Gerado pelo Agente Executor em 2026-04-03T19:40h*
