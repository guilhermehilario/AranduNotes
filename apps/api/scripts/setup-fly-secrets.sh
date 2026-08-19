#!/bin/bash

# ══════════════════════════════════════════════════════════════
# Configurar secrets do Fly.io para o Arandu API
# ══════════════════════════════════════════════════════════════
#
# Uso:
#   ./scripts/setup-fly-secrets.sh
#
# Precisa estar logado no Fly.io (fly auth login)
# ══════════════════════════════════════════════════════════════

set -e

echo "🔧 Configurando secrets do Fly.io para arandu-api..."
echo ""

# Verifica se flyctl esta instalado
if ! command -v flyctl &> /dev/null && ! command -v fly &> /dev/null; then
  echo "❌ flyctl nao encontrado. Instale: https://fly.io/docs/hands-on/install-flyctl/"
  exit 1
fi

FLY="flyctl"
if ! command -v flyctl &> /dev/null; then
  FLY="fly"
fi

# Verifica autenticacao
if ! $FLY auth whoami &> /dev/null; then
  echo "❌ Nao autenticado no Fly.io. Execute: fly auth login"
  exit 1
fi

echo "✅ Autenticado no Fly.io"
echo ""

# Pede os valores (ou usa os do .env se existir)
ENV_FILE="$(dirname "$0")/../.env"

if [ -f "$ENV_FILE" ]; then
  echo "📝 Lendo valores do .env..."
  source <(grep -E '^(DATABASE_URL|JWT_SECRET|REFRESH_SECRET|SUPABASE_URL|SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY|FRONTEND_URL)=' "$ENV_FILE" | sed 's/^/export /')
fi

# Gera JWT_SECRET e REFRESH_SECRET aleatorios se nao definidos
if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "dev-jwt-secret" ]; then
  JWT_SECRET=$(openssl rand -base64 48)
  echo "🔑 JWT_SECRET gerado automaticamente"
fi

if [ -z "$REFRESH_SECRET" ] || [ "$REFRESH_SECRET" = "dev-refresh-secret" ]; then
  REFRESH_SECRET=$(openssl rand -base64 48)
  echo "🔑 REFRESH_SECRET gerado automaticamente"
fi

# FRONTEND_URL para producao
if [ -z "$FRONTEND_URL" ] || [ "$FRONTEND_URL" = "http://localhost:5173" ]; then
  FRONTEND_URL="https://arandunotes.onrender.com"
  echo "🌐 FRONTEND_URL definido como: $FRONTEND_URL"
fi

# Verifica variaveis obrigatorias
missing=()
[ -z "$DATABASE_URL" ] && missing+=("DATABASE_URL")
[ -z "$SUPABASE_URL" ] && missing+=("SUPABASE_URL")
[ -z "$SUPABASE_ANON_KEY" ] && missing+=("SUPABASE_ANON_KEY")
[ -z "$SUPABASE_SERVICE_ROLE_KEY" ] && missing+=("SUPABASE_SERVICE_ROLE_KEY")

if [ ${#missing[@]} -gt 0 ]; then
  echo ""
  echo "❌ Variaveis faltando:"
  for v in "${missing[@]}"; do
    echo "   - $v"
  done
  echo ""
  echo "Defina-as no arquivo .env ou como variaveis de ambiente."
  exit 1
fi

echo ""
echo "📋 Secrets que serao configurados:"
echo "   DATABASE_URL            = ${DATABASE_URL:0:40}..."
echo "   JWT_SECRET              = ${JWT_SECRET:0:10}..."
echo "   REFRESH_SECRET          = ${REFRESH_SECRET:0:10}..."
echo "   FRONTEND_URL            = $FRONTEND_URL"
echo "   SUPABASE_URL            = $SUPABASE_URL"
echo "   SUPABASE_ANON_KEY       = ${SUPABASE_ANON_KEY:0:30}..."
echo "   SUPABASE_SERVICE_ROLE   = ${SUPABASE_SERVICE_ROLE_KEY:0:30}..."
echo ""

read -p "Confirmar? (y/N) " confirm
if [[ $confirm != [yY] ]]; then
  echo "Cancelado."
  exit 0
fi

echo ""
echo "🔐 Enviando secrets para Fly.io..."

$FLY secrets set \
  DATABASE_URL="$DATABASE_URL" \
  JWT_SECRET="$JWT_SECRET" \
  REFRESH_SECRET="$REFRESH_SECRET" \
  FRONTEND_URL="$FRONTEND_URL" \
  SUPABASE_URL="$SUPABASE_URL" \
  SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  --app arandu-api

echo ""
echo "✅ Secrets configurados com sucesso!"
echo ""
echo "Proximo passo: faca push para a branch main para deploy automatico."
echo "  git push origin main"
