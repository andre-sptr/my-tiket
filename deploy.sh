#!/bin/bash
# ─────────────────────────────────────────────────────────
# myTiket Deploy Script — VPS Ubuntu
# Domain: tiket.andresptr.site
# Usage: bash deploy.sh [first-run]
# ─────────────────────────────────────────────────────────
set -e

REPO_DIR="/opt/mytiket"
COMPOSE="docker-compose -f docker-compose.prod.yml"

echo "🚀 myTiket Deploy — $(date)"

# ── First run setup ──────────────────────────────────────
if [ "$1" == "first-run" ]; then
    echo "📦 Installing prerequisites..."
    apt-get update -qq
    apt-get install -y docker.io docker-compose certbot python3-certbot-nginx nginx

    echo "🔒 Requesting SSL certificate..."
    systemctl stop nginx || true
    certbot certonly --standalone \
        -d tiket.andresptr.site \
        --email admin@tiket.andresptr.site \
        --agree-tos \
        --non-interactive
    systemctl start nginx || true

    echo "📁 Setting up repo..."
    mkdir -p $REPO_DIR
    cd $REPO_DIR

    echo ""
    echo "✅ First-run setup done!"
    echo "⚠️  Sekarang:"
    echo "   1. Copy .env.example → .env.prod dan isi semua nilai"
    echo "   2. Jalankan: bash deploy.sh"
    exit 0
fi

# ── Normal deploy ─────────────────────────────────────────
cd $REPO_DIR

echo "📥 Pulling latest code..."
git pull origin main

echo "🐳 Building Docker images..."
$COMPOSE build --no-cache

echo "🔄 Restarting services..."
$COMPOSE up -d --remove-orphans

echo "⏳ Waiting for database..."
sleep 5

echo "🗄️  Running database migrations..."
$COMPOSE exec -T backend npx prisma migrate deploy

echo "🧹 Cleaning old images..."
docker image prune -f

echo ""
echo "✅ Deploy complete! $(date)"
echo "🌐 https://tiket.andresptr.site"
echo ""

# Status
$COMPOSE ps
