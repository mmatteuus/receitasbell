# Antigravity MCP - Servidor de Orquestração Automática

## 🎯 O que é?

O **Antigravity MCP** é um servidor MCP (Model Context Protocol) que transforma Claude Code de um agente passivo em um **orquestrador ativo** do projeto Receitas Bell.

### Antes (Manual)
```
OpenCode → Detém → Antigravity → Revisa → Deploy Manual
```

### Depois (Automático)
```
Claude Code (via MCP) → Detecta Tarefas → Executa → Valida → Commit → Push
Tudo automático! 🚀
```

---

## 🏗️ Como Funciona

### 1. **Task Monitor** (A cada 5-10 minutos)
- Verifica `IMPLANTAR/TAREFAS_PENDENTES.md`
- Procura por `[EM EXECUÇÃO - ...]`
- Executa automaticamente

### 2. **Executor**
- Lê tarefa completa
- Executa ação (código, configuração, etc)
- Roda `npm run gate` para validar
- Se passou → commit + push

### 3. **Notifications**
- Registra resultado em `CAIXA-DE-SAIDA.md`
- Atualiza `HEARTBEAT.json`
- Log de auditorias

---

## 🚀 Começar Localmente

### 1. Instalar dependências
```bash
cd antigravity-mcp
npm install
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env
# Edite .env com suas credenciais
```

### 3. Iniciar servidor
```bash
npm start
# Ou com auto-reload em desenvolvimento:
npm run dev
```

### 4. Testar endpoints
```bash
# Health check
curl http://localhost:3000/health

# Ver status de tarefas
curl http://localhost:3000/status

# Forçar monitoramento agora
curl -X POST http://localhost:3000/monitor

# Ver histórico de execuções
curl http://localhost:3000/history
```

---

## 🌐 Deploy na Vercel

### 1. Pré-requisitos
```bash
npm install -g vercel
vercel login
```

### 2. Deploy
```bash
bash deploy.sh
```

Ou manualmente:
```bash
vercel --prod
```

### 3. Configurar variáveis na Vercel
```
GITHUB_TOKEN = seu_token_github
GITHUB_REPO = mmatteuus/receitasbell
NODE_ENV = production
```

---

## 📊 Endpoints Disponíveis

### `GET /health`
Status geral do servidor

**Resposta**:
```json
{
  "status": "ok",
  "timestamp": "2026-04-06T21:04:41.667Z",
  "version": "1.0.0"
}
```

### `GET /status`
Lista tarefas em execução

**Resposta**:
```json
{
  "status": "monitoring",
  "tasks": {
    "count": 3,
    "tasks": [...]
  },
  "timestamp": "2026-04-06T21:04:41.667Z"
}
```

### `POST /execute-task`
Executa uma tarefa específica

**Body**:
```json
{
  "taskName": "Auditoria de Webhooks Stripe"
}
```

### `POST /monitor`
Força verificação de tarefas agora

**Resposta**:
```json
{
  "status": "executed",
  "tasksFound": 2,
  "results": [...]
}
```

### `GET /history`
Histórico de execuções

---

## 🔄 Fluxo de Execução Automático

```
Trigger remoto (a cada 5-10 min)
    ↓
Chama POST /monitor
    ↓
Task Monitor verifica TAREFAS_PENDENTES.md
    ↓
Se [EM EXECUÇÃO - ...] encontrado:
    ├─ Executa ação
    ├─ Roda npm run gate
    ├─ Faz git add + commit
    ├─ Faz git push origin main
    └─ Registra em CAIXA-DE-SAIDA.md
    ↓
Atualiza HEARTBEAT.json com status
```

---

## 📝 Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `PORT` | Porta do servidor | 3000 |
| `NODE_ENV` | Ambiente | development |
| `REPO_PATH` | Caminho do repositório | ../ |
| `GITHUB_TOKEN` | Token de acesso GitHub | - |
| `GITHUB_REPO` | Repositório GitHub | mmatteuus/receitasbell |
| `ENABLE_AUTO_EXECUTION` | Ativar execução automática | true |
| `MONITOR_INTERVAL` | Intervalo de monitoramento (ms) | 300000 |

---

## 🧪 Testes

### Testar localmente
```bash
npm start

# Em outro terminal:
curl -X POST http://localhost:3000/monitor
```

### Ver logs
```bash
NODE_ENV=development npm run dev
```

---

## 🔐 Segurança

- ✅ Valida todas as tarefas com `npm run gate`
- ✅ Usa tokens GitHub com permissões mínimas
- ✅ Commits assinados (quando possível)
- ✅ Sem credenciais no código (use .env)

---

## 📦 Estrutura de Arquivos

```
antigravity-mcp/
├── server.js                 # Servidor Express
├── package.json              # Dependências
├── .env                       # Configuração (local)
├── .env.example              # Template
├── deploy.sh                 # Script de deploy
├── CLAUDE_CODE_CONTEXT.md    # Documentação
└── README.md                 # Este arquivo
```

---

## 🚀 Próximos Passos

1. ✅ Estrutura criada
2. ✅ Dependências instaladas
3. ✅ Testado localmente
4. ⏳ Fazer deploy na Vercel
5. ⏳ Configurar triggers remotos
6. ⏳ Ativar monitoramento

---

## 📞 Suporte

Para problemas:
1. Verifique logs locais: `npm run dev`
2. Teste endpoints com `curl`
3. Valide variáveis `.env`
4. Verifique GitHub token

---

**Versão**: 1.0.0  
**Status**: Pronto para Deploy  
**Última Atualização**: 2026-04-06
