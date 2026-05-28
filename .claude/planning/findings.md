# myTiket — Research Findings (v2)
> Updated with LCC scraping research + VPS deploy findings

**Updated:** 2026-05-11

---

## Amadeus API — Confirmed Endpoints

### Authentication
- **Method:** OAuth2 `client_credentials` flow
- **Endpoint:** `POST https://test.api.amadeus.com/v1/security/oauth2/token`
- **Token TTL:** 1799 seconds (~30 menit), SDK auto-refresh
- **SDK:** `npm install amadeus` (Node.js official)

### Key Flight Endpoints
| Endpoint | URL | Data Type |
|----------|-----|-----------|
| Flight Offers Search | `GET/POST /v2/shopping/flight-offers` | Real-time, up to 250 results |
| Flight Offers Price | `POST /v1/shopping/flight-offers/pricing` | Real-time confirmation |
| Flight Inspiration | `GET /v1/shopping/flight-destinations` | Cached daily |
| Cheapest Date Search | `GET /v1/shopping/flight-dates` | Cached daily |
| Airport & City Search | `GET /v1/reference-data/locations` | Static |
| Airline Code Lookup | `GET /v1/reference-data/airlines` | Static |

### Rate Limits & Quota
- **Test:** 10 TPS (1 req/100ms)
- **Production:** 40 TPS (1 req/25ms)
- **Free monthly quota:** ~10,000 calls/month (production, varies per API)

### Airlines NOT in Amadeus GDS (need scraping)
- Lion Air (JT) — lionair.co.id
- Citilink (QG) — citilink.co.id
- Super Air Jet (IU) — superairjet.com
- TransNusa (8B) — transnusa.co.id

### Response: FlightOffer (key fields)
```json
{
  "id": "1",
  "itineraries": [{
    "duration": "PT2H30M",
    "segments": [{
      "departure": { "iataCode": "CGK", "at": "2024-12-01T08:00:00" },
      "arrival":   { "iataCode": "SIN", "at": "2024-12-01T11:30:00" },
      "carrierCode": "GA",
      "number": "841",
      "numberOfStops": 0
    }]
  }],
  "price": {
    "currency": "IDR",
    "total": "1250000.00",
    "grandTotal": "1250000.00"
  },
  "travelerPricings": [{
    "fareDetailsBySegment": [{
      "cabin": "ECONOMY",
      "includedCheckedBags": { "quantity": 1 }
    }]
  }]
}
```

---

## LCC Scraping — Research Notes

### Playwright Stealth Setup
```bash
npm install playwright playwright-extra playwright-extra-plugin-stealth
npx playwright install chromium
```

```typescript
import { chromium } from 'playwright-extra';
import StealthPlugin from 'playwright-extra-plugin-stealth';
chromium.use(StealthPlugin());

const browser = await chromium.launch({ headless: true });
```

### Lion Air (lionair.co.id) — Strategy
- Site: React-based SPA
- Approach: Fill booking form → intercept API response (XHR/fetch)
- Target: Network intercept `wego.co.id` or internal API calls
- Timeout: 30 detik
- Cache TTL: 30 menit

### Citilink (citilink.co.id) — Strategy  
- Site: React SPA
- Approach: Fill form → wait for results → parse DOM
- More stable than Lion Air
- Sometimes uses Amadeus backend (might return same data)

### AirAsia (airasia.com) — Strategy
- Site: Complex SPA with heavy JS
- Approach: Intercept XHR/fetch network requests
- Look for: `availability` or `fare` API calls in network tab
- Timeout: 45 detik (slower to load)
- May need proxy rotation

### Scraper Error Handling Pattern
```typescript
async function safeScrap(scraper: ScraperProvider, params: SearchParams) {
  try {
    const result = await Promise.race([
      scraper.search(params),
      timeout(30_000)  // 30 second timeout
    ]);
    return result;
  } catch (err) {
    logger.warn({ scraper: scraper.airlineCode, err }, 'Scraper failed');
    return [];  // graceful fallback — don't crash the whole search
  }
}
```

---

## Web Push API — VAPID Implementation

### VAPID Key Generation (one-time setup)
```bash
npx web-push generate-vapid-keys
# → Add to .env:
# VAPID_PUBLIC_KEY=...
# VAPID_PRIVATE_KEY=...
# VAPID_EMAIL=mailto:you@domain.com
```

### Service Worker (`/public/sw.js`)
```javascript
self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icon-192.png',
    data: { url: data.url }
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  clients.openWindow(event.notification.data.url);
});
```

### Browser Support (2024)
- ✅ Chrome, Edge, Firefox, Opera (desktop + Android)
- ✅ Safari macOS 16.4+ (Web Push support added)
- ⚠️ iOS Safari 16.4+ (only in PWA installed mode)

---

## VPS Ubuntu Deploy Stack

### Docker Compose Services
```
frontend   → Next.js 14 static build, port 3000
backend    → Fastify server, port 4000
postgres   → PostgreSQL 16, port 5432 (internal only)
redis      → Redis 7, port 6379 (internal only)
nginx      → Nginx reverse proxy, port 80/443
```

### Nginx Routing
```
https://mytiket.com       → frontend:3000
https://mytiket.com/api/* → backend:4000/api/*
(atau subdomain: api.mytiket.com → backend:4000)
```

### SSL Strategy
- Certbot + Let's Encrypt (free, auto-renew)
- Mount `/etc/letsencrypt` ke Nginx container

### Prisma Migration on Deploy
```bash
docker-compose exec backend npx prisma migrate deploy
```

### Backup Strategy (simple)
```bash
# Cron: daily pg_dump
docker exec mytiket_postgres pg_dump -U postgres mytiket > backup_$(date +%Y%m%d).sql
```

---

## Anonymous Alert Strategy (No Auth)

### Client-Side
```typescript
// localStorage.ts
const STORAGE_KEY = 'mytiket_client_id';
const ALERTS_KEY = 'mytiket_alert_ids';

export function getClientId(): string {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export function addAlertId(id: string): void {
  const ids = getAlertIds();
  localStorage.setItem(ALERTS_KEY, JSON.stringify([...ids, id]));
}

export function getAlertIds(): string[] {
  return JSON.parse(localStorage.getItem(ALERTS_KEY) || '[]');
}
```

### Backend
- Alert ditandai dengan `clientId` (UUID dari browser)
- `GET /api/alerts?clientId=xxx` → return alerts milik client ini
- Tidak ada password/session — security tidak kritis untuk MVP
- Alert otomatis expire kalau departure_date sudah lewat

---

## Unified FlightOffer Model (normalized)
```typescript
interface FlightOffer {
  id: string;
  source: 'AMADEUS' | 'LIONAIR' | 'CITILINK' | 'AIRASIA' | 'SUPERAIRJET';
  airline: {
    code: string;      // 'GA', 'JT', 'QG'
    name: string;      // 'Garuda Indonesia'
    logo: string;      // URL to logo
  };
  flightNumber: string;  // 'GA-841'
  origin: string;        // 'CGK'
  destination: string;   // 'SIN'
  departureAt: string;   // ISO datetime
  arrivalAt: string;
  durationMinutes: number;
  stops: number;
  cabinClass: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  priceIdr: number;
  baggage: string;       // '1 koper 20kg'
  bookingUrl: string;    // link ke halaman booking asli
  rawOffer?: unknown;    // original response untuk debugging
}
```
