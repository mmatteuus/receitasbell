# Configuração de Ferramentas - Receitas Bell

**REGRA GLOBAL:** Priorizar MCP sobre web search.

---

## 🔧 ORDEM DE PRIORIDADE DE FERRAMENTAS

### 1. **MCP Tools (SEMPRE PRIMEIRO)**

Antes de usar qualquer outra ferramenta, **SEMPRE verificar se existe MCP tool adequado**.

#### MCPs Disponíveis:

**GitHub MCP:**
- Ler arquivos do repositório
- Criar/atualizar/deletar arquivos
- Fazer commits e PRs
- Ver histórico
- **Usar para:** TODO relacionado ao código do projeto

**Vercel MCP:**
- Ver deploys
- Ver logs de build
- Ver ambiente de produção
- **Usar para:** Validar deploys, ver logs, verificar ambiente

**Baserow MCP:**
- Acessar banco de dados (Baserow)
- **Usar para:** Validar dados, ver tabelas, RLS policies

**Stripe MCP:**
- Acessar Stripe Connect
- Ver transações
- **Usar para:** Validar integração de pagamento

**Supabase MCP:**
- Acessar banco Supabase
- Ver policies
- Executar queries
- **Usar para:** Validar RLS, ver schema, queries

### 2. **Ferramentas Locais (Bash, View, etc)**

**Usar quando:**
- Executar comandos no projeto
- Ler arquivos locais
- Rodar testes
- Fazer builds

### 3. **Web Search (SOMENTE EM ÚLTIMO CASO)**

**Usar APENAS quando:**
- Informação não está no repositório
- Informação não está nos MCPs
- Documentação externa necessária (OWASP, RFC, etc)
- Verificar breaking changes de APIs externas

**NUNCA usar web search para:**
- Ler código do projeto → Usar GitHub MCP
- Ver logs → Usar Vercel MCP
- Consultar banco → Usar Supabase MCP ou Baserow MCP
- Documentação que já está no repo → Usar GitHub MCP

---

## 📝 CHECKLIST ANTES DE USAR WEB SEARCH

Antes de fazer web search, responder:

- [ ] Já tentei GitHub MCP?
- [ ] Já tentei Vercel MCP?
- [ ] Já tentei Supabase/Baserow MCP?
- [ ] Já tentei Stripe MCP?
- [ ] A informação realmente NÃO está no repositório?
- [ ] A informação realmente NÃO está nos MCPs?

**Se respondeu SIM para todas, OK para web search.**

---

## 🎯 EXEMPLOS PRÁTICOS

### Exemplo 1: "Validar RLS no Supabase"

**❌ ERRADO:**
```
web_search("supabase row level security")
```

**✅ CORRETO:**
```
1. Usar Supabase MCP para conectar ao banco
2. Executar query: SELECT tablename, rowsecurity FROM pg_tables
3. Ver policies: SELECT * FROM pg_policies
```

### Exemplo 2: "Ver logs do último deploy"

**❌ ERRADO:**
```
web_search("vercel deployment logs")
```

**✅ CORRETO:**
```
1. Usar Vercel MCP
2. Listar deploys recentes
3. Pegar logs do deployment específico
```

### Exemplo 3: "Ler arquivo de configuração"

**❌ ERRADO:**
```
web_search("vercel.json configuration")
```

**✅ CORRETO:**
```
1. Usar GitHub MCP
2. get_file_contents(path="vercel.json")
```

### Exemplo 4: "Consultar documentação OWASP"

**✅ CORRETO (web search justificado):**
```
# Neste caso, web search é apropriado porque:
# - Não está no repositório
# - Não está nos MCPs
# - É documentação externa oficial

web_search("OWASP API Security Top 10 2023")
```

---

## 🚨 REGRAS OBRIGATÓRIAS

### REGRA 1: MCP First
**Sempre tentar MCP antes de web search.**

### REGRA 2: Justificar Web Search
**Se usar web search, DEVE explicar por que MCP não funcionou.**

Exemplo:
```markdown
# Usando web search porque:
# - Não está no GitHub MCP (verificado)
# - Não está no Vercel MCP (verificado)
# - Documentação externa OWASP necessária
web_search("OWASP API Security")
```

### REGRA 3: Web Search Só Para Externo
**Web search APENAS para:**
- Documentação oficial externa (OWASP, RFC, MDN, etc)
- Breaking changes de APIs de terceiros
- Notícias recentes de segurança

**NUNCA para:**
- Código do projeto
- Logs
- Dados do banco
- Configurações

---

## 🛠️ MAPEAMENTO DE TAREFAS → MCPs

| Tarefa | MCP Correto | Nunca Web Search |
|--------|-------------|------------------|
| Ler código | GitHub MCP | ✅ |
| Ver deploys | Vercel MCP | ✅ |
| Consultar banco | Supabase/Baserow MCP | ✅ |
| Ver transações | Stripe MCP | ✅ |
| Criar arquivo | GitHub MCP | ✅ |
| Ver logs build | Vercel MCP | ✅ |
| Validar RLS | Supabase MCP | ✅ |
| OWASP docs | Web Search | ❌ |
| RFC specs | Web Search | ❌ |

---

## 📊 AUDITORIA DE USO

Ao final de cada tarefa, agente DEVE reportar:

```markdown
## Ferramentas Usadas

- GitHub MCP: 5 calls
- Vercel MCP: 2 calls
- Supabase MCP: 3 calls
- Web Search: 0 calls ✅ (nenhum web search usado!)

Total: 10 tool calls, 0 web searches
```

Se usou web search:

```markdown
## Ferramentas Usadas

- GitHub MCP: 5 calls
- Web Search: 1 call

**Justificativa do web search:**
- Query: "OWASP API Security Top 10 2023"
- Motivo: Documentação externa oficial não disponível via MCP
- Tentou MCP primeiro? Sim (GitHub MCP não tem OWASP docs)
```

---

## ✅ EXEMPLO DE FLUXO CORRETO

### Tarefa: P0-1 - Validar RLS no Supabase

**Passo 1:** Tentar MCP
```typescript
// Usar Supabase MCP
const tables = await supabase_mcp.query(
  "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'"
);
```

**Passo 2:** Se MCP não funcionar, documentar
```markdown
# Supabase MCP falhou com erro: [ERRO]
# Tentando abordagem alternativa...
```

**Passo 3:** Só ENTÃO considerar web search (se necessário)
```markdown
# Web search necessário porque:
# - Supabase MCP não tem acesso à documentação de RLS
# - Preciso consultar best practices oficiais do Supabase
web_search("supabase row level security best practices")
```

---

## 📝 RESUMO EXECUTIVO

### ✅ FAÇA:
- Usar GitHub MCP para TODO relacionado ao código
- Usar Vercel MCP para deploys e logs
- Usar Supabase/Baserow MCP para banco
- Usar Stripe MCP para pagamentos
- Justificar web search quando usado

### ❌ NÃO FAÇA:
- Web search para ler código do projeto
- Web search para ver logs
- Web search para consultar banco
- Web search sem tentar MCP primeiro
- Web search sem justificar

---

**Desenvolvido por MtsFerreira** | [mtsferreira.dev](https://mtsferreira.dev)
