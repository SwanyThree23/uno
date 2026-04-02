import Redis from 'ioredis';
import { logger } from './logger.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IORedisCls = (Redis as any).__esModule
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ? require('ioredis').default
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  : require('ioredis');

// Use dynamic require to handle ESM/CJS interop for ioredis
// eslint-disable-next-line @typescript-eslint/no-require-imports
const RedisModule = require('ioredis');
const RedisClass = RedisModule.default ?? RedisModule;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const redis: any = new RedisClass(
  process.env.REDIS_URL || 'redis://localhost:6379'
);

(redis as unknown as { on: (e: string, fn: (err: Error) => void) => void })
  .on('error', (err: Error) => logger.error({ err }, 'Redis error'));

(redis as unknown as { once: (e: string, fn: () => void) => void })
  .once('connect', () => logger.info('Connected to Redis'));
