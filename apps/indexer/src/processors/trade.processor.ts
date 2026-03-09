import { tradeQueue, snapshotQueue } from '../queues/index.js';

/**
 * Invoked by vault.listener.ts when a TradeExecuted event is captured.
 * Pushes the executed block data into the Backend BullMQ queues for async database writing.
 */
export async function processTrade(
    vaultAddress: string,
    tradeHash: string,
    tokenIn: string,
    tokenOut: string,
    totalAmountSwapped: string,
    isProfit: boolean,
    pnlAmount: bigint,
    timestamp: number
) {
    console.log(`[TradeProcessor] Queuing Trade ${tradeHash} for Vault ${vaultAddress}...`);

    try {
        // Push the core execution to the Trade Processing Queue for follower aggregations
        await tradeQueue.add('process-trade', {
            txHash: tradeHash,
            vaultAddress,
            assetIn: tokenIn,
            assetOut: tokenOut,
            amountIn: totalAmountSwapped,
            amountOut: "0", // Handled by backend aggregation if needed
            isProfit,
            pnlAmount: pnlAmount.toString(),
            timestamp
        });

        // Trigger a vault metrics recalculation queue job
        await snapshotQueue.add('recalculate-snapshot', {
            vaultAddress
        });

        console.log(`[TradeProcessor] Trade ${tradeHash} successfully queued.`);
        return true;
    } catch (err) {
        console.error(`[TradeProcessor] Failed to queue trade ${tradeHash}:`, err);
        return false;
    }
}
