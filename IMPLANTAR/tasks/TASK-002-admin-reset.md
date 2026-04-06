# TASK-002: Resetar Senha Admin

**ID:** TASK-002  
**Prioridade:** P0 (Crítico)  
**Status:** 🟡 PRONTO PARA EXECUÇÃO  
**Agente:** OpenCode ou Antigravity (SQL)  
**Criado em:** 2026-04-06  

---

## 🎯 OBJETIVO

Resetar senha do usuário `admin@receitasbell.com` para `Receitasbell.com`.

---

## 📋 PRÉ-REQUISITOS

- [x] Acesso ao Supabase SQL Editor
- [x] Tabela `users` existe
- [x] Usuário `admin@receitasbell.com` existe no banco

---

## 🔧 PASSOS EXATOS

### Opção A: Via Supabase SQL Editor (Antigravity)

1. Acessar: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new`
2. Executar SQL:

```sql
-- Resetar senha para 'Receitasbell.com'
UPDATE auth.users
SET 
  encrypted_password = crypt('Receitasbell.com', gen_salt('bf')),
  updated_at = NOW()
WHERE email = 'admin@receitasbell.com';

-- Verificar
SELECT id, email, updated_at
FROM auth.users
WHERE email = 'admin@receitasbell.com';
```

3. Confirmar output: 1 row updated

### Opção B: Via Script Node.js (OpenCode)

**Arquivo:** `scripts/reset-admin-password.mjs`

```javascript
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data, error } = await supabase.auth.admin.updateUserById(
  'USER_ID_AQUI', // buscar via SELECT id FROM auth.users WHERE email = 'admin@receitasbell.com'
  { password: 'Receitasbell.com' }
);

if (error) {
  console.error('❌ Erro:', error);
  process.exit(1);
}

console.log('✅ Senha resetada:', data);
```

**Executar:**

```bash
node scripts/reset-admin-password.mjs
```

---

## ✅ CRITÉRIOS DE ACEITE

- [ ] SQL executado sem erro
- [ ] Output confirma 1 row updated
- [ ] Login funcional em `https://receitasbell.mtsferreira.dev/admin`
- [ ] Dashboard admin carrega

---

## 🧪 COMO VALIDAR

### Teste Manual

1. Acessar: `https://receitasbell.mtsferreira.dev/admin`
2. Fazer login:
   - **Email:** `admin@receitasbell.com`
   - **Senha:** `Receitasbell.com`
3. Verificar:
   - Login bem-sucedido
   - Redirecionamento para dashboard
   - Sem erros 401/403

---

## ⚠️ RISCOS

- **Nenhum:** Reset de senha é operação reversível
- **Rollback:** Se necessário, resetar novamente

---

## 🚨 SE FALHAR

1. Verificar se usuário existe:
   ```sql
   SELECT * FROM auth.users WHERE email = 'admin@receitasbell.com';
   ```
2. Se não existir, criar:
   ```sql
   -- Criar usuário admin manualmente
   -- (requer conhecimento do schema auth.users)
   ```
3. Documentar erro em `IMPLANTAR/03-BLOQUEIOS.md`

---

## 📝 AO CONCLUIR

1. Testar login (critério de aceite)
2. Marcar `[X]` em `IMPLANTAR/01-TAREFAS-ATIVAS.md`
3. Mover para `IMPLANTAR/02-HISTORICO.md`
4. Atualizar `IMPLANTAR/03-BLOQUEIOS.md` (remover BLOQ-002)
5. Comitar mudanças (se criou script):
   ```bash
   git add scripts/reset-admin-password.mjs
   git commit -m "chore: add admin password reset script"
   git push
   ```

---

**Desenvolvido por MtsFerreira** — [mtsferreira.dev](https://mtsferreira.dev)