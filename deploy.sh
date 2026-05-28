#!/bin/bash
# ─────────────────────────────────────────────────────────
# myTiket Deploy Script — VPS Ubuntu (full native, NO Docker)
# Domain: tiket.andresptr.site
# Stack:
#   - Frontend Next.js  → PM2 (Node.js)
#   - Backend Fastify   → PM2 (Node.js + Playwright/Chromium)
#   - PostgreSQL 16     → apt
#   - Redis 7           → apt
#   - Nginx + SSL       → diasumsikan sudah dikelola control panel (aaPanel)
# Usage: bash deploy.sh [first-run]
# ─────────────────────────────────────────────────────────
set -e

REPO_DIR="/opt/mytiket"
PM2_HOME="${PM2_HOME:-$HOME/.pm2}"

log() { echo -e "\n\033[1;32m▶ $*\033[0m"; }
warn() { echo -e "\n\033[1;33m⚠ $*\033[0m"; }
ok() { echo -e "\033[0;32m✓ $*\033[0m"; }

echo "🚀 myTiket Deploy — $(date)"

# ────────────────────────────────────────────────────────────
# First run setup — install semua prerequisites
# ────────────────────────────────────────────────────────────
if [ "$1" == "first-run" ]; then
    log "Installing system packages..."
    apt-get update -qq
    apt-get install -y curl ca-certificates gnupg lsb-release build-essential

    log "Installing Node.js 20.x..."
    if ! command -v node > /dev/null || [ "$(node -v | cut -c2-3)" -lt "20" ]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    fi
    ok "Node: $(node -v)"

    log "Installing PM2 globally..."
    npm install -g pm2

    log "Installing PostgreSQL 16..."
    if ! command -v psql > /dev/null; then
        install -d /usr/share/postgresql-common/pgdg
        curl -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc \
            --fail https://www.postgresql.org/media/keys/ACCC4CF8.asc
        echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" \
            > /etc/apt/sources.list.d/pgdg.list
        apt-get update -qq
        apt-get install -y postgresql-16
    fi
    systemctl enable --now postgresql
    ok "PostgreSQL: $(psql --version)"

    log "Installing Redis..."
    apt-get install -y redis-server
    # Enable AOF + bind localhost only
    sed -i 's/^# *appendonly no/appendonly yes/' /etc/redis/redis.conf || true
    sed -i 's/^appendonly no/appendonly yes/' /etc/redis/redis.conf || true
    sed -i 's/^bind .*/bind 127.0.0.1/' /etc/redis/redis.conf || true
    systemctl enable --now redis-server
    systemctl restart redis-server
    ok "Redis: $(redis-cli --version)"

    log "Installing Chromium for Playwright scraper..."
    apt-get install -y chromium-browser fonts-liberation libnss3 libxss1 libasound2 || \
    apt-get install -y chromium fonts-liberation libnss3 libxss1 libasound2 || true

    log "Setting up database (mytiket user + db)..."
    sudo -u postgres psql <<'SQL'
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'mytiket') THEN
        CREATE USER mytiket WITH PASSWORD 'mytiket_dev_password';
    END IF;
END
$$;
CREATE DATABASE mytiket OWNER mytiket;
GRANT ALL PRIVILEGES ON DATABASE mytiket TO mytiket;
SQL

    log "Setting up swap (2GB) — krusial untuk VPS 2GB RAM..."
    if [ ! -f /swapfile ]; then
        fallocate -l 2G /swapfile
        chmod 600 /swapfile
        mkswap /swapfile
        swapon /swapfile
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
        ok "2GB swap aktif"
    else
        ok "Swap sudah ada"
    fi

    mkdir -p $REPO_DIR

    echo ""
    ok "First-run setup done!"
    warn "Langkah selanjutnya:"
    echo "   1. Edit /etc/postgresql/16/main/pg_hba.conf jika butuh remote access"
    echo "   2. Ganti password DB:"
    echo "      sudo -u postgres psql -c \"ALTER USER mytiket WITH PASSWORD 'PASSWORD_BARU';\""
    echo "   3. Copy .env.example → .env.prod dan isi semua nilai"
    echo "   4. Tambahkan vhost di aaPanel pakai nginx/nginx.aapanel.conf"
    echo "   5. Jalankan: bash deploy.sh"
    exit 0
fi

# ────────────────────────────────────────────────────────────
# Normal deploy
# ────────────────────────────────────────────────────────────
cd $REPO_DIR

log "Pulling latest code..."
git pull origin main

# ── Frontend ─────────────────────────────────────────────
log "Building frontend..."
cd frontend
npm ci
npm run build
cd ..

# ── Backend ──────────────────────────────────────────────
log "Building backend..."
cd backend
npm ci
npx prisma generate
npm run build

log "Running Prisma migrations..."
npx prisma migrate deploy
cd ..

# ── PM2 ──────────────────────────────────────────────────
log "Preparing PM2 logs dir..."
mkdir -p logs

log "Reloading services via PM2..."
if pm2 describe mytiket-frontend > /dev/null 2>&1; then
    pm2 reload ecosystem.config.js --update-env
else
    pm2 start ecosystem.config.js
    pm2 save
    # Setup auto-start on boot (idempotent)
    pm2 startup systemd -u "$(whoami)" --hp "$HOME" | tail -1 | bash || true
fi

ok "Deploy complete! $(date)"
echo "🌐 https://tiket.andresptr.site"
echo ""
echo "── PM2 status ──"
pm2 list
echo ""
echo "── Memory check ──"
free -h
