# Antigravity MCP - Servidor de Orquestração Automática

## 🎯 Visão Geral

O **Antigravity MCP** é um servidor MCP (Model Context Protocol) que transforma Claude Code de um agente passivo em um **orquestrador ativo** do projeto Receitas Bell.

**Objetivo Principal**: Claude Code monitora tarefas e executa automaticamente sem depender de Antigravity.

---

## 🏗️ Arquitetura

```
antigravity-mcp/
├── server.js                 # Servidor MCP principal (Node.js)
├── package.json              # Dependências
├── .env.example              # Configuração de exemplo
├── deploy.sh                 # Script de deploy Vercel
├── CLAUDE_CODE_CONTEXT.md    # Este arquivo
└── handlers/
    ├── task-monitor.js       # Monitora TAREFAS_PENDENTES.md
    ├── executor.js           # Executa tarefas
    ├── github.js             # Integração GitHub
    └── notifications.js      # Notificações
```

---

## 🔧 Como Funciona

### 1. **Task Monitor** (5 min)
```
TAREFAS_PENDENTES.md → Detecta [EM EXECUÇÃO - ...] → Executa
```

### 2. **Executor**
```
Lê tarefa → Executa ação → Valida com npm run gate → Faz commit
```

### 3. **GitHub Integration**
```
Sincroniza com repositório → Faz push → Abre PRs se necessário
```

### 4. **Notifications**
```
Registra em CAIXA-DE-SAIDA.md → Atualiza HEARTBEAT.json
```

---

## 📦 Dependências

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.4.0",
    "simple-git": "^3.19.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

---

## 🚀 Endpoints MCP

### GET `/status`
Status do sistema e tasks pendentes

### POST `/execute-task`
Executa uma tarefa específica

### POST `/monitor`
Inicia monitoramento contínuo

### GET `/history`
Histórico de execuções

---

## 🌐 Deploy Vercel

O servidor roda como serverless function:
- URL: `https://antigravity-mcp.vercel.app`
- Triggers remotos chamam os endpoints
- Variáveis de ambiente via `.env.production.local`

---

## 🔐 Variáveis de Ambiente

```
GITHUB_TOKEN=seu_token
GITHUB_REPO=mmatteuus/receitasbell
PORT=3000
NODE_ENV=production
```

---

## 📊 Fluxo de Execução

```
1. Trigger remoto dispara (a cada 5-10 min)
   ↓
2. Task Monitor verifica TAREFAS_PENDENTES.md
   ↓
3. Se houver [EM EXECUÇÃO - ...]:
   - Identifica a tarefa
   - Executa ação correspondente
   - Valida com npm run gate
   ↓
4. Faz commit + push
   ↓
5. Registra em CAIXA-DE-SAIDA.md
   ↓
6. Atualiza HEARTBEAT.json
```

---

## ✅ Próximos Passos

1. ✅ Criar estrutura de arquivos
2. ✅ Instalar dependências (`npm install`)
3. ✅ Configurar `.env`
4. ✅ Testar localmente (`npm start`)
5. ✅ Fazer deploy Vercel (`npm run deploy`)
6. ✅ Configurar triggers remotos

---

**Versão**: 1.0.0  
**Status**: Em Desenvolvimento  
**Última Atualização**: 2026-04-06
