# ✈️ myTiket

> Web app pemantau harga tiket pesawat — Duffel API + LCC Scraper + Web Push Notification

**Live:** https://tiket.andresptr.site

> **Stack tanpa Docker.** Frontend, backend, Postgres, dan Redis semua jalan native untuk hemat RAM di VPS terbatas.

---

## 🚀 Quick Start (Local Dev)

### Prerequisites
- Node.js 20+
- PostgreSQL 14+ (install lokal atau pakai service)
- Redis 6+ (install lokal atau pakai service)
- PM2 (untuk production): `npm install -g pm2`
- Duffel API token (opsional di dev — daftar gratis di https://duffel.com)

### 1. Setup environment
```bash
cp backend/.env.example backend/.env
# Edit backend/.env: isi DUFFEL_ACCESS_TOKEN (opsional), DATABASE_URL, REDIS_URL
```

### 2. Pastikan Postgres + Redis jalan
```bash
# Buat DB lokal
psql -U postgres -c "CREATE USER mytiket WITH PASSWORD 'mytiket_dev_password';"
psql -U postgres -c "CREATE DATABASE mytiket OWNER mytiket;"

# Pastikan redis aktif
redis-cli ping   # → PONG
```

### 3. Generate VAPID keys
```bash
cd backend
npm install
npm run vapid:generate
# Copy output ke .env
```

### 4. Setup & run backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev   # buat tabel
npx playwright install chromium  # untuk scraper LCC (opsional di dev)
npm run dev
# Backend: http://localhost:4000
```

### 5. Setup & run frontend
```bash
cd frontend
npm install
npm run dev
# Frontend: http://localhost:3000
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DUFFEL_ACCESS_TOKEN` | ⚪ | Dari [duffel.com](https://duffel.com) → Dashboard → Developer → Access tokens. Format: `duffel_test_xxx` (sandbox gratis) atau `duffel_live_xxx` |
| `DATABASE_URL` | ✅ | PostgreSQL: `postgresql://user:pass@localhost:5432/mytiket` |
| `REDIS_URL` | ✅ | Redis: `redis://localhost:6379` |
| `VAPID_PUBLIC_KEY` | ✅ | Generate: `npm run vapid:generate` |
| `VAPID_PRIVATE_KEY` | ✅ | Generate: `npm run vapid:generate` |
| `VAPID_EMAIL` | ✅ | Email untuk VAPID |
| `CHECK_INTERVAL_MIN` | ⚪ | Interval scraper (default 120 menit) |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` | ⚪ | Path chromium (default `/usr/bin/chromium-browser`) |

---

## 🗂️ Project Structure

```
myTiket/
├── frontend/                     # Next.js 14 (TypeScript, Tailwind, shadcn/ui)
├── backend/                      # Fastify API + BullMQ Workers + Playwright Scrapers
├── nginx/
│   └── nginx.aapanel.conf        # Vhost untuk aaPanel / nginx native
├── ecosystem.config.js           # PM2 config (frontend + backend)
├── deploy.sh                     # Deploy script (full native, no Docker)
└── .env.example
```

---

## 🛩️ Data Sources

| Maskapai | Sumber | Kode |
|----------|--------|------|
| Garuda Indonesia | Duffel API | GA |
| Batik Air | Duffel API | ID |
| Singapore Airlines | Duffel API | SQ |
| Malaysia Airlines | Duffel API | MH |
| AirAsia (GDS) | Duffel API | QZ |
| **Lion Air** | Web Scraper | JT |
| **Citilink** | Web Scraper | QG |
| **AirAsia Indonesia** | Web Scraper | QZ |
| **Super Air Jet** | Web Scraper | IU |

---

## 🔔 Alert System

1. User cari tiket → klik **"Set Alert"**
2. Input harga target (IDR)
3. Browser minta izin notifikasi
4. Backend cek harga **setiap 2 jam** via BullMQ (bisa diubah via `CHECK_INTERVAL_MIN`)
5. Saat harga ≤ target → **Web Push Notification** dikirim ke browser
6. Notifikasi muncul meski tab ditutup

---

## 🚀 Deploy ke VPS Ubuntu (full native, no Docker)

### Target VPS yang didukung
- Ubuntu 20.04 / 22.04 / 24.04
- Minimal **2 GB RAM** (rekomendasi tambah 2 GB swap — `deploy.sh first-run` setup otomatis)
- 2 CPU cores
- Nginx sudah dikelola control panel (aaPanel) atau install manual

### First time setup
```bash
# Di VPS Ubuntu (sebagai root)
git clone https://github.com/andresptr/mytiket.git /opt/mytiket
cd /opt/mytiket
bash deploy.sh first-run
# Install: Node.js 20, PM2, PostgreSQL 16, Redis, Chromium, 2GB swap, create DB

# Ganti password DB production
sudo -u postgres psql -c "ALTER USER mytiket WITH PASSWORD 'GANTI_PASSWORD_KUAT';"

# Isi env
cp backend/.env.example backend/.env.prod
nano backend/.env.prod   # update DATABASE_URL password sesuai di atas

# Setup nginx vhost lewat aaPanel:
#   1. Add Site: tiket.andresptr.site
#   2. Buka Config → paste isi nginx/nginx.aapanel.conf
#   3. SSL → Let's Encrypt → apply

# Deploy
bash deploy.sh
```

### Update / redeploy
```bash
cd /opt/mytiket
bash deploy.sh
# Akan: git pull → npm ci → build → prisma migrate → pm2 reload
```

---

## 📊 Resource Budget (VPS 2 GB RAM)

| Service | Max RAM | Catatan |
|---------|---------|---------|
| Frontend (Next.js) | 350 MB | PM2 fork mode, single instance |
| Backend (Fastify + Worker) | 450 MB | Termasuk spike Playwright saat scraping |
| PostgreSQL | ~150 MB | Default config |
| Redis | ~30 MB | AOF on, dataset kecil |
| Nginx | ~20 MB | Shared dengan site lain |
| **Total peak** | **~1 GB** | Sisanya buffer + control panel |

> ⚠️ **Monitor:** `pm2 monit` dan `free -h`. Kalau OOM, naikkan `CHECK_INTERVAL_MIN` jadi 180+ atau matikan scraper LCC.

---

## 🛠️ PM2 Cheatsheet

```bash
pm2 list                       # daftar proses
pm2 logs                       # semua logs
pm2 logs mytiket-backend       # logs backend saja
pm2 reload all                 # zero-downtime reload
pm2 restart mytiket-frontend   # restart (singkat downtime)
pm2 monit                      # CPU & memory monitor real-time
pm2 save                       # simpan list proses → auto-start saat reboot
```

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, TanStack Query, Recharts — PM2
- **Backend:** Fastify, TypeScript, Prisma, BullMQ, Playwright — PM2
- **Database:** PostgreSQL 16 — native (apt)
- **Cache:** Redis 7 — native (apt)
- **Scraping:** Playwright + Chromium native (`/usr/bin/chromium-browser`)
- **Notifications:** Web Push API (VAPID)
- **Web server:** Nginx (managed by aaPanel) + Let's Encrypt
