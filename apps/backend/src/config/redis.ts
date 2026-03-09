import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Ensure there is a fallback default local Redis port if env goes missing
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const redisConnection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
});

redisConnection.on('error', (err) => {
    console.error('[Redis Core] Connection error:', err);
});

export default redisConnection;
