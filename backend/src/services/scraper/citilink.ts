import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { Redis } from 'ioredis';
import type { CabinClass, FlightOffer, SearchParams } from '../types';

chromium.use(StealthPlugin());

const CACHE_TTL = 60 * 30;

export class CitilinkScraper {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async search(params: SearchParams): Promise<FlightOffer[]> {
    const cacheKey = `scraper:citilink:${params.origin}:${params.destination}:${params.date}:${params.cabin}`;
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

      const interceptedData: any[] = [];
      page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/api/') && (url.includes('search') || url.includes('flights') || url.includes('availability'))) {
          try {
            const ct = response.headers()['content-type'] || '';
            if (ct.includes('json')) {
              const body = await response.json();
              interceptedData.push(body);
            }
          } catch {}
        }
      });

      // Format tanggal: YYYY-MM-DD → DD-MM-YYYY
      const [y, m, d] = params.date.split('-');
      const dateFormatted = `${d}-${m}-${y}`;

      const url = `https://www.citilink.co.id/id/search?org=${params.origin}&des=${params.destination}&dep=${dateFormatted}&adt=${params.adults}&chd=0&inf=0&type=OW`;
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000 + Math.random() * 2000);

      // Parse dari intercepted responses
      for (const raw of interceptedData) {
        const normalized = normalizeCitilinkResponse(raw, params);
        results.push(...normalized);
      }

    } catch (err) {
      console.error('[Citilink] Scraping error:', err);
    } finally {
      await browser.close();
    }

    if (results.length > 0) {
      await this.redis.setex(cacheKey, CACHE_TTL, JSON.stringify(results));
    }

    return results;
  }
}

function normalizeCitilinkResponse(raw: any, params: SearchParams): FlightOffer[] {
  const flights = raw?.data || raw?.flights || raw?.journeys || [];
  return (Array.isArray(flights) ? flights : []).map((f: any, i: number) => {
    const dep = f.departureTime || f.departure?.time || '';
    const arr = f.arrivalTime || f.arrival?.time || '';
    const price = parseFloat(String(f.price?.total || f.totalFare || f.amount || '0').replace(/[^0-9.]/g, ''));

    return {
      id: `citilink-${params.origin}-${params.destination}-${params.date}-${i}`,
      source: 'CITILINK' as const,
      airline: { code: 'QG', name: 'Citilink', logo: 'https://pics.avs.io/60/60/QG.png' },
      flightNumber: f.flightNumber || f.flight_no || 'QG-XXX',
      origin: params.origin,
      destination: params.destination,
      departureAt: `${params.date}T${dep || '00:00'}:00`,
      arrivalAt: `${params.date}T${arr || '00:00'}:00`,
      durationMinutes: f.duration || 0,
      stops: f.stops || 0,
      cabinClass: 'ECONOMY' as CabinClass,
      priceIdr: Math.round(price),
      baggage: f.baggage || '20 kg',
      bookingUrl: `https://www.citilink.co.id/id/search?org=${params.origin}&des=${params.destination}&dep=${params.date}&adt=1`,
    };
  }).filter((f: FlightOffer) => f.priceIdr > 0);
}
