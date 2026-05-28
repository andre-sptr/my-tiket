import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';

import { prismaPlugin } from './plugins/prisma';
import { redisPlugin } from './plugins/redis';
import { flightsRouter } from './routes/flights';
import { alertsRouter } from './routes/alerts';
import { pushRouter } from './routes/push';
import { startAlertWorker } from './workers/alertWorker';

const log = Fastify({
  logger: {
    transport: process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
});

async function bootstrap() {
  // Plugins
  await log.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  await log.register(helmet, { contentSecurityPolicy: false });
  await log.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });
  await log.register(prismaPlugin);
  await log.register(redisPlugin);

  // Routes
  await log.register(flightsRouter, { prefix: '/api' });
  await log.register(alertsRouter, { prefix: '/api' });
  await log.register(pushRouter, { prefix: '/api' });

  // Health check
  log.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }));

  // Start BullMQ worker
  startAlertWorker();

  const port = Number(process.env.PORT || 4000);
  await log.listen({ port, host: '0.0.0.0' });
  log.log.info(`Backend running on http://0.0.0.0:${port}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
