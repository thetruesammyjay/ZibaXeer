import { Queue } from 'bullmq';
import redisConnection from './redis';

// Defines the queues that the Indexer or API will push jobs into

// Queue to handle sequential processing of Trade events from the blockchain
export const tradeQueue = new Queue('TradeProcessingQueue', {
    connection: redisConnection as any,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});

// Queue to handle cron-based snapshot calculation of vault performances
export const snapshotQueue = new Queue('SnapshotCalculationQueue', {
    connection: redisConnection as any,
    defaultJobOptions: {
        removeOnComplete: true,
    },
});
