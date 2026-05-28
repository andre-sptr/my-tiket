# myTiket — Progress Log

## Session: 2026-05-11 (v2 update)

### Decisions Confirmed by User
1. ✅ Amadeus API key → user akan taruh di .env
2. ✅ Currency: IDR only
3. ✅ No auth — anonymous MVP (localStorage clientId)
4. ✅ Deploy: VPS Ubuntu (Docker Compose + Nginx + Certbot)
5. ✅ LCC scraping: Lion Air, Citilink, AirAsia, Super Air Jet (Playwright stealth)
6. ✅ Alert spesifik: user pilih airline + rute + tanggal + threshold harga

### Plan v2 Changes
- Removed: Supabase, Upstash, Vercel, Railway (semua self-hosted di VPS)
- Added: docker-compose.prod.yml, Nginx config, Certbot SSL
- Added: Scraper layer (Phase 2), ScraperService architecture
- Added: `airline_code` + `flight_number` ke Alert model
- Added: `client_id` untuk anonymous alert ownership
- Added: `source` enum di price_records + alerts
- Expanded phases: 5 phases → 7 phases + V2 backlog

### Files Updated
- `.claude/planning/task_plan.md` — full v2 rewrite
- `.claude/planning/findings.md` — added scraping research + anonymous strategy

### Next: Phase 0
Siap mulai coding. User perlu:
1. Provide domain name (atau pakai IP langsung untuk MVP)
2. Taruh Amadeus API key ke .env sebelum test Phase 1

### Open Items
- [ ] Domain name untuk VPS deployment
- [ ] Spesifikasi VPS (RAM/CPU) — rekomendasi min. 2GB RAM (Playwright butuh memory)
- [ ] Apakah pakai subdomain api.* atau prefix /api/* di domain yang sama?
