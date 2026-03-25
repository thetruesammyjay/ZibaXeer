import { Queue } from 'bullmq';
import redis from '../config/redis.js';

export const tradeQueue = new Queue('TradeProcessingQueue', { connection: redis as any });
export const snapshotQueue = new Queue('SnapshotCalculationQueue', { connection: redis as any });
export const vaultDeployedQueue = new Queue('VaultDeployedQueue', { connection: redis as any });
export const followerEventQueue = new Queue('FollowerEventQueue', { connection: redis as any });
export const sidioraMirrorSignalQueue = new Queue('SidioraMirrorSignalQueue', { connection: redis as any });
export const sidioraMirrorResultQueue = new Queue('SidioraMirrorResultQueue', { connection: redis as any });
export const sidioraRiskAlertQueue = new Queue('SidioraRiskAlertQueue', { connection: redis as any });
