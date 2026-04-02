import { createClient } from 'ioredis';
import { logger } from './logger.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IORedisCls = (createClient as any).__esModule
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ? require('ioredis').default
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  : require('ioredis');

// Use dynamic require to handle ESM/CJS interop for ioredis
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Redis = require('ioredis');
const RedisClass = Redis.default ?? Redis;

export const redis: ReturnType<typeof createClient> = new RedisClass(
  process.env.REDIS_URL || 'redis://localhost:6379'
) as ReturnType<typeof createClient>;

(redis as unknown as { on: (e: string, fn: (err: Error) => void) => void })
  .on('error', (err: Error) => logger.error({ err }, 'Redis error'));

(redis as unknown as { once: (e: string, fn: () => void) => void })
  .once('connect', () => logger.info('Connected to Redis'));
