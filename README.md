# ✈️ myTiket

> Web app pemantau harga tiket pesawat — Amadeus API + LCC Scraper + Web Push Notification

**Live:** https://tiket.andresptr.site

---

## 🚀 Quick Start (Local Dev)

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Amadeus API key (daftar gratis di https://developers.amadeus.com)

### 1. Setup environment
```bash
cp .env.example .env
# Edit .env: isi AMADEUS_CLIENT_ID, AMADEUS_CLIENT_SECRET
```

### 2. Generate VAPID keys
```bash
cd backend
npm install
npm run vapid:generate
# Copy output ke .env
```

### 3. Start database & Redis
```bash
docker-compose up -d
```

### 4. Setup & run backend
```bash
cd backend
npm install
npx playwright install chromium  # untuk scraper LCC
npm run db:migrate                # buat tabel
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
| `AMADEUS_CLIENT_ID` | ✅ | Dari Amadeus Developer Portal |
| `AMADEUS_CLIENT_SECRET` | ✅ | Dari Amadeus Developer Portal |
| `AMADEUS_HOSTNAME` | ✅ | `test` atau `production` |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `REDIS_URL` | ✅ | Redis connection string |
| `VAPID_PUBLIC_KEY` | ✅ | Generate: `npm run vapid:generate` |
| `VAPID_PRIVATE_KEY` | ✅ | Generate: `npm run vapid:generate` |
| `VAPID_EMAIL` | ✅ | Email untuk VAPID |

---

## 🗂️ Project Structure

```
myTiket/
├── frontend/        # Next.js 14 (TypeScript, Tailwind, shadcn/ui)
├── backend/         # Fastify API + BullMQ Workers + Playwright Scrapers
├── nginx/           # Nginx config (tiket.andresptr.site)
├── docker-compose.yml         # Local dev
├── docker-compose.prod.yml    # Production (VPS)
├── deploy.sh                  # Deploy script
└── .env.example
```

---

## 🛩️ Data Sources

| Maskapai | Sumber | Kode |
|----------|--------|------|
| Garuda Indonesia | Amadeus GDS | GA |
| Batik Air | Amadeus GDS | ID |
| Singapore Airlines | Amadeus GDS | SQ |
| Malaysia Airlines | Amadeus GDS | MH |
| AirAsia (GDS) | Amadeus GDS | QZ |
| **Lion Air** | Web Scraper | JT |
| **Citilink** | Web Scraper | QG |
| **AirAsia Indonesia** | Web Scraper | QZ |
| **Super Air Jet** | Web Scraper | IU |

---

## 🔔 Alert System

1. User cari tiket → klik **"Set Alert"**
2. Input harga target (IDR)
3. Browser minta izin notifikasi
4. Backend cek harga **setiap 30 menit** via BullMQ
5. Saat harga ≤ target → **Web Push Notification** dikirim ke browser
6. Notifikasi muncul meski tab ditutup

---

## 🚀 Deploy ke VPS

### First time setup
```bash
# Di VPS Ubuntu
git clone https://github.com/andresptr/mytiket.git /opt/mytiket
cd /opt/mytiket
bash deploy.sh first-run

# Isi env
cp .env.example .env.prod
nano .env.prod

# Deploy
bash deploy.sh
```

### Update
```bash
cd /opt/mytiket
bash deploy.sh
```

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, TanStack Query, Recharts
- **Backend:** Fastify, TypeScript, Prisma, BullMQ, Playwright
- **Database:** PostgreSQL 16
- **Cache:** Redis 7
- **Scraping:** Playwright + playwright-extra-plugin-stealth
- **Notifications:** Web Push API (VAPID)
- **Infra:** Docker Compose + Nginx + Let's Encrypt
