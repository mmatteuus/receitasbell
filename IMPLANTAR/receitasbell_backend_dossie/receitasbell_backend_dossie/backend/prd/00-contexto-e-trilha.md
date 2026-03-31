# 00 — Contexto e Trilha

## F0 — Kickoff

### O que foi inspecionado
**FATO**
- Repositório GitHub `mmatteuus/receitasbell`.
- Projeto Vercel `receitasbell`.
- Deploys recentes da Vercel e logs de build.
- Conta Stripe conectada ao ambiente acessível.
- Arquivo sensível com credencial de service account exposto no material acessível.

### O que não foi possível validar
**[PENDENTE]**
- Schema real do Supabase.
- Políticas RLS, índices, funções e migrations reais.
- Variáveis de ambiente reais do projeto na Vercel.

### Riscos imediatos
**FATO**
1. Credencial sensível exposta.
2. Produção sem deploy saudável.
3. Divergência entre documentação, envs e runtime.
4. Fluxo de pagamento com idempotência incompleta no webhook.

### Suposições mínimas
**SUPOSIÇÃO**
- Stripe é o provider principal novo para o fluxo administrativo de pagamentos.
- Baserow ainda atende partes legadas do domínio.
- Supabase é a base operacional para sessão e autenticação.

### Escopo desta análise
- Backend HTTP em Vercel Functions.
- Autenticação, sessão, tenancy, catálogo público, jobs e pagamentos.
- Hardening, CI/CD, observabilidade, compliance e operação.

### Compliance identificado
**FATO**
- Há PII no domínio: email, IP, user-agent, user_id, tenant_id e dados de compra.
- É obrigatório tratar LGPD com mapa de dados, retenção, masking e trilha de auditoria.

### Horizonte de previsão
- 3 meses
- 1 ano
- 3 anos

## F4 — Trilha escolhida

# TRILHA C — Auditar e melhorar

### Justificativa
**FATO**
- O backend já existe e possui módulos operacionais.
- O problema central é quebra operacional, drift arquitetural e lacunas de hardening.
- Não há evidência de necessidade de reescrita completa.

## Objetivo da trilha
1. Restaurar build e deploy.
2. Eliminar riscos P0.
3. Padronizar auth, handlers, contratos e docs.
4. Endurecer CI/CD e segurança.
5. Tornar operação e rollout auditáveis.



---
**Desenvolvido por MtsFerreira** — https://mtsferreira.dev

