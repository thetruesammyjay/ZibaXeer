import { tradeQueue, snapshotQueue } from '../queues/index.js';
import { TradeJobPayload } from '@zibaxeer/types';

/**
 * Invoked by vault.listener.ts when a TradeExecuted event is captured.
 * Maps on-chain event params to the TradeJobPayload shape and enqueues
 * for async persistence by the backend TradeWorker.
 *
 * ABI: TradeExecuted(address indexed tokenIn, address indexed tokenOut, uint256 totalAmountSwapped)
 */
export async function processTrade(
    vaultAddress: string,
    tokenIn: string,
    tokenOut: string,
    totalAmountSwapped: bigint,
    txHash: string,
    timestamp: number
) {
    console.log(`[TradeProcessor] Queuing trade ${txHash} for Vault ${vaultAddress}...`);

    try {
        await tradeQueue.add('process-trade', {
            txHash,
            vaultAddress,
            assetIn: tokenIn,
            assetOut: tokenOut,
            amountIn: totalAmountSwapped.toString(), // Amount sold into the swap
            amountOut: '0',                          // Not emitted — resolved by backend if needed
            isProfit: false,                         // Determined later via ProfitSettled event
            pnlAmount: '0',                          // Determined later via ProfitSettled event
            timestamp,
        } as TradeJobPayload);

        // Trigger vault snapshot recalculation after every trade
        await snapshotQueue.add('recalculate-snapshot', { vaultAddress });

        console.log(`[TradeProcessor] Trade ${txHash} successfully queued.`);
        return true;
    } catch (err) {
        console.error(`[TradeProcessor] Failed to queue trade ${txHash}:`, err);
        return false;
    }
}
