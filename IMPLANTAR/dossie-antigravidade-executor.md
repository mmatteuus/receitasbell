# Dossie Antigravidade - Executor Receitas Bell

Projeto: Receitas Bell
Objetivo final: admin funcional em producao, deploy READY, somente main, e checklist final concluido.

## PRB (Problema)

- Admin nao autentica por falha de bootstrap e ausencia de usuario em auth.users + profiles.
- Vercel esta com Node 24.x enquanto o repo exige Node 20.x.
- Branch secundaria ja foi removida, mas o deploy e a recuperacao do admin ainda estao pendentes.

## DDP (Definicao de Pronto)

- admin@receitasbell.com existe em auth.users
- profiles.id == auth.users.id
- role do admin e admin ou owner
- password_hash presente
- POST /api/admin/auth/session retorna 200
- Vercel alinhada para Node 20.x
- deploy de producao READY
- somente main permanece

## Regras operacionais

- Trabalhe apenas na branch main.
- Nao use comandos destrutivos.
- Nao comite segredos (ex: .env, service role key).
- Priorize MCPs (Supabase, Vercel, GitHub). Use navegador somente se necessario.
- Se houver bloqueio por acesso, registre o bloqueio e o que faltou.

## Contexto do que ja foi feito (nao repetir)

- Ajustes feitos em:
  - src/server/identity/repo.ts
  - src/server/tenancy/service.ts
  - src/server/admin/auth.ts
  - api_handlers/auth/signup-password.ts
- Teste ajustado: tests/admin-auth.test.ts
- Script criado: scripts/fix-admin-receitasbell.mjs
- Dossie com status atualizado: IMPLANTAR/dossie-agente-executor-receitasbell.md
- Branch remota fix/admin-recovery-script removida
- Testes rodados localmente: lint (1 warning), typecheck, build, test:unit

## Passo 0 - Baseline

1. Git status:
   - Rode: git status -sb
   - Verifique arquivos modificados e o novo script nao commitado.

2. Leia o dossie principal:
   - IMPLANTAR/dossie-agente-executor-receitasbell.md
   - Siga apenas o que estiver em PENDENTE.

## Passo 1 - Recovery do admin em producao (Supabase MCP)

Objetivo: garantir auth.users + profiles corretos para admin@receitasbell.com.

1. Via MCP Supabase, confirme se o admin existe:
   - auth.users: email admin@receitasbell.com
   - public.profiles: id igual ao auth.users.id, role admin/owner, password_hash presente

2. Se estiver faltando, rode o script:

   PowerShell (Windows):
   $env:SUPABASE_URL="https://SEU-PROJETO.supabase.co"
   $env:SUPABASE_SERVICE_ROLE_KEY="SUA_SERVICE_ROLE_KEY"
   $env:ADMIN_EMAIL="admin@receitasbell.com"
   $env:ADMIN_PASSWORD="TroqueAgora!123#"
   $env:TENANT_SLUG="receitasbell"
   $env:ADMIN_NAME="Admin Receitas Bell"
   $env:ADMIN_ROLE="owner"
   node scripts/fix-admin-receitasbell.mjs

3. Verifique a saida JSON com ok: true.

## Passo 2 - Smoke test do login admin

Execute:
curl -i ^
-H "Content-Type: application/json" ^
-H "X-Tenant-Slug: receitasbell" ^
-H "X-CSRF-Token: teste" ^
--cookie "\_\_Host-rb_csrf=teste" ^
-d "{\"email\":\"admin@receitasbell.com\",\"password\":\"TroqueAgora!123#\"}" ^
https://receitasbell.vercel.app/api/admin/auth/session

Esperado: HTTP 200 e authenticated: true.

## Passo 3 - Vercel (MCP)

1. Ajuste Node para 20.x no projeto Vercel.
2. Dispare deploy de producao.
3. Aguarde status READY e registre o URL do deploy.

## Passo 4 - Commit e push (GitHub MCP)

1. git add .
2. git commit -m "fix: restore admin auth bootstrap and enforce main-only flow"
3. git push origin main

## Passo 5 - Validacoes finais

1. Verifique se so existe main no remoto.
2. Atualize IMPLANTAR/dossie-agente-executor-receitasbell.md marcando o checklist final.
3. Informe status final (admin ok, deploy READY, main only).

## Observacoes

- Se precisar rodar testes, prefira Node 20.x.
- Lint anterior teve apenas 1 warning em vite.config.ts (prefer-const). Nao e bloqueante.
