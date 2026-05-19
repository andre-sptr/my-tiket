# 🛫 myTiket — Brainstorming & Ideasi Proyek

> Web app pemantau harga tiket pesawat real-time dengan notifikasi threshold.

---

## 🎯 Core Problem

Cari tiket murah itu melelahkan:
- Harus buka banyak platform satu-satu (Traveloka, Tiket.com, Google Flights, dll)
- Harga berubah sewaktu-waktu — kalau nggak mantengin, bisa kehabisan
- Nggak ada satu tempat yang ngasih tau "sekarang harganya sudah turun ke X"

---

## 💡 Solusi: myTiket

Satu dashboard yang:
1. **Agregasi harga** dari berbagai platform
2. **Pantau real-time** (atau near real-time dengan polling)
3. **Kirim notifikasi** ketika harga menyentuh threshold yang diset user

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND (Web App)                │
│   Dashboard │ Search │ Alert Manager │ History       │
└────────────────────────┬────────────────────────────┘
                         │ REST API / WebSocket
┌────────────────────────▼────────────────────────────┐
│                   BACKEND (API Server)               │
│   Scraper Scheduler │ Price Cache │ Alert Engine     │
└──────┬──────────────────────────────┬───────────────┘
       │                              │
┌──────▼──────┐                ┌──────▼──────┐
│  Scraper    │                │  Database   │
│  Workers    │                │  (Prices +  │
│  (per site) │                │   Alerts)   │
└──────┬──────┘                └─────────────┘
       │
┌──────▼──────────────────────────────────────────────┐
│              Target Platforms                        │
│  Traveloka │ Tiket.com │ Google Flights │ Pegipegi   │
│  Airpaz    │ Nusatrip  │ Skyscanner     │ dst.       │
└─────────────────────────────────────────────────────┘
```

---

## 📋 Feature List

### MVP (Must Have)
- [ ] Search tiket (rute + tanggal)
- [ ] Tampilkan hasil dari multiple platform dalam 1 halaman
- [ ] Sort & filter harga (termurah, maskapai, durasi, stopover)
- [ ] Set price threshold / alert per rute
- [ ] Web Push Notification ketika threshold tercapai
- [ ] History tracking harga (grafik naik/turun)

### Nice to Have (V2)
- [ ] Price prediction ("harga biasanya turun H-X hari")
- [ ] Calendar view — lihat harga per hari dalam sebulan
- [ ] Fare alert email (backup dari web notif)
- [ ] Multi-user / akun pribadi
- [ ] Mobile responsive / PWA
- [ ] Chrome Extension untuk compare harga saat browsing
- [ ] "Best time to buy" recommendation
- [ ] Share alert / compare dengan teman

### Futur / V3
- [ ] AI-powered fare prediction (ML model)
- [ ] Integration dengan kalender (Google Calendar)
- [ ] Auto-book jika harga tercapai (advanced)

---

## 🔧 Tech Stack Rekomendasi

### Frontend
| Pilihan | Kenapa |
|---------|--------|
| **Next.js 14 (App Router)** | SSR + CSR fleksibel, ekosistem kaya |
| React Query / TanStack Query | Data fetching + cache management |
| Tailwind CSS + shadcn/ui | UI cepat, clean, konsisten |
| Chart.js / Recharts | Grafik harga historis |
| Web Push API (browser native) | Notifikasi tanpa library eksternal |

### Backend
| Pilihan | Kenapa |
|---------|--------|
| **Node.js + Fastify / Express** | Ringan, cepat, familiar |
| **atau Python + FastAPI** | Lebih cocok kalau banyak scraping/data work |
| BullMQ / Bull | Job queue untuk scraping scheduler |
| Redis | Cache harga + pub/sub untuk real-time |
| PostgreSQL | Store alert, history harga, user data |
| Puppeteer / Playwright | Scraping platform yang anti-bot |
| web-push npm package | Kirim Push Notification ke browser |

### Infrastruktur
| Pilihan | Kenapa |
|---------|--------|
| Docker Compose | Local dev mudah |
| Vercel (frontend) + Railway/Render (backend) | Deploy gratis untuk MVP |
| Supabase | PostgreSQL + Auth siap pakai |

---

## 🕷️ Strategi Scraping / Data Source

### Opsi 1: Official API (kalau ada)
- **Google Flights** → Pakai Serpapi (Google Flights API) — berbayar tapi reliable
- **Skyscanner** → Ada Partner API (perlu daftar)
- **Amadeus API** → Official airline data, gratis tier ada

### Opsi 2: Web Scraping
- Traveloka, Tiket.com, Pegipegi → Puppeteer / Playwright
- Anti-bot: Pakai stealth mode, rotate proxy, mimic human behavior
- Rate limiting: Jangan terlalu sering hit — set interval 15-30 menit

### Opsi 3: Hybrid
- Gunakan API resmi untuk maskapai besar
- Scraping untuk platform OTA lokal
- Cache agresif biar nggak kena block

---

## 🔔 Flow Web Push Notification

```
1. User buka app → browser minta permission notif
2. Browser generate subscription object (endpoint + keys)
3. Subscription dikirim ke backend → disimpan di DB
4. Backend scheduler cek harga setiap N menit
5. Jika harga ≤ threshold → backend kirim push ke endpoint
6. Browser terima notif → tampilkan meski app ditutup
7. User klik notif → dibawa ke halaman deal
```

---

## 🗺️ User Flow

```
[Landing Page]
    │
    ▼
[Search Form]
  Origin → Destination → Tanggal → Kelas
    │
    ▼
[Results Page]
  ┌─ List harga semua platform (sorted by price)
  ├─ Filter maskapai / stopover / durasi
  ├─ Price history chart
  └─ Tombol "Set Alert" per flight/rute
         │
         ▼
    [Alert Modal]
      Input threshold harga
      Enable notifikasi browser
      Simpan alert
         │
         ▼
    [My Alerts Page]
      List semua alert aktif
      Status: monitoring / triggered
      Riwayat notif yang sudah dikirim
```

---

## 🎨 UI/UX Ideas

- **Dark mode by default** — eye-friendly untuk mantengin harga malam
- **Price badge warna** — hijau (turun), merah (naik), abu (stabil)
- **"Lowest in X days"** badge di tiket termurah
- **Heatmap kalender** — warna menunjukkan harga per tanggal
- **Compact vs card view** — user bisa pilih tampilan list
- **Quick compare** — centang beberapa tiket lalu compare side-by-side

---

## ⚠️ Tantangan & Risiko

| Tantangan | Mitigasi |
|-----------|----------|
| Anti-scraping Traveloka/Tiket.com | Headless browser + stealth + proxy rotation |
| Rate limiting | Queue + interval scheduling + caching |
| Harga cepat berubah | Polling tiap 15-30 menit, timestamp kapan cek terakhir |
| Data inconsistency antar platform | Normalisasi data model (IATA code, etc.) |
| Browser notif diblock user | Fallback ke email notif / in-app notif |
| Skala besar = mahal infra | Mulai dari MVP kecil, scale later |

---

## 📅 Roadmap Pengembangan

### Phase 1 — MVP (2-3 minggu)
- Setup project (Next.js + Node backend)
- Scraper 2-3 platform (Google Flights via API + 1 OTA lokal)
- UI: Search form + Results page
- Alert system + Web Push Notification
- Deploy ke Vercel + Railway

### Phase 2 — Enhancement (2-3 minggu)
- Tambah platform scraping
- Price history chart
- Calendar heatmap view
- Email fallback notification
- User auth (Supabase Auth)

### Phase 3 — Polish & Scale
- Mobile PWA
- AI price prediction
- Performance optimization
- Monitoring & alerting (Sentry, etc.)

---

## 🔑 Data Model (Simplified)

```
Flight Search
- id, origin, destination, date, class
- created_at

Price Record
- id, flight_search_id, platform, airline
- price, currency, departure_time, arrival_time
- duration, stops, direct_link
- scraped_at

Alert
- id, user_id (optional for MVP)
- origin, destination, date
- threshold_price, currency
- push_subscription (JSON)
- is_active, triggered_at

Notification Log
- id, alert_id, price_at_trigger
- sent_at, clicked_at
```

---

## 🚀 Langkah Pertama

1. Inisialisasi project Next.js di folder `myTiket/`
2. Setup backend (Node + Express/Fastify)
3. Buat mock data dulu untuk UI development
4. Implement scraper pertama (Google Flights / Amadeus API)
5. Sambungkan frontend-backend
6. Implement alert + push notification

---

*Dibuat: 2026-05-11 | Status: Brainstorming*
