import Redis from 'ioredis';
import { logger } from './logger.js';

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redis.on('error', (err) => {
  logger.error('Redis error:', err);
});

redis.once('connect', () => {
  logger.info('Connected to Redis');
});
