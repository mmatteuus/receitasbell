# Credenciais Padrão - Receitas Bell

**ATENÇÃO**: Este arquivo contém credenciais TEMPORÁRIAS.
Após setup inicial, TROCAR todas as senhas.

---

## 🔐 Admin Principal

**Email**: `admin@receitasbell.com.br`
**Senha Padrão**: `Receitasbell.com`

**Quando usar**:
- Auditoria financeira
- Configuração de tenant
- Gestão de usuários

**Próxima ação após login**:
1. Ir em `Configurações` → `Segurança`
2. Trocar senha para algo forte (min 16 chars)
3. Habilitar 2FA se disponível

---

## 🗑️ Limpeza de Usuários Admin Extras

Se houver outros admins não autorizados:

```sql
-- Listar todos os admins
SELECT email, role, created_at 
FROM profiles 
WHERE role = 'admin' 
ORDER BY created_at;

-- Deletar admin NÃO AUTORIZADO (exemplo)
DELETE FROM auth.users 
WHERE email = 'admin_nao_autorizado@example.com';
```

**REGRA**: Apenas `admin@receitasbell.com.br` deve ter role `admin` global.
Tenants individuais têm seus próprios admins em `tenant_members`.

---

## 🔒 Política de Segurança

1. **Nunca** commitar este arquivo com senhas reais
2. Após setup, senhas devem estar APENAS em:
   - Password manager do time
   - Vercel env vars (secrets)
   - Supabase vault (encrypted)
3. Rotação de senhas: a cada 90 dias
4. Auditoria de acessos: verificar `audit_logs` mensalmente

---

**Desenvolvido por**: MtsFerreira - [mtsferreira.dev](https://mtsferreira.dev)
