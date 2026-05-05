"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../utils/logger");
const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');
const redisConfig = {
    host: REDIS_HOST,
    port: REDIS_PORT,
    retryStrategy: (times) => {
        // Slow retry: start at 2s, max 10s
        const delay = Math.min(times * 1000, 10000);
        return delay;
    },
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    showFriendlyErrorStack: false,
};
const redis = new ioredis_1.default(redisConfig);
redis.on('connect', () => {
    (0, logger_1.log)('backend', 'info', 'config', `Redis connected to ${REDIS_HOST}:${REDIS_PORT}`);
});
let errorCount = 0;
redis.on('error', (err) => {
    errorCount++;
    if (errorCount === 1) {
        (0, logger_1.log)('backend', 'error', 'config', 'Redis is DOWN. Please start Redis or use Docker.');
    }
    else if (errorCount % 20 === 0) {
        (0, logger_1.log)('backend', 'error', 'config', 'Redis still unreachable... (Throttled logs)');
    }
});
redis.on('reconnecting', () => {
    (0, logger_1.log)('backend', 'warn', 'config', 'Redis reconnecting...');
});
exports.default = redis;
