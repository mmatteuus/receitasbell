# 🧪 Testes — FRONT-004 Validação de Convites Admin

**Data:** 2026-04-06  
**Status:** Implementação concluída — aguardando testes  
**Owner:** OpenCode

---

## ✅ Checklist de Implementação

### Frontend

- [x] `src/lib/api/adminInvites.ts` — Client API criado
  - `validateInvite(token)` — Valida token
  - `acceptInvite({ token, password, passwordConfirm })` — Aceita convite
  - `requestNewInvite(email, reason)` — Solicita novo

- [x] `src/components/admin/AdminInviteBanner.tsx` — Componente de banner
  - Estados: `loading`, `valid`, `expired`, `invalid`, `used`
  - Mensagens contextualizadas
  - CTA para solicitar novo convite

- [x] `src/components/admin/AdminInviteAcceptance.tsx` — Formulário
  - Lê token da URL (`invite=XYZ`)
  - Validação ao carregar
  - Campos de senha com confirmação
  - Feedback visual (erros, sucesso)
  - Telemetry (`trackEvent`)

- [x] `src/pages/admin/LoginPage.tsx` — Integração
  - Detecta `?invite=` na URL
  - Renderiza fluxo alternativo quando token presente
  - Mantém fluxo normal quando ausente

### Backend

- [x] `src/server/admin/invites.ts` — Serviço
  - `validateAdminInviteToken(token)` — Valida e retorna status
  - `acceptAdminInvite(request, response, { token, password })` — Aceita
  - `requestNewAdminInvite(tenantId, email)` — Solicita novo
  - Geração de tokens e expiração

- [x] `api_handlers/admin/invites/validate.ts` — Endpoint GET
  - Valida token via header `x-invite-token`
  - Retorna status e detalhes

- [x] `api_handlers/admin/invites/accept.ts` — Endpoint POST
  - Recebe `{ token, password, passwordConfirm }`
  - Valida força da senha
  - Cria sessão autenticada
  - Audit log

- [x] `api_handlers/admin/invites/request.ts` — Endpoint POST
  - Solicita novo convite
  - Valida e-mail

---

## 🧪 Testes Manuais

### Teste 1: Validação de Convite Válido

```bash
# Acessar com token válido
https://localhost:3000/admin/login?invite=valid_fake_token_for_testing

# Resultado esperado:
# 1. Banner verde: "Convite válido"
# 2. Campos de email (readonly), senha e confirmação
# 3. Botão "Criar acesso admin" ativo
```

### Teste 2: Convite Expirado

```bash
# Acessar com token expirado
https://localhost:3000/admin/login?invite=expired_token_123

# Resultado esperado:
# 1. Banner vermelho: "Convite expirado"
# 2. Mensagem: "Peça um novo convite ao time."
# 3. Botão "Solicitar novo convite" disponível
```

### Teste 3: Convite Inválido

```bash
# Acessar com token inválido
https://localhost:3000/admin/login?invite=invalid_xyz

# Resultado esperado:
# 1. Banner vermelho: "Convite inválido"
# 2. CTA para solicitar novo
```

### Teste 4: Fluxo Completo de Aceitar

```bash
# 1. Acessar com token válido
https://localhost:3000/admin/login?invite=valid_test_token

# 2. Preencher formulário:
#    - Email: convidado@example.com (readonly)
#    - Senha: SenhaForte123!@#
#    - Confirmar: SenhaForte123!@#

# 3. Clicar "Criar acesso admin"

# Resultado esperado:
# ✓ Usuário criado/atualizado no banco
# ✓ Sessão autenticada criada
# ✓ Redireciona para /t/:tenantSlug/admin
# ✓ Audit log registrado: "admin.invite.accepted"
```

### Teste 5: Senhas Não Coincidem

```bash
# Preencher com senhas diferentes
# Senha: SenhaForte123!@#
# Confirmar: OutraSenha456!@#

# Resultado esperado:
# ✓ Botão "Criar acesso admin" fica desabilitado
# ✓ Mensagem: "As senhas não coincidem."
```

### Teste 6: Senha Fraca

```bash
# Preencher com senha fraca
# Senha: 123

# Resultado esperado:
# ✓ Erro na submissão: "Senha não atende critérios mínimos"
```

---

## 📊 Telemetry Events

Os eventos abaixo devem ser registrados e visualizáveis em analytics:

```
✓ admin.invite.validated          → Token validado com sucesso
✓ admin.invite.validation_failed  → Validação retornou erro
✓ admin.invite.validation_error   → Erro ao validar
✓ admin.invite.accepted           → Convite aceito e usuário criado
✓ admin.invite.acceptance_failed  → Erro ao aceitar
✓ admin.invite.new_requested      → Novo convite solicitado
✓ admin.invite.new_request_failed → Erro ao solicitar novo
```

---

## 🔍 Verificações de Código

- [x] TypeScript sem erros (type-check)
- [x] Imports corretos
- [x] Acessibilidade: `aria-live`, `aria-invalid`
- [x] CSRF validado nos endpoints
- [x] Senhas hasheadas com argon2
- [x] Audit log registrado
- [x] Tratamento de erros com feedback claro

---

## 📝 Próximos Passos (Após Testes)

1. **Integração com Supabase/Email**
   - Criar tabela `admin_invites` com campos:
     - `id`, `token_hash`, `email`, `tenant_id`, `created_at`, `expires_at`, `accepted_at`, `status`
   - Implementar envio de email com link de convite

2. **Geração de Convites pelo Admin**
   - Endpoint `POST /api/admin/invites/generate` (requer admin)
   - Form em `src/pages/admin/ManageAdminsPage.tsx` (novo)

3. **Dashboard de Convites Pendentes**
   - Listar convites ativos por tenant
   - Revogar/resender convites

4. **Testes Automatizados**
   - Component tests (Vitest + React Testing Library)
   - E2E tests (Playwright)
   - Testes de segurança (CSRF, validação de entrada)

---

_Documento atualizado: 2026-04-06 — OpenCode._
