# FRONT-004 — Validação de Convites Admin

**Status:** Em discovery (documentação pronta para desenvolvimento)  
**Última atualização:** 2026-04-06 — OpenCode  
**Objetivo:** Garantir que apenas usuários convidados consigam concluir o onboarding admin e que o fluxo apresente mensagens claras quando o convite está inválido ou expirado.

---

## 1. Contexto e Problema

- `IMPLANTAR/TAREFAS_PENDENTES.md` define “Validação de Convites Admin” como prioridade P1 no front-end.
- Atualmente o formulário de criação/acesso admin (`src/pages/admin/LoginPage.tsx`) permite login ou bootstrap do tenant, porém não existe tratamento específico para convites individuais (multi-admin).
- Backend já utiliza Supabase Auth (`supabase.auth.admin.*`) e oferece métodos `inviteUserByEmail`, `verifyOtp` e `updateUserById`. Precisamos aproveitar esse fluxo no front.

## 2. Requisitos Funcionais

1. **Leitura do token de convite**
   - Convites serão enviados via e-mail com link `https://receitasbell.mtsferreira.dev/admin/login?invite=XYZ`.
   - Precisamos ler `invite` via `useSearchParams` e manter em estado.

2. **Validação ao carregar**
   - Chamar endpoint `/api/admin/invites/validate?token=XYZ` _(a ser criado no backend; alternativa temporária: `supabase.auth.verifyOtp({ type: 'invite', token })` via API handler)_.
   - Respostas possíveis: `valid`, `expired`, `invalid`, `used`.
   - Estados devem ser exibidos no UI antes de liberar o formulário de definição de senha.

3. **Fluxo de aceitação**
   - Convidado define senha e confirma (mesmo schema de `ResetPasswordPage`).
   - Ao confirmar, chamar `/api/admin/invites/accept` enviando `{ token, password, passwordConfirm }`.
   - Em caso de sucesso → redirecionar para `/t/:tenantSlug/admin` já autenticado.

4. **Feedback visual**
   - Status banner (Success/Warning/Error) no topo do card:
     - Inválido/Expirado → `destructive` + call to action “Solicitar novo convite”.
     - Válido → `success` com dados do tenant/nome do convidador.
   - Botão “Solicitar novo convite” abre modal com formulário `email + motivo`, enviando para `/api/admin/invites/request` (será processado no backend ou e-mail manual).

5. **Tracking**
   - Eventos `trackEvent('admin.invite.valid')`, `admin.invite.invalid`, `admin.invite.accepted`.

6. **Acessibilidade**
   - Mensagens devem ser associadas via `aria-live="polite"`.
   - Inputs com `aria-invalid` quando apropriado.

## 3. Arquitetura e Arquivos Impactados

| Arquivo                                               | Ação                                                                                                        |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `src/pages/admin/LoginPage.tsx`                       | Ler `invite` da URL, renderizar novo modo “aceitar convite” com card dedicado.                              |
| `src/components/admin/AdminInviteBanner.tsx` _(novo)_ | Componente responsável por mostrar status do convite (ilustrações, mensagens).                              |
| `src/lib/api/adminInvites.ts` _(novo)_                | Wrapper para `validateInvite` e `acceptInvite` consumindo a API.                                            |
| `api_handlers/admin/invites/validate.ts` _(backend)_  | Endpoint GET que usa Supabase `verifyOtp` ou tabela `admin_invites`. (Necessário alinhar com time backend.) |
| `api_handlers/admin/invites/accept.ts` _(backend)_    | Endpoint POST que define senha inicial e ativa o usuário.                                                   |

_Obs.: Como estamos na pasta FRONT, apenas preparamos o contrato esperado para o backend; caso não exista, registrar bloqueio em `03-BLOQUEIOS.md`._

## 4. Fluxo UX (Resumo)

```
Recebe link → abre /admin/login?invite=XYZ
  ↳ Loading banner “Validando convite…”
    ↳ Se válido → mostra card “Convite para {tenant}” + formulário definir senha (senha + confirmar)
    ↳ Se expirado/inválido → mostra card de erro + botão “Solicitar novo convite”
```

## 5. Estados e Wireframe Simplificado

```
┌─────────────────────────────┐
│ Convite para Receitas Bell │ ← Banner verde
├─────────────────────────────┤
│ E-mail convidado (readonly) │
│ Campo Senha                │
│ Campo Confirmar Senha      │
│ Botão [Criar acesso]       │
└─────────────────────────────┘

Erro (expirado):
┌─────────────────────────────┐
│ Convite expirado            │ ← Banner vermelho + ícone ⚠️
│ “Peça um novo convite ao time.”
│ [Solicitar novo convite]    │
└─────────────────────────────┘
```

## 6. Plano de Desenvolvimento

1. **Criar módulo `AdminInviteContext` (opcional)**
   - Hook `useAdminInvite` responsável pelo estado (`status`, `email`, `tenantName`).

2. **Atualizar `LoginPage`**
   - Se `invite` presente → renderizar componente `AdminInviteAcceptance`.
   - Caso contrário → fluxo atual (login/bootstrapping) permanece intacto.

3. **Implementar validação visual**
   - Spinner inicial enquanto `validateInvite` está carregando.
   - Mensagens diferentes para `invalid`, `expired`, `used`.

4. **Integrar com API**
   - `validateInvite(token)` → GET `/api/admin/invites/validate?token=${token}`.
   - `acceptInvite({ token, password })` → POST `/api/admin/invites/accept`.
   - Tratar erros `ApiClientError` (mensagens do backend) e fallback genérico.

5. **Telemetry & Analytics**
   - Adicionar `trackEvent` para sucesso/falha.

6. **Testes**
   - Component tests para `AdminInviteBanner` (estado, mensagens).
   - Testes e2e (Playwright) simulando query param `invite` com mocks das rotas.

## 7. Critérios de Aceite

- [ ] Ao acessar `/admin/login?invite=VALIDA`, usuário visualiza informações do convite e consegue definir senha.
- [ ] Convite expirado/inválido exibe estado de erro com CTA para solicitar outro.
- [ ] Sem token (URL padrão) mantém login atual (não quebra regressões).
- [ ] Eventos de telemetry são disparados.
- [ ] Docs atualizados (este arquivo + `STATUS-FRONT`).

## 8. Bloqueios / Dependências

- Depende de endpoints `validate` / `accept` no backend (TASK-004 / TASK-006). Caso ainda não existam, alinhar com Antigravity e registrar em `03-BLOQUEIOS.md`.
- Precisa confirmar formato do token (Supabase OTP vs. tabela própria) para evitar suposições incorretas.

---

_Este dossiê serve como blueprint para implementação da FRONT-004. Após finalizar o código, atualizar `STATUS-FRONT.md` e mover este arquivo para histórico se aplicável._
