#!/bin/bash

# Antigravity MCP Deploy Script
# Faz deploy do servidor MCP na Vercel

set -e

echo "🚀 Iniciando deploy do Antigravity MCP..."

# 1. Instala dependências
echo "📦 Instalando dependências..."
npm install

# 2. Verifica variáveis de ambiente
echo "🔐 Verificando variáveis de ambiente..."
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "✅ Arquivo .env criado (ajuste as variáveis)"
  else
    echo "❌ Arquivo .env.example não encontrado"
    exit 1
  fi
fi

# 3. Testa localmente
echo "🧪 Testando servidor localmente..."
timeout 10 npm start &
sleep 2
curl -s http://localhost:3000/health || echo "⚠️ Servidor não respondeu"

# 4. Faz commit
echo "📝 Commitando mudanças..."
git add -A
git commit -m "Deploy: Antigravity MCP Server v1.0.0" || echo "✅ Nada para commitar"

# 5. Faz push
echo "📤 Push para repositório..."
git push origin main

# 6. Deploy na Vercel
echo "🌐 Fazendo deploy na Vercel..."
if command -v vercel &> /dev/null; then
  vercel --prod
else
  echo "⚠️ Vercel CLI não encontrada"
  echo "   Para instalar: npm install -g vercel"
fi

echo "✅ Deploy concluído!"
