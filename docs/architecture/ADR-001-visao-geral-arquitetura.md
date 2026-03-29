# ADR-001: Visão Geral da Arquitetura

**Status:** Aceito

**Contexto:**
Este documento descreve a arquitetura de alto nível do sistema Receitas Bell. O objetivo é fornecer uma visão geral das tecnologias, padrões e componentes que formam a aplicação, servindo como um guia para novos desenvolvedores e como base para futuras decisões arquiteturais.

**Decisão:**
A arquitetura adotada é a de uma aplicação web moderna, desacoplada, com um frontend em React (Progressive Web App), um backend baseado em Serverless Functions e o Baserow como sistema de gerenciamento de banco de dados.

### Componentes Principais

1.  **Frontend:**
    *   **Framework:** React v18 com Vite como ferramenta de build.
    *   **Linguagem:** TypeScript.
    *   **Estilo:** Tailwind CSS com PostCSS. Aderimos a um sistema de design interno utilizando componentes Radix UI como base, seguindo uma abordagem similar ao `shadcn/ui` para componentização.
    *   **Roteamento:** `react-router-dom` para navegação no lado do cliente.
    *   **Gerenciamento de Estado:** `zustand` para estado global da UI e `@tanstack/react-query` para gerenciamento de estado de servidor (cache, revalidação, etc.).
    *   **PWA:** `vite-plugin-pwa` é utilizado para habilitar funcionalidades de Progressive Web App, como instalação e acesso offline.

2.  **Backend (Serverless):**
    *   **Plataforma:** Vercel (Cloud Functions e Edge Functions).
    *   **Estrutura:** A API é organizada na pasta `/api`, seguindo o padrão de roteamento baseado em arquivos da Vercel.
    *   **Lógica de Negócio:** Para promover a separação de responsabilidades, a lógica de negócio principal reside na pasta `/api_handlers`. As funções da Vercel em `/api` atuam como a camada de entrada (controller), invocando os serviços e casos de uso definidos em `/api_handlers`.
    *   **Linguagem:** TypeScript sobre Node.js (v20.x).

3.  **Banco de Dados:**
    *   **Sistema:** [Baserow](https://baserow.io) (Headless/API-first).
    *   **Justificativa:** A escolha do Baserow é detalhada no ADR-002.
    *   **Interação:** A comunicação é feita via API REST, com um cliente otimizado em `src/server/integrations/baserow` que inclui políticas de retry e timeout.

4.  **Serviços de Terceiros:**
    *   **Pagamentos:** Integração com Mercado Pago (OAuth por tenant e Checkout Pro) e Stripe.
    *   **Autenticação:** Sistema de "Magic Links" e gerenciamento de sessão próprio.
    *   **Rate Limiting:** Uso do `@upstash/ratelimit` com Redis para proteger a API contra abuso.
    *   **Observabilidade:** Sentry para monitoramento de erros e logs estruturados da Vercel.

### Estrutura de Rotas da API

A API é dividida por domínios de acesso para garantir a segurança e a clareza:

-   `api/public/*`: Endpoints de acesso público (catálogo, receitas, newsletter).
-   `api/auth/*`: Fluxo de autenticação (solicitação e verificação de magic link, logout).
-   `api/me/*`: Endpoints para usuários autenticados (dados do perfil, favoritos, histórico de compras).
-   `api/checkout/*`: Processamento de pagamentos, callbacks e webhooks.
-   `api/admin/*`: Painel de administração do lojista (requer autenticação de administrador).
-   `api/jobs/*`: Endpoints para tarefas agendadas e assíncronas (ex: reconciliação de pagamentos).
-   `api/health/*`: Verificação de status e saúde da aplicação.

**Consequências:**
*   **Positivas:**
    *   **Desacoplamento:** A separação clara entre frontend, backend e banco de dados facilita a manutenção e o desenvolvimento paralelo.
    *   **Escalabilidade:** A arquitetura serverless escala automaticamente com a demanda.
    *   **Produtividade:** O uso de uma stack moderna e popular atrai talentos e acelera o desenvolvimento.
*   **Negativas/Riscos:**
    *   **Complexidade de Gerenciamento:** A dependência de múltiplos serviços de terceiros (Vercel, Baserow, Upstash, Sentry) exige um bom gerenciamento de chaves de API e configurações.
    *   **Curva de Aprendizagem:** Novos desenvolvedores precisam se familiarizar com o ecossistema serverless da Vercel e o modelo de dados do Baserow.
    *   **Vendor Lock-in:** Existe um grau de acoplamento com a plataforma Vercel, embora a lógica de negócio em `api_handlers` possa ser migrada com esforço moderado.
