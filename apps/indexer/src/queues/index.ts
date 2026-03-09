import { Queue } from 'bullmq';
import redis from '../config/redis.js';

export const tradeQueue = new Queue('TradeProcessingQueue', { connection: redis as any });
export const snapshotQueue = new Queue('SnapshotCalculationQueue', { connection: redis as any });
export const vaultDeployedQueue = new Queue('VaultDeployedQueue', { connection: redis as any });
export const followerEventQueue = new Queue('FollowerEventQueue', { connection: redis as any });
