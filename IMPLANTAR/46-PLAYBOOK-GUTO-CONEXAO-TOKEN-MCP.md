# Playbook Guto - Conexao por Token (GitHub + MCP Stripe + MCP Supabase)

## Objetivo
Habilitar um agente IA para operar tudo que for pedido no projeto:
1. autenticar GitHub para `pull/push`;
2. configurar MCP por token para Stripe e Supabase;
3. validar conectividade de ponta a ponta.

## Regras de seguranca
1. Nunca escrever token em arquivo versionado.
2. Nunca imprimir token completo no terminal.
3. Salvar token apenas em variavel de ambiente e/ou `~/.codex/config.toml` local.
4. Fazer backup de `~/.codex/config.toml` antes de editar.

## Pre-requisitos
1. Repositorio local: `/mnt/d/MATEUS/Documentos/GitHub/receitasbell`
2. Codex home: `/home/mts/.codex`
3. Arquivo de config: `/home/mts/.codex/config.toml`
4. Node instalado (para `npx mcp-remote` se necessario)

## Tokens necessarios (fornecidos pelo dono do ambiente)
1. `GITHUB_TOKEN` com permissao de repo (push/pull).
2. `STRIPE_MCP_TOKEN` (ou credencial equivalente do servidor MCP Stripe).
3. `SUPABASE_MCP_TOKEN` (ou service token do servidor MCP Supabase).
4. `STRIPE_MCP_URL` endpoint MCP Stripe.
5. `SUPABASE_MCP_URL` endpoint MCP Supabase.

## Passo 1 - Exportar tokens na sessao (sem logar valor)
Executar:

```bash
export GITHUB_TOKEN="__PREENCHER__"
export STRIPE_MCP_TOKEN="__PREENCHER__"
export SUPABASE_MCP_TOKEN="__PREENCHER__"
export STRIPE_MCP_URL="__PREENCHER__"
export SUPABASE_MCP_URL="__PREENCHER__"
```

## Passo 2 - Configurar GitHub por token (modo pratico)
Executar:

```bash
cd /mnt/d/MATEUS/Documentos/GitHub/receitasbell
git config --global credential.helper store
printf "https://x-access-token:${GITHUB_TOKEN}@github.com\n" > ~/.git-credentials
chmod 600 ~/.git-credentials
git remote -v
git ls-remote origin -h
```

Se `git ls-remote` responder hash/refs, autenticacao GitHub ficou OK.

## Passo 3 - Backup do config do Codex
Executar:

```bash
cp /home/mts/.codex/config.toml /home/mts/.codex/config.toml.bak.$(date +%Y%m%d-%H%M%S)
```

## Passo 4 - Adicionar servidores MCP Stripe e Supabase no config
Abrir `/home/mts/.codex/config.toml` e adicionar blocos abaixo (ajustando URLs/tokens):

```toml
[mcp_servers.stripe]
url = "${STRIPE_MCP_URL}"

[mcp_servers.stripe.http_headers]
Authorization = "Bearer ${STRIPE_MCP_TOKEN}"

[mcp_servers.supabase]
url = "${SUPABASE_MCP_URL}"

[mcp_servers.supabase.http_headers]
Authorization = "Bearer ${SUPABASE_MCP_TOKEN}"
```

Notas:
1. Se o endpoint MCP exigir `command/args` em vez de `url`, usar `npx mcp-remote`.
2. Se usar `mcp-remote`, exemplo:

```toml
[mcp_servers.supabase]
command = "/mnt/c/Program Files/nodejs/node.exe"
args = ['C:\Program Files\nodejs\node_modules\npm\bin\npx-cli.js', "-y", "mcp-remote", "${SUPABASE_MCP_URL}"]
```

## Passo 5 - Reiniciar sessao do Codex
1. Encerrar a sessao atual do agente.
2. Reabrir sessao para recarregar MCPs do `config.toml`.

## Passo 6 - Teste de conectividade MCP
Checklist do agente:
1. Confirmar que MCP Stripe aparece disponivel para consulta.
2. Confirmar que MCP Supabase aparece disponivel para consulta.
3. Rodar uma leitura simples em cada um (ex.: listar recurso/health/check).

## Passo 7 - Validar fluxo Git completo
Executar:

```bash
cd /mnt/d/MATEUS/Documentos/GitHub/receitasbell
git fetch origin
git pull --rebase --autostash origin main
npm run gate
git push origin main
```

## Resultado esperado
1. Git autenticado por token.
2. MCP Stripe conectado.
3. MCP Supabase conectado.
4. `gate` passando.
5. `push` funcionando.

## Report obrigatorio do agente
No final, o agente deve retornar:
1. status Git (`git status -sb`);
2. resultado de autenticacao (`git ls-remote origin -h`);
3. status MCP Stripe (conectado/erro);
4. status MCP Supabase (conectado/erro);
5. resultado de `npm run gate`;
6. resultado do `git push`.
