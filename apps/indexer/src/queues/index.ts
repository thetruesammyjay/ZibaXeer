import { Queue } from 'bullmq';
import redis from '../config/redis.js';

export const tradeQueue = new Queue('TradeProcessingQueue', { connection: redis });
export const snapshotQueue = new Queue('SnapshotCalculationQueue', { connection: redis });
export const vaultDeployedQueue = new Queue('VaultDeployedQueue', { connection: redis });
export const followerEventQueue = new Queue('FollowerEventQueue', { connection: redis });
