import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { Redis } from 'ioredis';
import type { CabinClass, FlightOffer, SearchParams } from '../types';

chromium.use(StealthPlugin());

const CACHE_TTL = 60 * 30;

export class SuperAirJetScraper {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async search(params: SearchParams): Promise<FlightOffer[]> {
    const cacheKey = `scraper:superairjet:${params.origin}:${params.destination}:${params.date}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const results: FlightOffer[] = [];

    try {
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        locale: 'id-ID',
      });
      const page = await context.newPage();

      const interceptedData: any[] = [];
      page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('superairjet') && url.includes('api')) {
          try {
            const body = await response.json();
            if (body?.data || body?.flights) interceptedData.push(body);
          } catch {}
        }
      });

      await page.goto('https://www.superairjet.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1500);

      // Fill search form
      try {
        await page.fill('[name="origin"], [placeholder*="Kota Asal"], [placeholder*="From"]', params.origin);
        await page.fill('[name="destination"], [placeholder*="Kota Tujuan"], [placeholder*="To"]', params.destination);
        await page.fill('[name="date"], [placeholder*="Tanggal"], [type="date"]', params.date);
        await page.click('[type="submit"], button[class*="search"]');
        await page.waitForTimeout(5000);
      } catch {}

      for (const raw of interceptedData) {
        results.push(...normalizeSAJResponse(raw, params));
      }

    } catch (err) {
      console.error('[SuperAirJet] Scraping error:', err);
    } finally {
      await browser.close();
    }

    if (results.length > 0) {
      await this.redis.setex(cacheKey, CACHE_TTL, JSON.stringify(results));
    }

    return results;
  }
}

function normalizeSAJResponse(raw: any, params: SearchParams): FlightOffer[] {
  const flights = raw?.data?.flights || raw?.flights || [];
  return (Array.isArray(flights) ? flights : []).map((f: any, i: number) => ({
    id: `superairjet-${params.origin}-${params.destination}-${params.date}-${i}`,
    source: 'SUPERAIRJET' as const,
    airline: { code: 'IU', name: 'Super Air Jet', logo: 'https://pics.avs.io/60/60/IU.png' },
    flightNumber: f.flightNumber || 'IU-XXX',
    origin: params.origin,
    destination: params.destination,
    departureAt: f.departureTime || `${params.date}T00:00:00`,
    arrivalAt: f.arrivalTime || `${params.date}T00:00:00`,
    durationMinutes: f.duration || 0,
    stops: 0,
    cabinClass: 'ECONOMY' as CabinClass,
    priceIdr: Math.round(parseFloat(String(f.price || '0').replace(/[^0-9.]/g, ''))),
    baggage: f.baggage || '20 kg',
    bookingUrl: `https://www.superairjet.com`,
  })).filter((f: FlightOffer) => f.priceIdr > 0);
}
