# myTiket — Comprehensive Project Plan (v2)
> Web app pemantau harga tiket pesawat via Amadeus API + LCC Scraper + Web Push Notification

**Created:** 2026-05-11 | **Updated:** 2026-05-11 (v2)
**Status:** Planning → Ready to Build

---

## 🎯 Goal
Membangun web app full-stack yang memungkinkan user:
1. Mencari tiket pesawat dari berbagai sumber (Amadeus full-service + LCC scraper)
2. Memantau tiket **spesifik** (maskapai tertentu, rute tertentu, tanggal tertentu)
3. Set threshold harga IDR → dapat Web Push Notification saat harga menyentuh target

---

## 📌 Confirmed Constraints
- **Currency:** IDR only
- **Auth:** Tidak ada login — anonymous, state disimpan di localStorage + backend (push subscription)
- **Deploy:** VPS Ubuntu — domain: `tiket.andresptr.site`, 2GB RAM
- **Routing:** `tiket.andresptr.site` → frontend | `tiket.andresptr.site/api/*` → backend
- **Data source:** Amadeus API (full-service) + Web Scraping (LCC)

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   VPS Ubuntu                                │
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│  │  Nginx   │    │ Frontend │    │ Backend  │             │
│  │ (proxy + │───►│ Next.js  │    │ Fastify  │             │
│  │  SSL)    │    │ :3000    │◄──►│ :4000    │             │
│  └──────────┘    └──────────┘    └────┬─────┘             │
│                                       │                    │
│              ┌────────────────────────┤                    │
│              │            │           │                    │
│    ┌─────────▼──┐  ┌──────▼───┐  ┌───▼──────┐           │
│    │ PostgreSQL │  │  Redis   │  │ Scraper  │           │
│    │ :5432      │  │  :6379   │  │ Workers  │           │
│    └────────────┘  └──────────┘  └──────────┘           │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴────────────────┐
              │                                │
    ┌─────────▼──────────┐      ┌──────────────▼──────────┐
    │   Amadeus API      │      │     LCC Websites         │
    │   (full-service)   │      │  lionair.co.id           │
    │   Garuda, Batik,   │      │  citilink.co.id          │
    │   SQ, MH, QZ...   │      │  airasia.com             │
    └────────────────────┘      │  superairjet.com         │
                                └─────────────────────────┘
```

---

## 🛩️ Data Source Strategy

### Source 1: Amadeus API (Full-Service Airlines)
| Tersedia | Tidak Tersedia |
|----------|----------------|
| Garuda Indonesia (GA) | Lion Air via GDS |
| Batik Air (ID) | Citilink via GDS |
| Singapore Airlines (SQ) | Super Air Jet via GDS |
| Malaysia Airlines (MH) | TransNusa via GDS |
| Qatar Airways (QR) | |
| AirAsia (mungkin sebagian via GDS) | |
| Semua maskapai GDS member | |

### Source 2: Web Scraper (LCC — via Playwright)
| Maskapai | Target URL | Priority |
|----------|-----------|----------|
| Lion Air | `lionair.co.id` | P1 |
| Citilink | `citilink.co.id` | P1 |
| AirAsia Indonesia | `airasia.com` | P2 |
| Super Air Jet | `superairjet.com` | P2 |
| Batik Air (backup) | `batikair.com` | P3 |

### Source Routing Logic
```
User search → determine airlines requested
├── Full-service airlines → AmadeusService
├── LCC airlines → ScraperService (per airline)
└── "All airlines" → Amadeus + all scrapers (parallel)

Merge results → normalize to unified FlightOffer model → display
```

---

## 🔑 Amadeus Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `POST /v1/security/oauth2/token` | OAuth2 token |
| `GET /v2/shopping/flight-offers` | Real-time flight search |
| `POST /v1/shopping/flight-offers/pricing` | Confirm price (alert checker) |
| `GET /v1/shopping/flight-destinations` | Inspirasi destinasi |
| `GET /v1/shopping/flight-dates` | Tanggal termurah per rute |
| `GET /v1/reference-data/locations` | Airport autocomplete |
| `GET /v1/reference-data/airlines` | Airline name lookup |

---

## 📦 Tech Stack Final

### Frontend
- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS + shadcn/ui**
- **TanStack Query** (data fetching + server state)
- **Recharts** (price history chart)
- **Web Push API** (browser notification)
- **localStorage** (simpan alert IDs untuk tampilan My Alerts)

### Backend
- **Node.js + Fastify** + **TypeScript**
- **Prisma ORM** (PostgreSQL)
- **BullMQ** (job queue — price checker scheduler)
- **Playwright** (LCC scraping, headless Chromium)
- **web-push** npm (VAPID push notifications)

### Infrastructure (VPS Ubuntu)
- **Docker Compose** — orchestrate semua services
- **Nginx** — reverse proxy + SSL termination
- **Certbot / Let's Encrypt** — SSL certificate
- **PostgreSQL 16** (Docker container)
- **Redis 7** (Docker container)
- **PM2** (process manager, di luar Docker atau via Docker)

---

## 📁 Final Project Structure

```
myTiket/
├── frontend/                        # Next.js 14
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # Landing/Home
│   │   ├── search/
│   │   │   └── page.tsx             # Search results + set alert
│   │   └── alerts/
│   │       └── page.tsx             # My alerts (anonymous)
│   ├── components/
│   │   ├── ui/                      # shadcn components
│   │   ├── SearchForm.tsx           # Form: airline/rute/tanggal/harga
│   │   ├── FlightCard.tsx           # Card per penerbangan
│   │   ├── SourceBadge.tsx          # "Amadeus" | "Lion Air" badge
│   │   ├── PriceChart.tsx           # Line chart harga historis
│   │   ├── AlertModal.tsx           # Set threshold + enable push
│   │   └── AlertList.tsx            # Daftar alert aktif
│   ├── lib/
│   │   ├── api.ts                   # API client (fetch wrapper)
│   │   ├── push.ts                  # Web Push subscription helper
│   │   └── localStorage.ts         # Alert IDs persistence
│   ├── public/
│   │   └── sw.js                    # Service Worker (push handler)
│   └── package.json
│
├── backend/                         # Fastify API + Workers
│   ├── src/
│   │   ├── index.ts                 # Entry point
│   │   ├── plugins/
│   │   │   ├── redis.ts
│   │   │   └── prisma.ts
│   │   ├── routes/
│   │   │   ├── flights.ts           # /api/flights/*
│   │   │   ├── alerts.ts            # /api/alerts/*
│   │   │   └── push.ts              # /api/push/*
│   │   ├── services/
│   │   │   ├── amadeus.ts           # Amadeus API wrapper
│   │   │   ├── scraper/
│   │   │   │   ├── index.ts         # ScraperService (orchestrator)
│   │   │   │   ├── lionair.ts       # Lion Air scraper
│   │   │   │   ├── citilink.ts      # Citilink scraper
│   │   │   │   ├── airasia.ts       # AirAsia scraper
│   │   │   │   └── superairjet.ts   # Super Air Jet scraper
│   │   │   ├── search.ts            # Unified search (Amadeus + scraper)
│   │   │   ├── priceChecker.ts      # Alert engine logic
│   │   │   └── webpush.ts           # VAPID push sender
│   │   ├── workers/
│   │   │   └── alertWorker.ts       # BullMQ worker (price polling)
│   │   └── db/
│   │       └── schema.prisma
│   └── package.json
│
├── nginx/
│   ├── nginx.conf                   # Nginx config
│   └── ssl/                         # (managed by Certbot)
│
├── docker-compose.yml               # Local dev
├── docker-compose.prod.yml          # Production
├── .env.example
├── BRAINSTORMING.md
└── README.md
```

---

## 🗄️ Database Schema (Updated)

```sql
-- Unified Flight Source Enum
CREATE TYPE flight_source AS ENUM ('AMADEUS', 'LIONAIR', 'CITILINK', 'AIRASIA', 'SUPERAIRJET');

-- Price Records (history per source)
CREATE TABLE price_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source        flight_source NOT NULL,
  origin        VARCHAR(3) NOT NULL,         -- IATA code
  destination   VARCHAR(3) NOT NULL,
  date          DATE NOT NULL,
  airline_code  VARCHAR(10),                 -- e.g. 'GA', 'JT', 'QG'
  flight_number VARCHAR(10),                 -- e.g. 'GA-401'
  cabin_class   VARCHAR(20) DEFAULT 'ECONOMY',
  departure_at  TIME,
  arrival_at    TIME,
  duration_min  INT,
  stops         INT DEFAULT 0,
  price_idr     BIGINT NOT NULL,
  scraped_at    TIMESTAMPTZ DEFAULT NOW(),
  raw_data      JSONB
);

-- Alerts (spesifik: airline + rute + tanggal)
CREATE TABLE alerts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Target flight criteria
  origin            VARCHAR(3) NOT NULL,
  destination       VARCHAR(3) NOT NULL,
  departure_date    DATE NOT NULL,
  airline_code      VARCHAR(10),             -- NULL = semua maskapai
  flight_number     VARCHAR(10),             -- NULL = semua nomor penerbangan
  cabin_class       VARCHAR(20) DEFAULT 'ECONOMY',
  -- Threshold
  threshold_price   BIGINT NOT NULL,         -- IDR
  -- Push Notification
  push_subscription JSONB NOT NULL,          -- browser PushSubscription object
  client_id         VARCHAR(64),             -- random ID di localStorage user
  -- Status
  is_active         BOOLEAN DEFAULT TRUE,
  last_checked_at   TIMESTAMPTZ,
  last_price_seen   BIGINT,                  -- harga terakhir saat check
  triggered_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Logs
CREATE TABLE notification_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id         UUID REFERENCES alerts(id) ON DELETE CASCADE,
  source           flight_source,
  price_triggered  BIGINT,
  flight_number    VARCHAR(10),
  sent_at          TIMESTAMPTZ DEFAULT NOW(),
  success          BOOLEAN,
  error_message    TEXT
);

-- Indexes
CREATE INDEX idx_price_records_route ON price_records(origin, destination, date, airline_code);
CREATE INDEX idx_price_records_time ON price_records(scraped_at DESC);
CREATE INDEX idx_alerts_active ON alerts(is_active, departure_date);
CREATE INDEX idx_alerts_client ON alerts(client_id);
```

---

## 🌊 Data Flow Diagrams

### Search Flow (Unified)
```
User submit search form
  (origin, destination, date, adults, cabin, airline_filter?)
    │
    ▼
Backend: SearchService.search(params)
    │
    ├── [Full-service airlines] AmadeusService.searchFlights()
    │       └── Check Redis cache → HIT: return | MISS: call Amadeus → cache 10 min
    │
    └── [LCC airlines] ScraperService.search(airline, params)
            ├── LionAirScraper.search()   (Playwright headless)
            ├── CitilinkScraper.search()  (Playwright headless)
            └── AirAsiaScraper.search()   (Playwright headless)
                    └── Cache results 30 menit (LCC lebih lambat)
    │
    ▼
Normalize → FlightOffer[] (unified model)
    ├── source: 'AMADEUS' | 'LIONAIR' | 'CITILINK' | ...
    ├── price_idr: number
    ├── airline: { code, name, logo }
    ├── segments: [{ departure, arrival, duration, stops }]
    └── direct_booking_url: string (link ke booking page asli)
    │
    ▼
Background: upsert price_records (history)
    │
    ▼
Return sorted by price_idr ASC
```

### Alert Setup Flow
```
User pilih flight di results page
    → Klik "Set Alert"
    → AlertModal: input threshold price (IDR)
    → Klik "Aktifkan Notifikasi"
    │
    ▼
Frontend: push.ts
    ├── Request notification permission
    ├── navigator.serviceWorker.register('/sw.js')
    └── PushManager.subscribe({ applicationServerKey: vapidPublicKey })
            → returns PushSubscription object
    │
    ▼
POST /api/alerts
  body: {
    origin, destination, departureDate,
    airlineCode, flightNumber, cabinClass,
    thresholdPrice,
    pushSubscription,
    clientId  (random UUID dari localStorage)
  }
    │
    ▼
Backend: save to alerts table
    → Return alertId
    │
    ▼
Frontend: localStorage.setItem('mytiket_alerts', [...ids])
    → Show di /alerts page
```

### Price Check Job Flow (BullMQ — every 30 min)
```
BullMQ Repeatable Job fires
    │
    ▼
alertWorker.ts
    │
    ▼
Load all active alerts WHERE departure_date >= TODAY
    │
    ▼
Group alerts by (origin, destination, date) → batching

For each group:
    │
    ├── Amadeus alerts → AmadeusService.getPricingConfirmation()
    │     (delay 200ms between calls)
    │
    └── LCC alerts → ScraperService.getLatestPrice(airline, route, date)
          (delay 2000ms between scraper calls — lebih sopan)
    │
    ▼
For each alert: compare current_price vs threshold_price
    ├── current_price ≤ threshold:
    │     ├── webpush.send(subscription, notification payload)
    │     ├── INSERT notification_logs
    │     └── UPDATE alerts SET is_active=false, triggered_at=NOW()
    │
    └── current_price > threshold:
          └── UPDATE alerts SET last_checked_at=NOW(), last_price_seen=current_price
```

---

## 📋 Phase Breakdown (Updated)

### 🟦 Phase 0 — Bootstrap & DevOps Setup `(~1 hari)`

**Project Init:**
- [ ] `npm create next-app@latest frontend` (TypeScript, Tailwind, App Router)
- [ ] `mkdir backend && npm init` + Fastify + TypeScript setup
- [ ] Prisma init + schema + first migration

**Docker (Local Dev):**
```yaml
# docker-compose.yml
services:
  postgres:    image: postgres:16, port: 5432
  redis:       image: redis:7-alpine, port: 6379
  # Frontend + Backend dijalankan lokal (hot reload)
```

**VPS Docker (Prod):**
```yaml
# docker-compose.prod.yml
services:
  frontend:    Next.js build, port: 3000
  backend:     Fastify build, port: 4000
  postgres:    persistent volume
  redis:       persistent volume
  nginx:       port: 80/443, proxy ke frontend:3000 + backend:4000
```

**Nginx Config:**
```nginx
# /app.domain.com → frontend :3000
# /api.domain.com → backend :4000
# SSL via Certbot
```

**Env:**
- [ ] `.env.example` dengan semua keys terdokumentasi
- [ ] `AMADEUS_CLIENT_ID`, `AMADEUS_CLIENT_SECRET`
- [ ] `DATABASE_URL` (PostgreSQL)
- [ ] `REDIS_URL`
- [ ] `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (generate sekali)
- [ ] `VAPID_EMAIL`

**Deliverable:** Local dev jalan, DB migrated, Amadeus token tested ✅

---

### 🟦 Phase 1 — Core Search: Amadeus `(~2 hari)`

**Backend:**
- [ ] `AmadeusService` class:
  - Token management (auto-refresh sebelum expire)
  - `searchFlights(params)` → normalized FlightOffer[]
  - `confirmPrice(offerId)` → confirmed price IDR
  - `searchAirports(keyword)` → airport autocomplete
  - Redis cache layer (TTL 10 menit)
- [ ] Routes:
  - `GET /api/flights/search?origin=CGK&destination=SIN&date=2024-12-01&adults=1&cabin=ECONOMY`
  - `GET /api/airports?keyword=Jakarta`
  - `GET /api/airlines?code=GA`

**Frontend:**
- [ ] `SearchForm.tsx`: origin/dest autocomplete, date picker, cabin, adults
- [ ] `/search` results page: list FlightCard
- [ ] `FlightCard.tsx`: airline logo, jadwal, durasi, stops, harga IDR, tombol "Set Alert"
- [ ] Sort: harga, durasi, departure time
- [ ] Filter: stops (langsung/transit), maskapai
- [ ] Source badge: "Amadeus" (biru) / "Scraper" (oranye)
- [ ] Loading skeleton

**Deliverable:** Search full-service airlines bekerja ✅

---

### 🟦 Phase 2 — LCC Scraper Layer `(~3 hari)`

**Scraper Architecture:**
```typescript
interface ScraperProvider {
  airlineCode: string;
  search(params: SearchParams): Promise<FlightOffer[]>;
  getPrice(flightRef: string, date: string): Promise<number>;
}
```

**Scrapers to implement (Playwright stealth):**

**Lion Air** (`lionair.co.id`):
- [ ] Navigate ke booking form
- [ ] Input origin/dest/date
- [ ] Wait for hasil → parse flight list
- [ ] Extract: flight number, time, price IDR
- [ ] Cache: 30 menit

**Citilink** (`citilink.co.id`):
- [ ] Similar flow
- [ ] Handle redirect/popup
- [ ] Extract price dari DOM

**AirAsia** (`airasia.com`):
- [ ] More complex (React SPA)
- [ ] Wait for network idle
- [ ] Extract dari DOM/intercept XHR response
- [ ] Cache: 30 menit

**Super Air Jet** (`superairjet.com`):
- [ ] Simpler site, priority lebih rendah

**ScraperService** (orchestrator):
- [ ] `search(airline, params)` → route ke scraper yang tepat
- [ ] Timeout per scraper: 30 detik
- [ ] Retry: 2x dengan backoff
- [ ] Fallback: jika scraper gagal → return empty, log error

**Backend route update:**
- [ ] `GET /api/flights/search` sekarang trigger parallel: Amadeus + scrapers
- [ ] Parameter `source=all|amadeus|lcc` untuk filter

**Deliverable:** LCC results muncul di samping Amadeus results ✅

---

### 🟦 Phase 3 — Price History & Calendar `(~1.5 hari)`

**Backend:**
- [ ] Background task: setiap search result → `upsert price_records`
- [ ] `GET /api/flights/history?origin=CGK&destination=SIN&date=2024-12-01&airline=GA`
  - Return: array of `{scraped_at, price_idr, source}`
- [ ] `GET /api/flights/cheapest-dates?origin=CGK&destination=SIN` (Amadeus cached)
- [ ] `GET /api/flights/inspiration?origin=CGK` (Amadeus cached)

**Frontend:**
- [ ] `PriceChart.tsx`: line chart (Recharts) per maskapai — 7 hari terakhir
- [ ] Calendar heatmap di search form (warna per tanggal)
- [ ] Badge `🟢 Turun X% / 🔴 Naik X% / ⚪ Stabil` vs kemarin
- [ ] "Explore" section di homepage: destinasi murah dari Jakarta

**Deliverable:** User bisa lihat tren harga historis ✅

---

### 🟦 Phase 4 — Alert System + Web Push `(~2 hari)`

**Backend:**
- [ ] VAPID key pair (generate + store di env)
- [ ] `POST /api/push/subscribe` → simpan subscription
- [ ] `GET /api/push/vapid-key` → expose public key
- [ ] `POST /api/alerts` → create alert (spesifik: airline+rute+tanggal+threshold)
- [ ] `GET /api/alerts?clientId=xxx` → list alerts milik user ini
- [ ] `DELETE /api/alerts/:id` → hapus alert
- [ ] BullMQ repeatable job: `PriceCheckerJob` (every 30 menit)
- [ ] `AlertWorker`: cek semua alert aktif → send push jika threshold tercapai

**Frontend:**
- [ ] Service Worker `/public/sw.js`:
  - Handle `push` event → show notification
  - Handle `notificationclick` → open URL
- [ ] `push.ts` lib: requestPermission + subscribe + sendToServer
- [ ] `AlertModal.tsx`:
  - Input: threshold price IDR
  - Show: "Pantau: GA-401 CGK→SIN 1 Des 2024"
  - Button: "Aktifkan Notifikasi"
- [ ] `/alerts` page:
  - Load alertIds dari localStorage
  - Fetch details dari backend
  - Tampilkan: rute, maskapai, threshold, harga terakhir, status
  - Tombol: "Hapus Alert"

**Push Notification Payload:**
```json
{
  "title": "🎫 Harga Tiket Turun!",
  "body": "GA-401 CGK→SIN 1 Des: Rp 1.250.000 (target Rp 1.500.000)",
  "icon": "/icon-192.png",
  "data": { "url": "/search?...prefill" }
}
```

**Deliverable:** End-to-end alert + push notification bekerja ✅

---

### 🟦 Phase 5 — VPS Deploy `(~1.5 hari)`

**VPS Ubuntu Setup:**
```bash
# Prerequisites
apt install docker.io docker-compose nginx certbot python3-certbot-nginx

# Clone repo
git clone ... /opt/mytiket

# Build & run
docker-compose -f docker-compose.prod.yml up -d

# SSL
certbot --nginx -d mytiket.yourdomain.com
```

**docker-compose.prod.yml:**
```yaml
services:
  frontend:
    build: ./frontend
    environment: [NEXT_PUBLIC_API_URL=https://api.mytiket.com]
    restart: unless-stopped

  backend:
    build: ./backend
    environment: [...env vars...]
    depends_on: [postgres, redis]
    restart: unless-stopped

  postgres:
    image: postgres:16
    volumes: [pgdata:/var/lib/postgresql/data]
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes: [redisdata:/data]
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - /etc/letsencrypt:/etc/letsencrypt
    restart: unless-stopped
```

**Nginx Config:**
```nginx
server {
  listen 443 ssl;
  server_name mytiket.yourdomain.com;
  location / { proxy_pass http://frontend:3000; }
}
server {
  listen 443 ssl;
  server_name api.mytiket.yourdomain.com;
  location / { proxy_pass http://backend:4000; }
}
```

**CI/CD sederhana (manual deploy script):**
```bash
#!/bin/bash
# deploy.sh
git pull origin main
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

**Deliverable:** App live di domain, SSL aktif ✅

---

### 🟦 Phase 6 — Polish & Hardening `(~1 hari)`
- [ ] Dark mode toggle
- [ ] Mobile responsive
- [ ] Rate limit di backend (prevent abuse)
- [ ] Scraper error monitoring (log ke file/table)
- [ ] Alert expiry: auto-deactivate jika `departure_date` sudah lewat
- [ ] Disclaimer UI: "Harga bersumber dari Amadeus/website maskapai. Konfirmasi sebelum booking."
- [ ] Robots.txt + basic SEO meta tags
- [ ] Health check endpoint `GET /health`

---

### 🔮 Phase 7 — V2 Backlog
- [ ] Email notification fallback (Resend.com)
- [ ] User auth (tambahkan di atas anonymous model)
- [ ] Multi-passenger alert
- [ ] PWA install prompt
- [ ] "Best time to buy" (simple: bandingkan harga hari ini vs rata-rata 30 hari)
- [ ] Tambah scraper maskapai lain (TransNusa, Pelita Air)
- [ ] Internasional: scraper untuk Scoot, Jetstar

---

## ⚠️ Risk & Mitigation

| Risk | Impact | Mitigasi |
|------|--------|----------|
| LCC website berubah layout → scraper rusak | High | Test weekly, fallback graceful (return empty) |
| Anti-bot detection pada LCC | High | Playwright stealth, random delay 1-5 detik, user-agent rotation |
| Amadeus test env data terbatas | Medium | Dokumentasikan rute yang tersedia, gunakan major hubs |
| Web Push ditolak user | Medium | In-app alert list sebagai fallback (polling manual) |
| VPS down → semua service down | Medium | Setup basic monitoring (uptime robot free), Docker restart policy |
| Price dari scraper ≠ harga booking final (dynamic pricing) | Low | Disclaimer di UI, link ke halaman booking asli |

---

## 🔄 Current Status

| Phase | Status | Est. Days |
|-------|--------|-----------|
| Phase 0 — Bootstrap & DevOps | 🔲 Ready | 1 hari |
| Phase 1 — Core Search (Amadeus) | 🔲 Ready | 2 hari |
| Phase 2 — LCC Scraper | 🔲 Ready | 3 hari |
| Phase 3 — Price History | 🔲 Ready | 1.5 hari |
| Phase 4 — Alert System + Push | 🔲 Ready | 2 hari |
| Phase 5 — VPS Deploy | 🔲 Ready | 1.5 hari |
| Phase 6 — Polish | 🔲 Ready | 1 hari |
| Phase 7 — V2 Features | 🔲 Backlog | TBD |
| **Total MVP** | | **~12 hari** |
