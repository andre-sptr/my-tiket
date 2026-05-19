import type { FlightOffer, SearchParams } from '../types';
import { LionAirScraper } from './lionair';
import { CitilinkScraper } from './citilink';
import { AirAsiaScraper } from './airasia';
import { SuperAirJetScraper } from './superairjet';
import type { Redis } from 'ioredis';

type ScraperMap = Record<string, { search: (p: SearchParams) => Promise<FlightOffer[]> }>;

export class ScraperService {
  private scrapers: ScraperMap;
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
    this.scrapers = {
      JT: new LionAirScraper(redis),
      QG: new CitilinkScraper(redis),
      QZ: new AirAsiaScraper(redis),
      IU: new SuperAirJetScraper(redis),
    };
  }

  /** Jalankan semua scraper yang relevan secara paralel */
  async search(params: SearchParams, airlineCodes?: string[]): Promise<FlightOffer[]> {
    const targets = airlineCodes
      ? airlineCodes.filter((c) => this.scrapers[c])
      : Object.keys(this.scrapers);

    const results = await Promise.allSettled(
      targets.map((code) => this.safeSearch(code, params))
    );

    return results
      .filter((r): r is PromiseFulfilledResult<FlightOffer[]> => r.status === 'fulfilled')
      .flatMap((r) => r.value);
  }

  async getLatestPrice(
    airlineCode: string,
    origin: string,
    destination: string,
    date: string
  ): Promise<number | null> {
    const scraper = this.scrapers[airlineCode];
    if (!scraper) return null;

    try {
      const results = await this.safeSearch(airlineCode, {
        origin, destination, date,
        adults: 1, cabin: 'ECONOMY',
      });
      if (results.length === 0) return null;
      return Math.min(...results.map((r) => r.priceIdr));
    } catch {
      return null;
    }
  }

  private async safeSearch(code: string, params: SearchParams): Promise<FlightOffer[]> {
    const scraper = this.scrapers[code];
    if (!scraper) return [];

    try {
      const result = await Promise.race<FlightOffer[]>([
        scraper.search(params),
        timeout(35_000), // 35 detik timeout per scraper
      ]);
      return result;
    } catch (err) {
      console.warn(`[Scraper:${code}] Failed:`, (err as Error).message);
      return [];
    }
  }
}

function timeout(ms: number): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Scraper timeout after ${ms}ms`)), ms)
  );
}
