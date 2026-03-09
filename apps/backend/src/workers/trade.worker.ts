import { Worker, Job } from 'bullmq';
import { TradeJobPayload } from '@zibaxeer/types';
import redisConnection from '../config/redis';
import { prisma } from '@zibaxeer/db';

/**
 * Background worker that processes trade events emitted by the on-chain Indexer.
 * Inserts the trade into the Postgres Database and subsequently triggers
 * asynchronous follower balance updates.
 */
export const tradeWorker = new Worker('TradeProcessingQueue', async (job: Job<TradeJobPayload>) => {
    console.log(`[TradeWorker] Processing new trade execution: ${job.data.txHash}`);

    try {
        const { txHash, vaultAddress, assetIn, assetOut, amountIn, amountOut, isProfit, pnlAmount, timestamp } = job.data;

        // 1. Resolve Vault ID from the Contract Address
        const vault = await prisma.vault.findUnique({
            where: { contractAddress: vaultAddress },
        });

        if (!vault) {
            throw new Error(`Vault not found for address: ${vaultAddress}. Cannot register trade.`);
        }

        // 2. Persist Trade history to PostgreSQL
        const trade = await prisma.trade.create({
            data: {
                txHash,
                vaultId: vault.id,
                assetIn,
                assetOut,
                amountIn,
                amountOut,
                isProfit,
                pnlAmount,
                executedAt: new Date(timestamp * 1000), // Convert UNIX seconds to JS Date
            }
        });

        console.log(`[TradeWorker] Successfully recorded Trade ${trade.id} for Vault ${vault.name}`);

        // TODO: Sub-routines to calculate follower distribution (Revenue Splitter Logic off-chain mapping)
        // could be dispatched here based on `follower` subscriptions.

    } catch (error) {
        console.error(`[TradeWorker] Failed to process trade job ${job.id}:`, error);
        throw error; // Let BullMQ retry
    }
}, {
    connection: redisConnection as any,
    concurrency: 5 // Process up to 5 parallel swaps simultaneously
});

tradeWorker.on('completed', (job) => {
    console.log(`[TradeWorker] Job ${job.id} completed successfully`);
});

tradeWorker.on('failed', (job, err) => {
    console.error(`[TradeWorker] Job ${job?.id} failed with error: ${err.message}`);
});
