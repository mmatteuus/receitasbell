# SSE Listener

## Baserow Sanitize

Script oficial para inventariar e sanear o schema do Baserow sem credenciais hardcoded.

Exemplos:

```bash
# Dry-run: gera relatório com mapa de tabelas, duplicidades e riscos de senha
node scripts/baserow-sanitize.cjs --report docs/operations/baserow-sanitization-report.json

# Apply: cria password_hash (se faltar), migra password -> hash e pode arquivar duplicatas
node scripts/baserow-sanitize.cjs --apply --archive-duplicates
```

Variáveis necessárias:

- `BASEROW_DATABASE_ID`
- `BASEROW_API_TOKEN` (ou `BASEROW_EMAIL` + `BASEROW_PASSWORD`)
- `BASEROW_API_URL` opcional (default `https://api.baserow.io`)

Flags úteis:

- `--allow-weak-password-migration`: permite migrar senhas legadas fracas para hash (não recomendado).
- `--database-id`, `--api-token`, `--email`, `--password`: alternativas para não depender de env no shell.

Uso rápido do script `sse-listener.cjs` para conectar a um endpoint SSE e gravar eventos em JSONL.

Exemplos:

1) Executar diretamente com URL e arquivo de saída:

```bash
node scripts/sse-listener.cjs https://api.baserow.io/mcp/Fsl5g1tHWCLi7qRfQAoF9UPxG2X2OHJK/sse sse-events.jsonl
```

2) Usar variáveis de ambiente (útil para tokens):

```bash
export SSE_URL="https://.../sse"
export SSE_OUT="meus-eventos.jsonl"
export SSE_HEADERS='{"Authorization":"Bearer TOKEN"}'
node scripts/sse-listener.cjs
```

No Windows PowerShell:

```powershell
$env:SSE_URL = "https://.../sse"
$env:SSE_OUT = "meus-eventos.jsonl"
$env:SSE_HEADERS = '{"Authorization":"Bearer TOKEN"}'
node scripts/sse-listener.cjs
```

Formato de saída:

- Cada linha é um objeto JSON com `timestamp`, `event` e `data`.
- Arquivo padrão: `sse-events.jsonl` (no diretório onde o comando é executado).

Observações:

- Se o SSE exigir autenticação, passe o header `Authorization` via `SSE_HEADERS`.
- O script tenta fazer `JSON.parse` do corpo `data` quando possível; caso contrário grava o texto bruto.
- Para rodar no background, use `nohup`/`tmux`/`screen` (Linux/macOS) ou `Start-Process` no PowerShell.

Problemas e logs:

- Mensagens de erro são impressas no console; verifique permissões de escrita no arquivo de saída.
