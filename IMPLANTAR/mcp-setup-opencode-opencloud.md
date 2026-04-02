# MCP Setup - OpenCode + Open Cloud (Anti Gravity)

## Prompt curto (agente)

```text
Configure MCP via Open Cloud no Anti Gravity seguindo IMPLANTAR/mcp-setup-opencode-opencloud.md. Use a pasta local .vscode/ e o arquivo .vscode/mcp-secrets.env para as chaves. Conecte Supabase e GitHub com permissoes de edicao, deploy, modificacao e analise; se faltar chave, use o navegador para obter e preencha no Anti Gravity e no arquivo local.
```

## Objetivo

Padronizar a conexao MCP para Supabase, GitHub e, se necessario, Vercel.

## Local de secrets (OpenCode)

- Pasta local: `.vscode/`
- Arquivo local: `.vscode/mcp-secrets.env`
- Nao versionar esse arquivo.
- Formato: `CHAVE=VALOR` (uma por linha).

Exemplo minimo:

```env
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=SEU_SERVICE_ROLE_KEY
GITHUB_TOKEN=SEU_GITHUB_TOKEN
```

## Open Cloud (Anti Gravity) - Conectores MCP

### Supabase

- Credenciais: `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.
- Acesso exigido: leitura e escrita em `auth.users` e `public.profiles`.
- Validacao: listar `admin@receitasbell.com` e garantir update em `public.profiles`.

### GitHub

- Credencial: token com leitura e escrita no repo.
- Permissoes recomendadas (minimo efetivo):
  - Conteudo do repo: read/write
  - Deployments: read/write
  - Actions/Workflows: read/write
  - Checks/Statuses: read
- Validacao: `git fetch`, `git status`, `git commit`, `git push`.

### Vercel (se deploy for exigido)

- Credencial: token com acesso ao projeto.
- Permissoes: deploy em producao e leitura de status.
- Validacao: iniciar deploy e aguardar status `READY`.

## Passos rapidos

1. Se faltar acesso, use o navegador para obter as chaves no painel do provedor.
2. Salve as chaves no Open Cloud (Anti Gravity).
3. Repita as chaves em `.vscode/mcp-secrets.env` no repo local.
4. Rode a conexao MCP e valide as permisssoes acima.

## Checklist de validacao

- [ ] `.vscode/mcp-secrets.env` existe localmente e nao esta no git.
- [ ] Supabase: leitura e escrita em `auth.users` e `public.profiles` funcionam.
- [ ] GitHub: `git fetch`, `git status`, `git commit`, `git push` funcionam com o token.
- [ ] GitHub: status/checks e deployments podem ser lidos/alterados.
- [ ] Vercel (se exigido): deploy iniciado e status `READY` confirmado.
- [ ] Open Cloud (Anti Gravity): conectores MCP ativos e autenticados.

## Regras de seguranca

- Nunca comitar `mcp-secrets.env`.
- Nunca colar chaves em chat ou logs.
- Se houver bloqueio, registrar o que faltou e interromper a execucao.
