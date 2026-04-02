// src/middleware/rateLimiter.ts
// Redis-backed rate limiting for API endpoints

import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../lib/redis.js';

const sendCommand = (command: string, ...args: string[]) =>
  redis.call(command, ...args) as Promise<unknown>;

/**
 * General API rate limit: 100 requests per minute per IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
  store: new RedisStore({
    sendCommand,
    prefix: 'rl:api:',
  }),
});

/**
 * Auth endpoint rate limit: 10 requests per 15 minutes per IP.
 * Prevents brute-force login attacks.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts, please try again later.' },
  store: new RedisStore({
    sendCommand,
    prefix: 'rl:auth:',
  }),
});

/**
 * Payment endpoint rate limit: 20 requests per minute per IP.
 */
export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Payment rate limit exceeded.' },
  store: new RedisStore({
    sendCommand,
    prefix: 'rl:payment:',
  }),
});

/**
 * Stream event rate limit: 30 per minute.
 */
export const streamLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Stream event rate limit exceeded.' },
  store: new RedisStore({
    sendCommand,
    prefix: 'rl:stream:',
  }),
});
