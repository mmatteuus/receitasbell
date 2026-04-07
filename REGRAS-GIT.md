# 📋 Regras de Git para Receitasbell

## ⚠️ REGRA PRINCIPAL: ÚNICA BRANCH PERMITIDA

### 1. **Estrutura de Branches**

- ✅ **Apenas `main` é permitida**
- ❌ **Nenhuma feature branch, develop, staging, ou qualquer outra**
- ❌ **Nenhuma branch pessoal ou experimental**

### 2. **Fluxo de Trabalho**

```
1. Faça alterações DIRETAMENTE na main
2. Commit e teste localmente
3. Push para origin/main
4. Deploy direto para produção
```

### 3. **O Que Fazer Com Feature Branches**

Se uma feature branch for criada acidentalmente:

1. **Mergear tudo para main:**
   ```bash
   git checkout main
   git merge feature/nome-da-branch
   git push origin main
   ```

2. **Deletar a branch:**
   ```bash
   git branch -D feature/nome-da-branch
   git push origin --delete feature/nome-da-branch
   ```

3. **Verificar que nenhuma branch extra existe:**
   ```bash
   git branch -a
   # Deve mostrar apenas:
   # * main
   # remotes/origin/main
   ```

### 4. **Verificação Periódica**

Execute regularmente para manter repositório limpo:

```bash
# Listar todas as branches
git branch -a

# Deletar branches remotas antigas (não usadas)
git remote prune origin

# Deletar branches locais não usadas
git branch -vv | grep 'gone]' | awk '{print $1}' | xargs git branch -D
```

### 5. **Histórico de Cleanup**

**Data:** 2026-04-07  
**Branches Deletadas:**
- `feature/task-004-stripe-realign` (merged para main)
- Branches antigas remotas podem ser limpas conforme necessário

---

## 📌 Resumo das Convenções

| O Que | Regra | Exemplo |
|------|-------|---------|
| **Branches** | Apenas `main` | ❌ develop, ❌ staging |
| **Commits** | Descritivos, em português | ✅ feat: Implementar PWA |
| **Push** | Sempre para main | `git push origin main` |
| **Merge** | Direto, sem PRs | Merge local → Push |
| **Cleanup** | Remover branches extra | Após merge |

---

**Mantido por:** Equipe de Desenvolvimento  
**Última atualização:** 2026-04-07
