import { SidioraMirrorSignalPayload } from '@zibaxeer/types';
import { processSidioraLeaderSignal } from '../processors/sidiora.processor.js';

/**
 * Stub listener bridge for Sidiora leader signals.
 *
 * Phase 1 behavior:
 * - Supports bootstrapping a test signal via env for integration testing.
 * - Real Sidiora websocket/sequencer subscription should call `processSidioraLeaderSignal`.
 */
export async function startSidioraSignalBridge() {
    const raw = process.env.SIDIORA_BOOTSTRAP_SIGNAL_JSON;

    if (!raw) {
        console.log('[SidioraListener] No bootstrap signal configured; bridge idle.');
        return;
    }

    try {
        const payload = JSON.parse(raw) as SidioraMirrorSignalPayload;
        const ok = await processSidioraLeaderSignal(payload);

        if (ok) {
            console.log(`[SidioraListener] Bootstrap Sidiora signal queued for traceId=${payload.traceId}`);
        }
    } catch (error) {
        console.error('[SidioraListener] Failed to parse or queue SIDIORA_BOOTSTRAP_SIGNAL_JSON:', error);
    }
}
