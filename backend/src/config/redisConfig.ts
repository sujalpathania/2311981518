import Redis from 'ioredis';
import { log } from '../utils/logger';

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');

const redisConfig = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  retryStrategy: (times: number) => {
    // Slow retry: start at 2s, max 10s
    const delay = Math.min(times * 1000, 10000);
    return delay;
  },
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  showFriendlyErrorStack: false,
  enableOfflineQueue: false, // DON'T HANG if Redis is down
  connectTimeout: 5000,
};

const redis = new Redis(redisConfig);

redis.on('connect', () => {
  log('backend', 'info', 'config', `Redis connected to ${REDIS_HOST}:${REDIS_PORT}`);
});

let errorCount = 0;
redis.on('error', (err) => {
  errorCount++;
  if (errorCount === 1) {
    log('backend', 'error', 'config', 'Redis is DOWN. Please start Redis or use Docker.');
  } else if (errorCount % 20 === 0) {
    log('backend', 'error', 'config', 'Redis still unreachable... (Throttled logs)');
  }
});

redis.on('reconnecting', () => {
  log('backend', 'warn', 'config', 'Redis reconnecting...');
});

export default redis;
