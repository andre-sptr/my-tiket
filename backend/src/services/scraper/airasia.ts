import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { Redis } from 'ioredis';
import type { CabinClass, FlightOffer, SearchParams } from '../types';

chromium.use(StealthPlugin());

const CACHE_TTL = 60 * 30;

export class AirAsiaScraper {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async search(params: SearchParams): Promise<FlightOffer[]> {
    const cacheKey = `scraper:airasia:${params.origin}:${params.destination}:${params.date}:${params.cabin}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const results: FlightOffer[] = [];

    try {
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        locale: 'id-ID',
      });
      const page = await context.newPage();

      // AirAsia: intercept API calls
      const interceptedFlights: any[] = [];
      page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('airasia.com') && (url.includes('availability') || url.includes('fare') || url.includes('search'))) {
          try {
            const ct = response.headers()['content-type'] || '';
            if (ct.includes('json')) {
              const body = await response.json();
              if (body?.flightAvailabilities || body?.fareKeys || body?.data) {
                interceptedFlights.push(body);
              }
            }
          } catch {}
        }
      });

      const url = `https://www.airasia.com/en/gb/book-a-flight/select-flights.page?origin=${params.origin}&destination=${params.destination}&departDate=${params.date}&adultCount=${params.adults}&childCount=0&infantCount=0&flexDate=false&tripType=O&cabin=${params.cabin === 'ECONOMY' ? 'Y' : 'C'}`;
      await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(4000 + Math.random() * 3000);

      for (const raw of interceptedFlights) {
        results.push(...normalizeAirAsiaResponse(raw, params));
      }

    } catch (err) {
      console.error('[AirAsia] Scraping error:', err);
    } finally {
      await browser.close();
    }

    if (results.length > 0) {
      await this.redis.setex(cacheKey, CACHE_TTL, JSON.stringify(results));
    }

    return results;
  }
}

function normalizeAirAsiaResponse(raw: any, params: SearchParams): FlightOffer[] {
  const avail = raw?.flightAvailabilities || raw?.data?.flights || [];
  return (Array.isArray(avail) ? avail : []).map((f: any, i: number) => {
    const dep = f.departureTime || f.departure_datetime || '';
    const arr = f.arrivalTime || f.arrival_datetime || '';
    const price = parseFloat(String(f.totalAmount || f.price?.amount || '0').replace(/[^0-9.]/g, ''));
    const flightNum = f.flightNumber || f.flight_number || 'QZ-XXX';

    return {
      id: `airasia-${params.origin}-${params.destination}-${params.date}-${i}`,
      source: 'AIRASIA' as const,
      airline: { code: 'QZ', name: 'AirAsia Indonesia', logo: 'https://pics.avs.io/60/60/QZ.png' },
      flightNumber: flightNum,
      origin: params.origin,
      destination: params.destination,
      departureAt: dep || `${params.date}T00:00:00`,
      arrivalAt: arr || `${params.date}T00:00:00`,
      durationMinutes: f.duration || 0,
      stops: f.numberOfStops || 0,
      cabinClass: 'ECONOMY' as CabinClass,
      priceIdr: Math.round(price),
      baggage: f.baggage || 'Tanpa bagasi (beli terpisah)',
      bookingUrl: `https://www.airasia.com/id/id/book-a-flight/select-flights.page?origin=${params.origin}&destination=${params.destination}&departDate=${params.date}&adultCount=1`,
    };
  }).filter((f: FlightOffer) => f.priceIdr > 0);
}
