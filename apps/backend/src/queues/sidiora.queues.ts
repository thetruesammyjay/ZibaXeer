import { Queue } from 'bullmq';
import redisConnection from '../config/redis';

export const sidioraMirrorSignalQueue = new Queue('SidioraMirrorSignalQueue', {
    connection: redisConnection as any,
});

export const sidioraMirrorResultQueue = new Queue('SidioraMirrorResultQueue', {
    connection: redisConnection as any,
});

export const sidioraRiskAlertQueue = new Queue('SidioraRiskAlertQueue', {
    connection: redisConnection as any,
});
