# Dossiê Mestre — Índice, Regras e Decisões de Execução

**Projeto:** Receitas Bell  
**Destino:** Agente Executor  
**Regra operacional inegociável:** executar tudo **diretamente no `main`**, sem criar branch, sem PR paralela, sem ramo temporário.

**Assinatura:** [Desenvolvido por MtsFerreira](https://mtsferreira.dev)

---

## 1. Fonte de verdade aplicada

Este dossiê foi organizado para respeitar o processo obrigatório F0–F9, a estrutura de 13 seções do handoff e o protocolo de não-quebra definidos no guia mestre do projeto. fileciteturn84file1

Também foi levado em conta o catálogo de fontes/APIs já anexado, especialmente para boas práticas de integrações brasileiras, rate limit, OCR, NF-e, Keycloak, Mercado Pago e compliance LGPD. fileciteturn84file0

---

## 2. Escopo consolidado desta entrega

Este pacote cobre **todo o contexto levantado na conversa**, incluindo:

1. Auditoria do backend e da operação atual.
2. Diagnóstico do erro de build/deploy.
3. Diagnóstico do erro `500` nas rotas administrativas de pagamentos.
4. Diagnóstico do warning do ícone PWA.
5. Fechamento da lacuna de autenticação do usuário final com OAuth social.
6. Revisão do fluxo de magic link.
7. Saneamento operacional do Baserow para conexões Mercado Pago e Payment Orders.
8. Runbooks, rollback, previsão de falhas futuras e instruções exatas para o Codex.

---

## 3. F0 — Kickoff

### O que foi inspecionado de fato
- Repositório `mmatteuus/receitasbell` via GitHub connector.
- Projeto Vercel `receitasbell`.
- Tabelas reais do Baserow, incluindo `Settings`, `Sessions`, `mercado_pago_connections`, `Payment_Orders`, `magic_links`, `Users` e `Tenants`.
- Código de:
  - sessão
  - magic link
  - pagamentos/admin
  - readiness
  - env parsing
  - Mercado Pago connections/client
  - AccountHome
  - settings repo
  - testes de readiness/admin Mercado Pago

### O que não foi possível validar 100%
- Logs internos completos do `500` autenticado em produção.
- Schema formal/DDL do Baserow além do que foi inferido pelos rows e pelo código.
- Todos os handlers auxiliares cobertos por busca semântica fina no repositório.
- Exclusão automática do branch auxiliar já criado, porque a ferramenta disponível expõe criação e atualização de refs/arquivos, mas **não expõe delete de branch/ref**.

### Riscos imediatos
- **P0:** build quebrado por merge conflict commitado em código do cliente Mercado Pago.
- **P1:** drift entre código endurecido de conexões Mercado Pago e dados reais legados/incompletos.
- **P1:** tabela `Payment_Orders` com linhas placeholder inválidas contaminando listagem admin.
- **P1:** fluxo `/minha-conta` ainda não autentica o usuário final de forma social real.
- **P1:** asset PWA de ícone quebrado no deploy.
- **P1:** possível expiração incorreta do magic link por semântica de campo no Baserow.
- **P1:** segredos e tokens detectados em dados operacionais exigem rotação e hardening.

### SUPOSIÇÃO mínima e reversível
A funcionalidade-alvo continua sendo:
- estabilizar pagamentos/admin
- corrigir operação Mercado Pago
- concluir autenticação social do usuário final com Google primeiro
- manter fallback por magic link
- **sem tocar no login administrativo**

---

## 4. Trilha escolhida

# **TRILHA B — Evoluir existente**

### Justificativa
Há backend funcional, com auth, multi-tenant, sessions, payments, Baserow, readiness e área administrativa. Não é caso de criação do zero, mas de:
- correção de regressões
- saneamento operacional
- hardening
- conclusão de fluxo incompleto
- preservação de comportamento existente sem quebra

---

## 5. Regras duras para o Codex

## 5.1 Execução
- Trabalhar **somente no `main`**
- Não criar branch
- Não abrir branch temporária
- Não abrir branch de correção
- Não mover arquivos para outro ramo
- Fazer mudanças pequenas e validáveis
- Sempre rodar testes antes e depois de cada mudança relevante

## 5.2 Não-Quebra
Aplicar o protocolo da seção 44 do guia em toda mudança. fileciteturn84file1

Tradução operacional:
- mudança aditiva primeiro
- feature flag para comportamento novo
- expand-contract para schema/fluxo sensível
- rollback em 1 comando
- snapshot antes de mutação destrutiva
- canário por etapas quando a mudança tocar produção

## 5.3 Segurança
- Não expor segredos em docs, commits, logs, testes ou outputs
- Não reenviar credenciais encontradas
- Não copiar tokens em plaintext para documentação
- Qualquer segredo detectado em storage operacional deve gerar **rotação obrigatória**

---

## 6. Índice dos arquivos deste pacote

1. `00-indice-e-regras.md`  
   Visão geral, trilha, regras e ordem operacional.

2. `01-snapshot-auditoria-achados.md`  
   Snapshot técnico, checklist aplicado, mapa do backend e achados P0–P3.

3. `02-mercadopago-admin-pwa.md`  
   Diagnóstico completo de Mercado Pago/admin/pagamentos e warning do PWA.

4. `03-oauth-social-magic-link.md`  
   Dossiê completo da autenticação social do usuário final e revisão do magic link.

5. `04-plano-execucao-runbooks-futuro.md`  
   Tasks executáveis, comandos, rollback, runbooks, compliance e previsão de falhas futuras.

---

## 7. Critério de conclusão desta execução

A execução só pode ser considerada concluída quando **todos** estes pontos estiverem verdes:

- build passa
- `npm run gate` passa
- `/api/admin/payments/settings` responde 200 autenticado
- `/api/admin/payments` responde 200 autenticado
- merge conflict foi eliminado
- warning do ícone PWA desapareceu
- OAuth social do usuário final funciona
- magic link continua funcionando
- login admin continua funcionando
- nenhum segredo novo foi exposto
- tudo foi feito no `main`

---

## 8. Observação sobre o branch auxiliar

Foi criado anteriormente um branch documental auxiliar durante a investigação.  
**Conteúdo útil será transferido/espelhado para `main/implantar/`**.

### Limitação real da ferramenta
Nesta sessão, a interface disponível para GitHub expõe:
- create branch
- update ref
- create file
- compare commits
- fetches diversos

Ela **não expõe delete branch/ref**. Portanto:
- o conteúdo útil será consolidado em `main`
- a exclusão do ramo auxiliar, se ainda necessária após a consolidação, deve ser feita manualmente no GitHub UI/API

Isso **não impede** o executor de trabalhar 100% no `main` a partir deste pacote.
