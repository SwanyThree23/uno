// src/index.ts
// SeeWhy LIVE API Server — Express + Socket.io + Redis Adapter

import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';
import { redis } from './lib/redis.js';
import { verifyAccessToken } from './lib/jwt.js';
import { apiLimiter } from './middleware/rateLimiter.js';

// Routes
import authRoutes         from './routes/auth.js';
import userRoutes         from './routes/users.js';
import stageRoutes        from './routes/stages.js';
import paymentRoutes      from './routes/payments.js';
import subscriptionRoutes from './routes/subscriptions.js';
import streamKeyRoutes    from './routes/streamKeys.js';
import analyticsRoutes    from './routes/analytics.js';
import marketplaceRoutes  from './routes/marketplace.js';

// Socket handlers
import { registerChatHandler     } from './sockets/chatHandler.js';
import { registerPresenceHandler } from './sockets/presenceHandler.js';
import { registerStreamHandler   } from './sockets/streamHandler.js';

// ─── EXPRESS APP ─────────────────────────────────────────────────────────────

const app    = express();
const server = createServer(app);

// Security headers
app.use(helmet({
  contentSecurityPolicy: process.env.HELMET_CSP === 'true' ? undefined : false,
  crossOriginEmbedderPolicy: false, // Required for WebRTC
}));

// CORS — whitelist from env
app.use(cors({
  origin:      process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || 'http://localhost:3000',
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// Raw body for Stripe webhook verification (MUST be before express.json)
app.use('/api/payments/webhook',      express.raw({ type: 'application/json' }));
app.use('/api/subscriptions/webhook', express.raw({ type: 'application/json' }));

// JSON body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global API rate limit
app.use('/api', apiLimiter);

// ─── ROUTES ──────────────────────────────────────────────────────────────────

app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/stages',        stageRoutes);
app.use('/api/payments',      paymentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/stream-keys',   streamKeyRoutes);
app.use('/api/analytics',     analyticsRoutes);
app.use('/api/marketplace',   marketplaceRoutes);

// Health check
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    res.json({
      status:   'ok',
      db:       'ok',
      redis:    'ok',
      version:  '1.0.0',
      env:      process.env.NODE_ENV,
    });
  } catch (err) {
    logger.error({ err }, 'Health check failed');
    res.status(503).json({ status: 'error', error: String(err) });
  }
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal Server Error' });
});

// ─── SOCKET.IO ───────────────────────────────────────────────────────────────

const pubClient = redis;
const subClient = createClient({ host: new URL(process.env.REDIS_URL || 'redis://localhost:6379').hostname });

const io = new SocketServer(server, {
  cors: {
    origin:      process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Redis adapter for horizontal scaling
io.adapter(createAdapter(pubClient as unknown as ReturnType<typeof createClient>, subClient));

// Socket authentication middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token as string | undefined;
  const stageId = socket.handshake.query.stageId as string;

  if (!stageId) {
    next(new Error('stageId required'));
    return;
  }

  socket.data.stageId = stageId;

  if (token) {
    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      socket.data.role   = payload.role;
    } catch {
      socket.data.userId = null; // allow anonymous viewers
    }
  } else {
    socket.data.userId = null;
  }

  next();
});

io.on('connection', (socket) => {
  const { stageId, userId } = socket.data as { stageId: string; userId: string | null };
  logger.debug({ socketId: socket.id, stageId, userId }, 'Socket connected');

  registerChatHandler(io, socket);
  registerPresenceHandler(io, socket);
  registerStreamHandler(io, socket);
});

// ─── SERVER START ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV }, '🚀 SeeWhy LIVE API server started');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received — shutting down gracefully');
  server.close(async () => {
    await prisma.$disconnect();
    await redis.quit();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received — shutting down gracefully');
  server.close(async () => {
    await prisma.$disconnect();
    await redis.quit();
    process.exit(0);
  });
});

export { app, server, io };
