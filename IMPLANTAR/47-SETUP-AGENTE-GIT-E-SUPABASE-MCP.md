# Setup do Agente - Git e Supabase MCP

## Objetivo
Configurar para o agente:
1. autenticacao GitHub por token (pull/push);
2. conexao MCP do Supabase por token;
3. validacao final de conectividade.

## Dados que o agente precisa receber
1. `GITHUB_TOKEN` com permissao de `repo`.
2. `SUPABASE_MCP_URL` (endpoint MCP do Supabase).
3. `SUPABASE_MCP_TOKEN` (token/bearer do MCP Supabase).

## Passo 1 - Configurar Git por token
Executar:

```bash
cd /mnt/d/MATEUS/Documentos/GitHub/receitasbell
git config --global credential.helper store
printf "https://x-access-token:${GITHUB_TOKEN}@github.com\n" > ~/.git-credentials
chmod 600 ~/.git-credentials
git remote -v
git ls-remote origin refs/heads/main
```

Se `git ls-remote` retornar hash, leitura Git OK.

## Passo 2 - Habilitar escrita (push) no Git
Executar:

```bash
cd /mnt/d/MATEUS/Documentos/GitHub/receitasbell
git fetch origin
git pull --rebase --autostash origin main
git push --dry-run origin main
```

Se `git push --dry-run` nao pedir usuario/senha e nao falhar em auth, push OK.

## Passo 3 - Configurar MCP Supabase no Codex
Fazer backup:

```bash
cp /home/mts/.codex/config.toml /home/mts/.codex/config.toml.bak.$(date +%Y%m%d-%H%M%S)
```

Adicionar no final de `/home/mts/.codex/config.toml`:

```toml
[mcp_servers.supabase]
url = "${SUPABASE_MCP_URL}"

[mcp_servers.supabase.http_headers]
Authorization = "Bearer ${SUPABASE_MCP_TOKEN}"
```

Se esse MCP exigir `command/args` em vez de `url`, usar `npx mcp-remote` com a URL recebida.

## Passo 4 - Recarregar sessao do Codex
1. Encerrar sessao atual.
2. Reabrir sessao para carregar o novo servidor MCP.

## Passo 5 - Validar MCP Supabase
Checklist do agente:
1. confirmar que o servidor Supabase aparece entre servidores MCP carregados;
2. executar uma chamada simples de leitura/health/listagem;
3. registrar se conectou ou qual erro retornou.

## Passo 6 - Validacao final obrigatoria
Executar:

```bash
cd /mnt/d/MATEUS/Documentos/GitHub/receitasbell
git status -sb
git ls-remote origin refs/heads/main
git push --dry-run origin main
```

## Formato do relatorio final do agente
1. `Git leitura`: OK/ERRO.
2. `Git push dry-run`: OK/ERRO.
3. `MCP Supabase`: OK/ERRO.
4. Erros encontrados e comando que falhou (se houver).
