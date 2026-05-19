import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { Redis } from 'ioredis';
import type { FlightOffer, SearchParams } from '../types';

chromium.use(StealthPlugin());

const CACHE_TTL = 60 * 30; // 30 menit

export class LionAirScraper {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async search(params: SearchParams): Promise<FlightOffer[]> {
    const cacheKey = `scraper:lionair:${params.origin}:${params.destination}:${params.date}:${params.cabin}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const results: FlightOffer[] = [];

    try {
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        locale: 'id-ID',
      });
      const page = await context.newPage();

      // Intercept Lion Air API responses
      const interceptedFlights: any[] = [];
      page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('availability') || url.includes('flight-search') || url.includes('offers')) {
          try {
            const body = await response.json();
            if (body?.flights || body?.data?.flights || body?.offers) {
              interceptedFlights.push(body);
            }
          } catch {}
        }
      });

      // Navigate to Lion Air booking
      const searchUrl = `https://www.lionair.co.id/id/search?lang=ID&from=${params.origin}&to=${params.destination}&depart=${params.date}&adult=${params.adults}&child=0&infant=0&tripType=OW&cabin=${mapCabin(params.cabin)}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });

      // Random delay (bersikap seperti human)
      await page.waitForTimeout(2000 + Math.random() * 2000);

      // Parse dari DOM jika intercept kosong
      if (interceptedFlights.length === 0) {
        // Coba parse dari DOM
        const flightElements = await page.$$('[data-flight]');
        for (const el of flightElements) {
          const data = await el.getAttribute('data-flight');
          if (data) {
            try { interceptedFlights.push(JSON.parse(data)); } catch {}
          }
        }
      }

      // Normalize hasil
      for (const raw of interceptedFlights) {
        const normalized = normalizeLionAirResponse(raw, params);
        results.push(...normalized);
      }

    } catch (err) {
      console.error('[LionAir] Scraping error:', err);
    } finally {
      await browser.close();
    }

    if (results.length > 0) {
      await this.redis.setex(cacheKey, CACHE_TTL, JSON.stringify(results));
    }

    return results;
  }
}

function mapCabin(cabin: string): string {
  const map: Record<string, string> = {
    ECONOMY: 'Y',
    BUSINESS: 'C',
    PREMIUM_ECONOMY: 'W',
    FIRST: 'F',
  };
  return map[cabin] || 'Y';
}

function normalizeLionAirResponse(raw: any, params: SearchParams): FlightOffer[] {
  const flights = raw?.flights || raw?.data?.flights || raw?.offers || [];
  return (Array.isArray(flights) ? flights : []).map((f: any, i: number) => {
    const depTime = f.departureTime || f.dep_time || '';
    const arrTime = f.arrivalTime || f.arr_time || '';
    const flightNum = f.flightNumber || f.flight_number || `JT-XXX`;
    const priceRaw = f.price?.amount || f.totalPrice || f.fare || 0;
    const priceIdr = Math.round(Number(String(priceRaw).replace(/\D/g, '')) || 0);

    return {
      id: `lionair-${params.origin}-${params.destination}-${params.date}-${i}`,
      source: 'LIONAIR' as const,
      airline: {
        code: 'JT',
        name: 'Lion Air',
        logo: 'https://pics.avs.io/60/60/JT.png',
      },
      flightNumber: flightNum,
      origin: params.origin,
      destination: params.destination,
      departureAt: `${params.date}T${depTime}:00`,
      arrivalAt: `${params.date}T${arrTime}:00`,
      durationMinutes: f.duration || 0,
      stops: f.stops || 0,
      cabinClass: 'ECONOMY' as CabinClass,
      priceIdr,
      baggage: f.baggage || '20 kg',
      bookingUrl: `https://www.lionair.co.id/id/search?from=${params.origin}&to=${params.destination}&depart=${params.date}&adult=1`,
    };
  }).filter((f: FlightOffer) => f.priceIdr > 0);
}
