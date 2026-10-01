import Redis from 'ioredis';
import { REDIS_URL } from '../config/env';
import { logger } from '../lib/logger';

const redis = new Redis(REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error({ err }, 'Redis error'));

export default redis;
