import { Queue, Worker, type Job } from 'bullmq';
import { Redis } from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { AmadeusService } from '../services/amadeus';
import { ScraperService } from '../services/scraper/index';
import { sendPushNotification } from '../services/webpush';
import { formatIDR } from '../utils/format';

const QUEUE_NAME = 'price-checker';
const CHECK_INTERVAL_MS = 30 * 60 * 1000; // 30 menit

let queue: Queue;

export function startAlertWorker() {
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null, // BullMQ requires this
  });

  const prisma = new PrismaClient();
  const amadeusService = new AmadeusService(redis);
  const scraperService = new ScraperService(redis);

  queue = new Queue(QUEUE_NAME, { connection: redis });

  // Tambahkan repeatable job (idempotent — hanya 1 job aktif)
  queue.add('check-all-alerts', {}, {
    repeat: { every: CHECK_INTERVAL_MS },
    jobId: 'check-all-alerts-recurring',
  });

  const worker = new Worker(QUEUE_NAME, async (job: Job) => {
    if (job.name !== 'check-all-alerts') return;

    console.log('[AlertWorker] Starting price check run...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Load semua alert aktif yang departure_date >= hari ini
    const alerts = await prisma.alert.findMany({
      where: {
        isActive: true,
        departureDate: { gte: today },
      },
    });

    console.log(`[AlertWorker] Checking ${alerts.length} active alerts`);

    // Group by origin+destination+date untuk batching
    const groups = new Map<string, typeof alerts>();
    for (const alert of alerts) {
      const key = `${alert.origin}:${alert.destination}:${alert.departureDate.toISOString().split('T')[0]}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(alert);
    }

    for (const [, groupAlerts] of groups) {
      const representative = groupAlerts[0];
      const dateStr = representative.departureDate.toISOString().split('T')[0];

      // Delay sopan antar grup (scraper tidak ditimpa)
      await sleep(500 + Math.random() * 500);

      // Tentukan sumber per maskapai di grup ini
      const airlineCodes = [...new Set(groupAlerts.map((a) => a.airlineCode).filter(Boolean) as string[])];
      const lccCodes = airlineCodes.filter((c) => ['JT', 'QG', 'QZ', 'IU'].includes(c));
      const gdsAirlines = airlineCodes.filter((c) => !['JT', 'QG', 'QZ', 'IU'].includes(c));

      // Fetch current prices
      const currentPrices = new Map<string, number>(); // airlineCode → lowestPrice

      // Amadeus (full-service)
      if (gdsAirlines.length > 0 || airlineCodes.length === 0) {
        try {
          const offers = await amadeusService.searchFlights({
            origin: representative.origin,
            destination: representative.destination,
            date: dateStr,
            adults: 1,
            cabin: representative.cabinClass,
          });
          for (const offer of offers) {
            const existing = currentPrices.get(offer.airline.code);
            if (!existing || offer.priceIdr < existing) {
              currentPrices.set(offer.airline.code, offer.priceIdr);
            }
          }
        } catch (err) {
          console.warn('[AlertWorker] Amadeus fetch error:', (err as Error).message);
        }
        await sleep(200); // rate limiting Amadeus
      }

      // LCC scrapers
      for (const code of lccCodes) {
        try {
          const price = await scraperService.getLatestPrice(
            code, representative.origin, representative.destination, dateStr
          );
          if (price) currentPrices.set(code, price);
        } catch {
          // ignore scraper failure per airline
        }
        await sleep(2000); // sopan ke LCC site
      }

      // Cek setiap alert dalam grup
      for (const alert of groupAlerts) {
        // Tentukan harga yang relevan untuk alert ini
        let currentPrice: number | null = null;

        if (alert.airlineCode) {
          currentPrice = currentPrices.get(alert.airlineCode) ?? null;
        } else {
          // semua maskapai — ambil minimum
          const allPrices = Array.from(currentPrices.values());
          currentPrice = allPrices.length > 0 ? Math.min(...allPrices) : null;
        }

        // Update last seen
        if (currentPrice !== null) {
          await prisma.alert.update({
            where: { id: alert.id },
            data: {
              lastCheckedAt: new Date(),
              lastPriceSeen: BigInt(currentPrice),
            },
          });
        }

        // Cek threshold
        if (currentPrice !== null && currentPrice <= Number(alert.thresholdPrice)) {
          console.log(`[AlertWorker] Alert ${alert.id} triggered! ${currentPrice} ≤ ${alert.thresholdPrice}`);
          await triggerAlert(prisma, alert, currentPrice);
        }
      }
    }

    console.log('[AlertWorker] Price check run complete.');
  }, {
    connection: redis,
    concurrency: 1,
  });

  worker.on('error', (err) => console.error('[AlertWorker] Worker error:', err));
  worker.on('failed', (job, err) => console.error(`[AlertWorker] Job ${job?.id} failed:`, err));

  console.log('✅ Alert worker started (checks every 30 min)');
}

async function triggerAlert(prisma: PrismaClient, alert: any, price: number) {
  const sub = alert.pushSubscription as any;

  const payload = {
    title: '🎫 Harga Tiket Turun!',
    body: `${alert.airlineCode || 'Tiket'} ${alert.origin}→${alert.destination} ${formatDate(alert.departureDate)}: ${formatIDR(price)}`,
    url: `/search?origin=${alert.origin}&destination=${alert.destination}&date=${alert.departureDate.toISOString().split('T')[0]}&adults=1&cabin=${alert.cabinClass}`,
    alertId: alert.id,
  };

  let success = false;
  try {
    success = await sendPushNotification(sub as webpush.PushSubscription, payload);
  } catch {
    success = false;
  }

  // Log notification
  await prisma.notificationLog.create({
    data: {
      alertId: alert.id,
      source: alert.airlineCode ? mapSource(alert.airlineCode) : 'AMADEUS',
      priceTriggered: BigInt(price),
      success,
    },
  });

  // Deactivate alert
  await prisma.alert.update({
    where: { id: alert.id },
    data: { isActive: false, triggeredAt: new Date() },
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function mapSource(code: string): 'AMADEUS' | 'LIONAIR' | 'CITILINK' | 'AIRASIA' | 'SUPERAIRJET' {
  const map: Record<string, any> = { JT: 'LIONAIR', QG: 'CITILINK', QZ: 'AIRASIA', IU: 'SUPERAIRJET' };
  return map[code] || 'AMADEUS';
}

// dummy import untuk webpush (resolved di runtime)
import webpush from 'web-push';
