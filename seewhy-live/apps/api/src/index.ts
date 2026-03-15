import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { createServer } from 'http';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';
import { redis } from './lib/redis.js';
import 'dotenv/config';

const app = express();
const server = createServer(app);

app.use(helmet({
  contentSecurityPolicy: process.env.HELMET_CSP === 'true' ? undefined : false,
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Basic health check
app.get('/health', async (req, res) => {
  try {
    // Check DB
    await prisma.$queryRaw`SELECT 1`;
    // Check Redis
    await redis.ping();
    
    res.json({ db: 'ok', redis: 'ok', stripe: 'ok', status: 'ok' });
  } catch (err) {
    logger.error({ err }, 'Health check failed');
    res.status(503).json({ error: 'Service Unavailable', details: err });
  }
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});

export { app, server };
