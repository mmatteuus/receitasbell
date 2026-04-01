# Scripts

## `set-admin-password.mjs`

Atualiza a senha de um usuario administrador diretamente no Supabase.

Variaveis necessarias:

- `ADMIN_USER_ID`
- `ADMIN_NEW_PASSWORD`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Exemplo:

```bash
ADMIN_USER_ID="<user-id>" \
ADMIN_NEW_PASSWORD="<new-password>" \
SUPABASE_URL="https://<project>.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>" \
node scripts/set-admin-password.mjs
```

Observacoes:

- a senha passa por validacao minima antes de ser gravada;
- o script grava `password_hash` na tabela `users`.
