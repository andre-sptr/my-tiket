import { Queue, Worker, type Job } from 'bullmq';
import { Redis } from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { DuffelService } from '../services/duffel';
import { ScraperService } from '../services/scraper/index';
import { sendWhatsAppText } from '../services/waha';
import { formatIDR } from '../utils/format';
import { buildAlertSearchGroupKey, formatOptionalDate } from './alertSearch';

const QUEUE_NAME = 'price-checker';
// VPS resource-constrained: cek tiap 2 jam (sebelumnya 30 menit)
// Bisa di-override via env CHECK_INTERVAL_MIN
const CHECK_INTERVAL_MS =
  Number(process.env.CHECK_INTERVAL_MIN || 120) * 60 * 1000;

const LCC_CODES = ['JT', 'QG', 'QZ', 'IU'] as const;

let queue: Queue;

export function startAlertWorker() {
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null, // BullMQ requires this
  });

  const prisma = new PrismaClient();
  const duffelService = new DuffelService(redis);
  const scraperService = new ScraperService(redis);

  queue = new Queue(QUEUE_NAME, { connection: redis });

  // Repeatable job — idempotent
  queue.add(
    'check-all-alerts',
    {},
    {
      repeat: { every: CHECK_INTERVAL_MS },
      jobId: 'check-all-alerts-recurring',
    },
  );

  const worker = new Worker(
    QUEUE_NAME,
    async (job: Job) => {
      if (job.name !== 'check-all-alerts') return;

      console.log('[AlertWorker] Starting price check run...');

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Load alert aktif yang range tanggalnya masih relevan
      const alerts = await prisma.alert.findMany({
        where: {
          isActive: true,
          departureDateTo: { gte: today },
        },
      });

      console.log(`[AlertWorker] Checking ${alerts.length} active alerts`);

      // Group criteria that must share the same provider request.
      const groups = new Map<string, typeof alerts>();
      for (const alert of alerts) {
        const key = buildAlertSearchGroupKey(alert);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(alert);
      }

      for (const [, groupAlerts] of groups) {
        const representative = groupAlerts[0];
        const returnDate = formatOptionalDate(representative.returnDate);

        // Kumpulkan semua tanggal unik yang perlu dicek dari semua alert di grup
        const datesToCheck = new Set<string>();
        for (const a of groupAlerts) {
          for (const d of enumerateDates(a.departureDateFrom, a.departureDateTo, today)) {
            datesToCheck.add(d);
          }
        }

        // Untuk tiap tanggal, fetch harga dari Duffel + scraper, simpan ke priceMap
        // priceMap: tanggal → (airlineCode → lowestPrice)
        const priceMap = new Map<string, Map<string, number>>();

        for (const dateStr of datesToCheck) {
          await sleep(500 + Math.random() * 500); // sopan antar tanggal

          const datePrices = new Map<string, number>();

          // Duffel (full-service)
          try {
            const offers = await duffelService.searchFlights({
              origin: representative.origin,
              destination: representative.destination,
              date: dateStr,
              returnDate,
              adults: 1,
              cabin: representative.cabinClass,
            });
            for (const offer of offers) {
              const existing = datePrices.get(offer.airline.code);
              if (!existing || offer.priceIdr < existing) {
                datePrices.set(offer.airline.code, offer.priceIdr);
              }
            }
          } catch (err) {
            console.warn('[AlertWorker] Duffel fetch error:', (err as Error).message);
          }
          await sleep(300);

          // LCC scrapers belum mendukung return leg, jadi hanya dipakai untuk one-way.
          if (!returnDate) {
            for (const code of LCC_CODES) {
              try {
                const price = await scraperService.getLatestPrice(
                  code,
                  representative.origin,
                  representative.destination,
                  dateStr,
                );
                if (price) datePrices.set(code, price);
              } catch {
                // skip per-airline scraper failure
              }
              await sleep(2000); // sopan ke LCC site
            }
          }

          priceMap.set(dateStr, datePrices);
        }

        // Evaluasi tiap alert di grup
        for (const alert of groupAlerts) {
          let bestPrice: number | null = null;
          let bestDate: string | null = null;
          let bestAirline: string | null = null;

          for (const d of enumerateDates(alert.departureDateFrom, alert.departureDateTo, today)) {
            const datePrices = priceMap.get(d);
            if (!datePrices) continue;

            // Tentukan harga relevan untuk alert ini di tanggal d
            let candidate: { code: string; price: number } | null = null;
            if (alert.airlineCode) {
              const p = datePrices.get(alert.airlineCode);
              if (p !== undefined) candidate = { code: alert.airlineCode, price: p };
            } else {
              // Semua maskapai → ambil minimum
              for (const [code, p] of datePrices) {
                if (!candidate || p < candidate.price) candidate = { code, price: p };
              }
            }

            if (candidate && (bestPrice === null || candidate.price < bestPrice)) {
              bestPrice = candidate.price;
              bestDate = d;
              bestAirline = candidate.code;
            }
          }

          // Update last seen
          if (bestPrice !== null) {
            await prisma.alert.update({
              where: { id: alert.id },
              data: {
                lastCheckedAt: new Date(),
                lastPriceSeen: BigInt(bestPrice),
              },
            });
          } else {
            await prisma.alert.update({
              where: { id: alert.id },
              data: { lastCheckedAt: new Date() },
            });
          }

          // Cek threshold
          if (
            bestPrice !== null &&
            bestDate &&
            bestAirline &&
            bestPrice <= Number(alert.maxPriceIdr)
          ) {
            console.log(
              `[AlertWorker] Alert ${alert.id} TRIGGERED — ${bestAirline} ${bestDate} ${bestPrice} ≤ ${alert.maxPriceIdr}`,
            );
            await triggerAlert(prisma, alert, bestAirline, bestDate, bestPrice);
          }
        }
      }

      console.log('[AlertWorker] Price check run complete.');
    },
    {
      connection: redis,
      concurrency: 1,
    },
  );

  worker.on('error', (err) => console.error('[AlertWorker] Worker error:', err));
  worker.on('failed', (job, err) =>
    console.error(`[AlertWorker] Job ${job?.id} failed:`, err),
  );

  console.log(`✅ Alert worker started (checks every ${CHECK_INTERVAL_MS / 60000} min)`);
}

async function triggerAlert(
  prisma: PrismaClient,
  alert: any,
  airlineCode: string,
  dateStr: string,
  price: number,
) {
  const dateObj = new Date(dateStr);
  const returnDate = formatOptionalDate(alert.returnDate);
  const returnDateLine = returnDate
    ? `Pulang: *${formatDate(new Date(returnDate))}*\n`
    : '';
  const searchQuery = [
    airlineCode,
    'flights',
    alert.origin,
    alert.destination,
    dateStr,
    returnDate,
  ].filter(Boolean).join('+');
  const text =
    `🎫 *Harga Tiket Turun!*\n\n` +
    `${alert.origin} → ${alert.destination}\n` +
    `Maskapai: *${airlineCode}*\n` +
    `Tanggal pergi: *${formatDate(dateObj)}*\n` +
    returnDateLine +
    `Harga: *${formatIDR(price)}*\n` +
    `Target Anda: ${formatIDR(Number(alert.maxPriceIdr))}\n\n` +
    `Cek sekarang: https://www.google.com/travel/flights?q=${searchQuery}\n\n` +
    `Alert ini akan otomatis nonaktif. Set lagi kalau perlu pantau ulang.`;

  const sent = await sendWhatsAppText(alert.phoneNumber, text);

  await prisma.notificationLog.create({
    data: {
      alertId: alert.id,
      source: mapSource(airlineCode),
      priceTriggered: BigInt(price),
      flightNumber: null,
      success: sent,
      errorMessage: sent ? null : 'WAHA send failed',
    },
  });

  await prisma.alert.update({
    where: { id: alert.id },
    data: {
      isActive: false,
      triggeredAt: new Date(),
      matchedDate: dateObj,
    },
  });
}

/** Iterate semua tanggal di [from, to] sebagai YYYY-MM-DD, mulai dari max(from, today). */
function* enumerateDates(from: Date, to: Date, today: Date): Generator<string> {
  const start = from < today ? today : from;
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  while (cur <= end) {
    yield cur.toISOString().split('T')[0];
    cur.setDate(cur.getDate() + 1);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function mapSource(code: string): 'DUFFEL' | 'LIONAIR' | 'CITILINK' | 'AIRASIA' | 'SUPERAIRJET' {
  const map: Record<string, any> = {
    JT: 'LIONAIR',
    QG: 'CITILINK',
    QZ: 'AIRASIA',
    IU: 'SUPERAIRJET',
  };
  return map[code] || 'DUFFEL';
}
