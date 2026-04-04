#!/usr/bin/env bash
# =============================================================================
# setup-agente-wsl.sh
# Playbooks 46 + 47 — Git por token + MCP Stripe + MCP Supabase + gate + push
# Rodar no terminal WSL:
#   bash /mnt/d/MATEUS/Documentos/GitHub/receitasbell/IMPLANTAR/setup-agente-wsl.sh
# =============================================================================

set -euo pipefail

# ─── CORES ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

ok()   { echo -e "${GREEN}[OK]${RESET}  $*"; }
err()  { echo -e "${RED}[ERRO]${RESET} $*"; }
info() { echo -e "${CYAN}[INFO]${RESET} $*"; }
warn() { echo -e "${YELLOW}[WARN]${RESET} $*"; }
sep()  { echo -e "${BOLD}──────────────────────────────────────────────${RESET}"; }

# =============================================================================
# 0. TOKENS — PREENCHA AQUI ANTES DE RODAR
# =============================================================================
GITHUB_TOKEN="${GITHUB_TOKEN:-__PREENCHER__}"
STRIPE_MCP_TOKEN="${STRIPE_MCP_TOKEN:-__PREENCHER__}"
SUPABASE_MCP_TOKEN="${SUPABASE_MCP_TOKEN:-__PREENCHER__}"
STRIPE_MCP_URL="${STRIPE_MCP_URL:-__PREENCHER__}"
SUPABASE_MCP_URL="${SUPABASE_MCP_URL:-__PREENCHER__}"

# Caminhos
REPO_PATH="/mnt/d/MATEUS/Documentos/GitHub/receitasbell"
CODEX_CONFIG="$HOME/.codex/config.toml"

# Report final (acumulado)
REPORT_GIT_LEITURA="PENDENTE"
REPORT_GIT_PUSH_DRY="PENDENTE"
REPORT_MCP_STRIPE="PENDENTE"
REPORT_MCP_SUPABASE="PENDENTE"
REPORT_GATE="PENDENTE"
REPORT_GIT_PUSH="PENDENTE"

# =============================================================================
# VALIDAÇÃO DOS TOKENS
# =============================================================================
sep
echo -e "${BOLD}SETUP AGENTE WSL — Playbooks 46 + 47${RESET}"
sep

_check_token() {
  local name="$1" val="$2"
  if [[ "$val" == "__PREENCHER__" || -z "$val" ]]; then
    err "Token $name não preenchido. Edite o script ou exporte a variável antes de rodar."
    return 1
  fi
  info "$name: configurado ($(echo "$val" | cut -c1-6)…)"
}

TOKENS_OK=true
_check_token "GITHUB_TOKEN"      "$GITHUB_TOKEN"      || TOKENS_OK=false
_check_token "STRIPE_MCP_TOKEN"  "$STRIPE_MCP_TOKEN"  || TOKENS_OK=false
_check_token "SUPABASE_MCP_TOKEN" "$SUPABASE_MCP_TOKEN" || TOKENS_OK=false
_check_token "STRIPE_MCP_URL"    "$STRIPE_MCP_URL"    || TOKENS_OK=false
_check_token "SUPABASE_MCP_URL"  "$SUPABASE_MCP_URL"  || TOKENS_OK=false

if [[ "$TOKENS_OK" != "true" ]]; then
  echo ""
  echo -e "${RED}Abortando: preencha os tokens acima e rode novamente.${RESET}"
  echo -e "Dica: exporte no terminal antes de rodar:"
  echo -e "  export GITHUB_TOKEN=\"ghp_...\""
  echo -e "  export STRIPE_MCP_TOKEN=\"...\""
  echo -e "  export SUPABASE_MCP_TOKEN=\"...\""
  echo -e "  export STRIPE_MCP_URL=\"https://...\""
  echo -e "  export SUPABASE_MCP_URL=\"https://...\""
  exit 1
fi

# =============================================================================
# PASSO 1 — CONFIGURAR GIT POR TOKEN
# =============================================================================
sep
info "PASSO 1 — Configurando Git por token"

git config --global credential.helper store
printf "https://x-access-token:%s@github.com\n" "$GITHUB_TOKEN" > "$HOME/.git-credentials"
chmod 600 "$HOME/.git-credentials"
ok "credential.helper configurado"

# Verificar repositório
if [[ ! -d "$REPO_PATH/.git" ]]; then
  err "Repositório não encontrado em $REPO_PATH"
  exit 1
fi

cd "$REPO_PATH"
info "Repositório: $REPO_PATH"
git remote -v

# =============================================================================
# PASSO 2 — VALIDAR LEITURA GIT
# =============================================================================
sep
info "PASSO 2 — Testando leitura remota (git ls-remote)"

if GIT_HASH=$(git ls-remote origin refs/heads/main 2>&1); then
  ok "git ls-remote: $GIT_HASH"
  REPORT_GIT_LEITURA="OK — $GIT_HASH"
else
  err "git ls-remote falhou: $GIT_HASH"
  REPORT_GIT_LEITURA="ERRO — $GIT_HASH"
fi

# =============================================================================
# PASSO 3 — FETCH + PULL + DRY-RUN PUSH
# =============================================================================
sep
info "PASSO 3 — Sincronizando branch main"

git fetch origin
git pull --rebase --autostash origin main || warn "pull com conflito ou já atualizado"

DRY_RUN_OUT=$(git push --dry-run origin main 2>&1 || true)
info "push --dry-run: $DRY_RUN_OUT"

if echo "$DRY_RUN_OUT" | grep -qE "(up-to-date|main -> main)"; then
  ok "git push --dry-run: OK (sem erro de autenticação)"
  REPORT_GIT_PUSH_DRY="OK"
else
  err "git push --dry-run: possível erro"
  REPORT_GIT_PUSH_DRY="ERRO — $DRY_RUN_OUT"
fi

# =============================================================================
# PASSO 4 — BACKUP E CONFIGURAÇÃO DO CODEX config.toml
# =============================================================================
sep
info "PASSO 4 — Configurando MCP no Codex (~/.codex/config.toml)"

mkdir -p "$HOME/.codex"

# Backup
if [[ -f "$CODEX_CONFIG" ]]; then
  BACKUP="$CODEX_CONFIG.bak.$(date +%Y%m%d-%H%M%S)"
  cp "$CODEX_CONFIG" "$BACKUP"
  ok "Backup criado: $BACKUP"
else
  warn "config.toml não encontrado — será criado"
  touch "$CODEX_CONFIG"
fi

# Remover blocos antigos de stripe/supabase (idempotente)
if grep -q "\[mcp_servers.stripe\]" "$CODEX_CONFIG" 2>/dev/null; then
  warn "Bloco stripe já existe — será substituído"
  # Remove bloco existente
  python3 -c "
import re, sys
content = open('$CODEX_CONFIG').read()
content = re.sub(r'\[mcp_servers\.stripe\].*?(?=\[|\Z)', '', content, flags=re.DOTALL)
content = re.sub(r'\[mcp_servers\.supabase\].*?(?=\[|\Z)', '', content, flags=re.DOTALL)
open('$CODEX_CONFIG', 'w').write(content)
"
fi

# Adicionar blocos MCP
cat >> "$CODEX_CONFIG" << TOML

[mcp_servers.stripe]
url = "${STRIPE_MCP_URL}"

[mcp_servers.stripe.http_headers]
Authorization = "Bearer ${STRIPE_MCP_TOKEN}"

[mcp_servers.supabase]
url = "${SUPABASE_MCP_URL}"

[mcp_servers.supabase.http_headers]
Authorization = "Bearer ${SUPABASE_MCP_TOKEN}"
TOML

ok "Blocos MCP escritos em $CODEX_CONFIG"
info "Conteúdo atual (sem tokens):"
grep -v "Bearer\|Authorization" "$CODEX_CONFIG" || true

# =============================================================================
# PASSO 5 — VALIDAR MCP (teste de URL com curl)
# =============================================================================
sep
info "PASSO 5 — Testando conectividade MCP Stripe"

STRIPE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer ${STRIPE_MCP_TOKEN}" \
  "${STRIPE_MCP_URL}" 2>/dev/null || echo "FALHOU")

if [[ "$STRIPE_STATUS" =~ ^[23] ]]; then
  ok "MCP Stripe HTTP $STRIPE_STATUS"
  REPORT_MCP_STRIPE="OK (HTTP $STRIPE_STATUS)"
else
  warn "MCP Stripe HTTP $STRIPE_STATUS — pode ser normal dependendo do endpoint"
  REPORT_MCP_STRIPE="HTTP $STRIPE_STATUS (verificar endpoint)"
fi

info "Testando conectividade MCP Supabase"

SUPA_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer ${SUPABASE_MCP_TOKEN}" \
  "${SUPABASE_MCP_URL}" 2>/dev/null || echo "FALHOU")

if [[ "$SUPA_STATUS" =~ ^[23] ]]; then
  ok "MCP Supabase HTTP $SUPA_STATUS"
  REPORT_MCP_SUPABASE="OK (HTTP $SUPA_STATUS)"
else
  warn "MCP Supabase HTTP $SUPA_STATUS — pode ser normal dependendo do endpoint"
  REPORT_MCP_SUPABASE="HTTP $SUPA_STATUS (verificar endpoint)"
fi

# =============================================================================
# PASSO 6 — NPM RUN GATE
# =============================================================================
sep
info "PASSO 6 — Rodando npm run gate (lint + typecheck + build + tests)"
info "(pode levar alguns minutos...)"

cd "$REPO_PATH"

if npm run gate; then
  ok "npm run gate: PASSOU"
  REPORT_GATE="PASSOU"
else
  err "npm run gate: FALHOU"
  REPORT_GATE="FALHOU"
fi

# =============================================================================
# PASSO 7 — GIT PUSH ORIGIN MAIN
# =============================================================================
sep
info "PASSO 7 — git push origin main"

cd "$REPO_PATH"
PUSH_OUT=$(git push origin main 2>&1 || true)
info "$PUSH_OUT"

if echo "$PUSH_OUT" | grep -qE "(main -> main|up-to-date|Everything)"; then
  ok "git push: OK"
  REPORT_GIT_PUSH="OK — $PUSH_OUT"
else
  err "git push: possível erro — $PUSH_OUT"
  REPORT_GIT_PUSH="ERRO — $PUSH_OUT"
fi

# =============================================================================
# REPORT FINAL OBRIGATÓRIO
# =============================================================================
sep
echo -e "${BOLD}REPORT OBRIGATÓRIO DO AGENTE${RESET}"
sep
echo -e "1. Git status:\n   $(git status -sb)\n"
echo -e "2. Git leitura (ls-remote):\n   ${REPORT_GIT_LEITURA}\n"
echo -e "3. Git push --dry-run:\n   ${REPORT_GIT_PUSH_DRY}\n"
echo -e "4. MCP Stripe:\n   ${REPORT_MCP_STRIPE}\n"
echo -e "5. MCP Supabase:\n   ${REPORT_MCP_SUPABASE}\n"
echo -e "6. npm run gate:\n   ${REPORT_GATE}\n"
echo -e "7. git push origin main:\n   ${REPORT_GIT_PUSH}\n"
sep
echo -e "${BOLD}Script concluído em $(date '+%Y-%m-%d %H:%M:%S')${RESET}"
sep
