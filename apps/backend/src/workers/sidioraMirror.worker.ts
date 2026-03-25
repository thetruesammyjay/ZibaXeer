import { Job, Worker } from 'bullmq';
import redisConnection from '../config/redis';
import {
    SidioraMirrorExecutionResultPayload,
    SidioraMirrorSignalPayload,
    SidioraRiskAlertPayload,
} from '@zibaxeer/types';
import { sidioraMirrorResultQueue, sidioraRiskAlertQueue } from '../queues/sidiora.queues';
import { evaluateSidioraSignalPolicy } from '../services/sidioraMirror.service';
import { getSidioraPolicy } from '../services/sidioraPolicy.service';
import { recordSidioraDuplicateTrace, recordSidioraMirrorDecision } from '../services/sidioraAudit.service';

const IDEMPOTENCY_TTL_SECONDS = 60 * 60 * 24;

function idempotencyKey(traceId: string) {
    return `sidiora:mirror:trace:${traceId}`;
}

export const sidioraMirrorWorker = new Worker(
    'SidioraMirrorSignalQueue',
    async (job: Job<SidioraMirrorSignalPayload>) => {
        const { traceId } = job.data;
        console.log(`[SidioraMirrorWorker] Processing traceId=${traceId}`);

        const key = idempotencyKey(traceId);
        const wasSet = await redisConnection.set(key, '1', 'EX', IDEMPOTENCY_TTL_SECONDS, 'NX');

        if (wasSet !== 'OK') {
            await recordSidioraDuplicateTrace(traceId);

            const duplicateResult: SidioraMirrorExecutionResultPayload = {
                version: '1.0',
                eventType: 'MIRROR_EXECUTION_RESULT',
                traceId,
                vaultAddress: job.data.vaultAddress,
                leaderAddress: job.data.leaderAddress,
                followerAddress: 'MULTI',
                sidioraAccount: 'N/A',
                status: 'DUPLICATE_IGNORED',
                reason: 'TRACE_ID_ALREADY_PROCESSED',
                riskSnapshot: {
                    effectiveLeverage: '0',
                    healthFactor: '0',
                    portfolioNotionalRatio: '0',
                },
                sequencerRequestId: `dup-${traceId}`,
                timestamp: Math.floor(Date.now() / 1000),
            };

            await sidioraMirrorResultQueue.add('sidiora-mirror-duplicate', duplicateResult);
            console.log(`[SidioraMirrorWorker] Duplicate traceId ignored: ${traceId}`);
            return;
        }

        const policy = getSidioraPolicy();
        const decision = evaluateSidioraSignalPolicy(job.data, policy);

        const status = decision.accepted ? 'ACCEPTED' : 'REJECTED_POLICY';
        const result: SidioraMirrorExecutionResultPayload = {
            version: '1.0',
            eventType: 'MIRROR_EXECUTION_RESULT',
            traceId,
            vaultAddress: job.data.vaultAddress,
            leaderAddress: job.data.leaderAddress,
            followerAddress: 'MULTI',
            sidioraAccount: 'N/A',
            status,
            reason: decision.reason,
            riskSnapshot: decision.riskSnapshot,
            sequencerRequestId: `stub-${traceId}`,
            timestamp: Math.floor(Date.now() / 1000),
        };

        await recordSidioraMirrorDecision(job.data, result, policy.version);

        await sidioraMirrorResultQueue.add('sidiora-mirror-result', result);

        if (!decision.accepted) {
            const alert: SidioraRiskAlertPayload = {
                traceId,
                vaultAddress: job.data.vaultAddress,
                leaderAddress: job.data.leaderAddress,
                severity: 'HIGH',
                reason: decision.reason ?? 'POLICY_REJECTION',
                createdAt: Math.floor(Date.now() / 1000),
            };

            await sidioraRiskAlertQueue.add('sidiora-risk-alert', alert);
        }
    },
    {
        connection: redisConnection as any,
        concurrency: 10,
    }
);

sidioraMirrorWorker.on('completed', (job) => {
    console.log(`[SidioraMirrorWorker] Job ${job.id} completed`);
});

sidioraMirrorWorker.on('failed', (job, err) => {
    console.error(`[SidioraMirrorWorker] Job ${job?.id} failed: ${err.message}`);
});
