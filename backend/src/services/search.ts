/**
 * UnifiedSearchService — koordinasi Amadeus + Scraper
 */
import type { PrismaClient } from '@prisma/client';
import type { Redis } from 'ioredis';
import { AmadeusService } from './amadeus';
import { ScraperService } from './scraper/index';
import type { FlightOffer, SearchParams } from './types';

// Maskapai yang tersedia di Amadeus GDS
const AMADEUS_AIRLINES = new Set([
  'GA', 'ID', 'SJ', 'SQ', 'MH', 'TG', 'CX', 'EK', 'QR',
  'KL', 'LH', 'BA', 'AF', 'JL', '5J', 'PR', 'VN', 'CI',
]);

// Maskapai yang di-scrape langsung dari website
const LCC_AIRLINES = new Set(['JT', 'QG', 'QZ', 'IU']);

export class UnifiedSearchService {
  private amadeus: AmadeusService;
  private scraper: ScraperService;
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient, redis: Redis) {
    this.amadeus = new AmadeusService(redis);
    this.scraper = new ScraperService(redis);
    this.prisma = prisma;
  }

  async search(params: SearchParams): Promise<{
    flights: FlightOffer[];
    sources: string[];
    cached: boolean;
    fetchedAt: string;
  }> {
    const requestedAirlines = params.airlines?.split(',').map((a) => a.trim().toUpperCase());

    // Tentukan mana yang dari Amadeus, mana yang di-scrape
    const useAmadeus = !requestedAirlines || requestedAirlines.some((a) => AMADEUS_AIRLINES.has(a)) || requestedAirlines.length === 0;
    const lccToScrape = requestedAirlines
      ? requestedAirlines.filter((a) => LCC_AIRLINES.has(a))
      : Array.from(LCC_AIRLINES);

    const tasks: Promise<FlightOffer[]>[] = [];
    const sources: string[] = [];

    if (useAmadeus) {
      tasks.push(
        this.amadeus.searchFlights(params).catch((err) => {
          console.warn('[Search] Amadeus failed:', err.message);
          return [];
        })
      );
      sources.push('AMADEUS');
    }

    if (lccToScrape.length > 0) {
      tasks.push(
        this.scraper.search(params, lccToScrape).catch((err) => {
          console.warn('[Search] Scraper failed:', err.message);
          return [];
        })
      );
      sources.push(...lccToScrape);
    }

    const results = await Promise.all(tasks);
    const flights = results
      .flat()
      .sort((a, b) => a.priceIdr - b.priceIdr);

    // Background: simpan ke price_records (async, tidak block response)
    this.savePriceRecords(flights, params.date).catch(console.error);

    return {
      flights,
      sources,
      cached: false,
      fetchedAt: new Date().toISOString(),
    };
  }

  private async savePriceRecords(flights: FlightOffer[], dateStr: string) {
    const date = new Date(dateStr);
    for (const f of flights) {
      try {
        await this.prisma.priceRecord.upsert({
          where: {
            // Upsert berdasarkan kombinasi unik (simplified — pakai create jika tidak ada)
            id: `${f.source}-${f.flightNumber}-${dateStr}`,
          },
          update: {
            priceIdr: BigInt(f.priceIdr),
            scrapedAt: new Date(),
          },
          create: {
            id: `${f.source}-${f.flightNumber}-${dateStr}`,
            source: f.source,
            origin: f.origin,
            destination: f.destination,
            date,
            airlineCode: f.airline.code,
            flightNumber: f.flightNumber,
            cabinClass: f.cabinClass,
            departureAt: new Date(f.departureAt),
            arrivalAt: new Date(f.arrivalAt),
            durationMin: f.durationMinutes,
            stops: f.stops,
            priceIdr: BigInt(f.priceIdr),
            baggage: f.baggage,
            bookingUrl: f.bookingUrl,
          },
        });
      } catch {
        // Ignore upsert errors (duplicate key etc.)
      }
    }
  }
}
