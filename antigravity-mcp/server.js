import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import simpleGit from 'simple-git';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const REPO_PATH = process.env.REPO_PATH || '../';
const git = simpleGit(REPO_PATH);

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Logger
const log = (msg, type = 'INFO') => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type}] ${msg}`);
};

// ============================================
// TASK MONITOR - Verifica tarefas pendentes
// ============================================
async function checkPendingTasks() {
  try {
    const tasksFile = join(REPO_PATH, 'IMPLANTAR', 'TAREFAS_PENDENTES.md');
    const content = readFileSync(tasksFile, 'utf-8');

    const tasksInExecution = content.match(/\[EM EXECUÇÃO - ([^\]]+)\]/g);

    if (!tasksInExecution) {
      return { count: 0, tasks: [] };
    }

    const tasks = tasksInExecution.map(task => ({
      raw: task,
      agent: task.match(/\[EM EXECUÇÃO - ([^\]]+)\]/)[1]
    }));

    log(`Found ${tasks.length} tasks in execution`, 'MONITOR');
    return { count: tasks.length, tasks };
  } catch (error) {
    log(`Error checking tasks: ${error.message}`, 'ERROR');
    return { count: 0, tasks: [], error: error.message };
  }
}

// ============================================
// EXECUTOR - Executa tarefas
// ============================================
async function executeTask(taskName) {
  try {
    log(`Starting execution of: ${taskName}`, 'EXECUTOR');

    // Registra como em execução
    const tasksFile = join(REPO_PATH, 'IMPLANTAR', 'TAREFAS_PENDENTES.md');
    let content = readFileSync(tasksFile, 'utf-8');

    // Marca como em execução se não estiver
    if (!content.includes(`[EM EXECUÇÃO - Claude Code]`)) {
      content = content.replace(
        `[EM EXECUÇÃO - ${taskName}]`,
        `[EM EXECUÇÃO - Claude Code]`
      );
      writeFileSync(tasksFile, content);
    }

    // Executa npm run gate
    log('Running npm run gate...', 'EXECUTOR');
    try {
      execSync('npm run gate', {
        cwd: REPO_PATH,
        stdio: 'inherit'
      });
      log('Gate passed successfully', 'EXECUTOR');
    } catch (error) {
      log(`Gate failed: ${error.message}`, 'ERROR');
      return { success: false, error: 'Gate validation failed' };
    }

    // Faz commit
    log('Creating commit...', 'EXECUTOR');
    await git.add('-A');
    await git.commit(`Auto: Executando tarefa ${taskName}`);

    // Faz push
    log('Pushing to remote...', 'EXECUTOR');
    await git.push('origin', 'main');

    // Registra conclusão
    const outboxFile = join(REPO_PATH, 'IMPLANTAR', 'CAIXA-DE-SAIDA.md');
    let outboxContent = readFileSync(outboxFile, 'utf-8');
    const timestamp = new Date().toISOString();
    outboxContent += `\n\n**MSG-OUT-AUTO-${timestamp}**\n> ✅ Tarefa executada: ${taskName}\n`;
    writeFileSync(outboxFile, outboxContent);

    log(`Task completed: ${taskName}`, 'EXECUTOR');
    return { success: true, task: taskName, timestamp };
  } catch (error) {
    log(`Error executing task: ${error.message}`, 'ERROR');
    return { success: false, error: error.message };
  }
}

// ============================================
// HEARTBEAT - Atualiza status
// ============================================
async function updateHeartbeat() {
  try {
    const heartbeatFile = join(REPO_PATH, 'IMPLANTAR', 'HEARTBEAT.json');
    const heartbeat = {
      last_actor: 'Antigravity MCP',
      last_seen_at: new Date().toISOString(),
      current_trigger: 'mcp-server',
      current_step_id: null,
      status: 'MONITORING'
    };

    writeFileSync(heartbeatFile, JSON.stringify(heartbeat, null, 2));
    log('Heartbeat updated', 'HEARTBEAT');
  } catch (error) {
    log(`Error updating heartbeat: ${error.message}`, 'ERROR');
  }
}

// ============================================
// ROUTES
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/status', async (req, res) => {
  try {
    const tasks = await checkPendingTasks();
    res.json({
      status: 'monitoring',
      tasks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/execute-task', async (req, res) => {
  try {
    const { taskName } = req.body;

    if (!taskName) {
      return res.status(400).json({ error: 'taskName required' });
    }

    const result = await executeTask(taskName);
    await updateHeartbeat();

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/monitor', async (req, res) => {
  try {
    log('Monitor endpoint called', 'MONITOR');

    const tasks = await checkPendingTasks();

    if (tasks.count > 0) {
      const results = [];
      for (const task of tasks.tasks) {
        const result = await executeTask(task.agent);
        results.push(result);
      }

      await updateHeartbeat();

      res.json({
        status: 'executed',
        tasksFound: tasks.count,
        results,
        timestamp: new Date().toISOString()
      });
    } else {
      await updateHeartbeat();

      res.json({
        status: 'no-tasks',
        tasksFound: 0,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/history', (req, res) => {
  try {
    const outboxFile = join(REPO_PATH, 'IMPLANTAR', 'CAIXA-DE-SAIDA.md');
    const content = readFileSync(outboxFile, 'utf-8');

    res.json({
      entries: content.split('---').length - 1,
      preview: content.slice(-500),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// SERVER START
// ============================================

app.listen(PORT, () => {
  log(`Antigravity MCP Server started on port ${PORT}`, 'START');
  log(`Environment: ${process.env.NODE_ENV || 'development'}`, 'START');
  log(`Repository: ${REPO_PATH}`, 'START');

  // Atualiza heartbeat na inicialização
  updateHeartbeat().then(() => {
    log('Initial heartbeat sent', 'START');
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  log('Server shutting down...', 'SHUTDOWN');
  process.exit(0);
});
