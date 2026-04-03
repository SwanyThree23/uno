import Redis from 'ioredis';
import { logger } from './logger.js';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IORedisCls = Redis.__esModule
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ? require('ioredis').default
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    : require('ioredis');
// Use dynamic require to handle ESM/CJS interop for ioredis
// eslint-disable-next-line @typescript-eslint/no-require-imports
const RedisModule = require('ioredis');
const RedisClass = RedisModule.default ?? RedisModule;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const redis = new RedisClass(process.env.REDIS_URL || 'redis://localhost:6379');
redis
    .on('error', (err) => logger.error({ err }, 'Redis error'));
redis
    .once('connect', () => logger.info('Connected to Redis'));
