# Guia de Sincronizacao Git para Agente

## Objetivo
Permitir que um agente IA consiga:
1. autenticar no GitHub neste ambiente;
2. sincronizar a branch local com `origin/main` sem perder trabalho;
3. fazer push com seguranca.

## Pre-condicoes
1. Repositorio local: `/mnt/d/MATEUS/Documentos/GitHub/receitasbell`
2. Remote esperado: `origin = https://github.com/mmatteuus/receitasbell.git`
3. Branch de trabalho: `main`
4. Nao executar comandos destrutivos (`git reset --hard`, `git checkout -- .`)

## Passo 1 - Validar estado atual
Executar:

```bash
cd /mnt/d/MATEUS/Documentos/GitHub/receitasbell
git remote -v
git status -sb
git branch --show-current
```

Confirmar:
1. branch atual e `main`;
2. existe `origin`;
3. status de ahead/behind esta visivel.

## Passo 2 - Configurar autenticacao GitHub
Escolher uma opcao.

### Opcao A (recomendada): GitHub CLI
Executar:

```bash
gh auth login
gh auth status
```

Durante o login:
1. escolher `GitHub.com`;
2. escolher `HTTPS`;
3. confirmar uso do helper de credenciais.

### Opcao B: HTTPS com PAT
Executar:

```bash
git config --global credential.helper manager-core
```

No proximo `git push`, informar:
1. usuario GitHub;
2. token PAT com escopo de repo (no lugar de senha).

### Opcao C: SSH
Executar:

```bash
ssh-keygen -t ed25519 -C "agent-sync"
cat ~/.ssh/id_ed25519.pub
```

Depois:
1. adicionar chave publica no GitHub Account -> SSH keys;
2. trocar remote para SSH:

```bash
git remote set-url origin git@github.com:mmatteuus/receitasbell.git
ssh -T git@github.com
```

## Passo 3 - Sincronizar com remoto sem perder trabalho
Como este repositorio pode ter muitas alteracoes locais, seguir exatamente:

```bash
cd /mnt/d/MATEUS/Documentos/GitHub/receitasbell
git fetch origin
git pull --rebase --autostash origin main
```

Se houver conflito:
1. resolver apenas os conflitos;
2. executar `git add <arquivos resolvidos>`;
3. executar `git rebase --continue`;
4. repetir ate terminar.

## Passo 4 - Validar antes do push
Executar:

```bash
npm run gate
git status -sb
```

Somente prosseguir se `npm run gate` estiver OK.

## Passo 5 - Push
Executar:

```bash
git push origin main
```

Se falhar por autenticacao, voltar ao Passo 2.
Se falhar por non-fast-forward, repetir Passo 3 e tentar novamente.

## Passo 6 - Confirmacao final
Executar:

```bash
git status -sb
```

Esperado:
1. branch `main`;
2. sem erro de auth;
3. sem divergencia bloqueando push (`ahead/behind` resolvido conforme objetivo do agente).

## Regras operacionais para o agente
1. Nao modificar arquivos fora do escopo da sincronizacao.
2. Nao apagar alteracoes locais do usuario.
3. Nao usar comandos destrutivos.
4. Reportar claramente:
   - resultado de autenticacao;
   - resultado de `pull --rebase`;
   - resultado do `push`.
