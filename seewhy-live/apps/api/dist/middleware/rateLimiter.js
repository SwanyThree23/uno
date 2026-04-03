// src/middleware/rateLimiter.ts
// Redis-backed rate limiting for API endpoints
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../lib/redis.js';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sendCommand = (...args) => redis.call(...args);
function makeStore(prefix) {
    return new RedisStore({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sendCommand: sendCommand,
        prefix,
    });
}
export const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please slow down.' },
    store: makeStore('rl:api:'),
});
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many auth attempts, please try again later.' },
    store: makeStore('rl:auth:'),
});
export const paymentLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Payment rate limit exceeded.' },
    store: makeStore('rl:payment:'),
});
export const streamLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Stream event rate limit exceeded.' },
    store: makeStore('rl:stream:'),
});
