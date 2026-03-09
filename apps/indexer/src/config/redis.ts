import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Shared ioredis connection used by all BullMQ Queue producers in the Indexer.
 * Must point to the same Redis instance as apps/backend.
 */
const redis = new Redis(process.env.REDIS_URL ?? 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: null, // Required by BullMQ
});

redis.on('error', (err) => console.error('[Redis] Connection error:', err));
redis.on('connect', () => console.log('[Redis] ✅ Connected to Redis'));

export default redis;
