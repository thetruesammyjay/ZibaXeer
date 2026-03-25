import { SidioraMirrorSignalPayload } from '@zibaxeer/types';
import { sidioraMirrorSignalQueue } from '../queues/index.js';

/**
 * Queues a normalized Sidiora leader signal for backend mirror processing.
 */
export async function processSidioraLeaderSignal(payload: SidioraMirrorSignalPayload) {
    console.log(`[SidioraProcessor] Queuing Sidiora signal traceId=${payload.traceId} vault=${payload.vaultAddress}`);

    try {
        await sidioraMirrorSignalQueue.add('sidiora-leader-signal', payload, {
            jobId: payload.traceId,
            removeOnComplete: 500,
            removeOnFail: 1000,
        });

        return true;
    } catch (err) {
        console.error(`[SidioraProcessor] Failed to queue Sidiora signal traceId=${payload.traceId}:`, err);
        return false;
    }
}
