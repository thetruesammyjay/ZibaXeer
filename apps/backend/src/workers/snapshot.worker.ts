import { Worker, Job } from 'bullmq';
import { SnapshotJobPayload } from '@zibaxeer/types';
import redisConnection from '../config/redis';
import { prisma } from '@zibaxeer/db';

/**
 * Background worker that recalculates TVL, Drawdown, and ROI metrics for all active
 * Vaults. This data provides the core analytics time-series charting in the Frontend.
 */
export const snapshotWorker = new Worker('SnapshotCalculationQueue', async (job: Job<SnapshotJobPayload>) => {
    console.log(`[SnapshotWorker] Starting Vault metric recalculations...`);

    try {
        // 1. Fetch all ACTIVE vaults to calculate performance metadata
        const activeVaults = await prisma.vault.findMany({
            where: { status: 'ACTIVE' },
            include: { trades: true }
        });

        for (const vault of activeVaults) {
            const totalTrades = vault.trades.length;
            if (totalTrades === 0) continue; // Skip vaults with no execution history

            const profitableTrades = vault.trades.filter((t: any) => t.isProfit).length;

            // Calculate a very basic mock ROI directly correlated to win-rate and frequency
            // Real-world logic would recalculate based on the precise basis-points of `amountIn` Vs `amountOut`
            const winRatePercent = (profitableTrades / totalTrades) * 100;
            const baseRoi = (winRatePercent - 50) / 2; // Rough formula mapping > 50% wr to positive ROI

            // Example Drawdown: If ROI is negative, cast it as drawdown. 
            const currentDrawdown = baseRoi < 0 ? Math.abs(baseRoi) : 0;

            // Ensure historical max-drawdown is never lowered
            const maxDrawdown = Math.max(vault.drawdown, currentDrawdown);

            // Update Vault Entity in PostgreSQL with the new metrics
            await prisma.vault.update({
                where: { id: vault.id },
                data: {
                    roi: Number(baseRoi.toFixed(2)),
                    drawdown: Number(maxDrawdown.toFixed(2))
                }
            });
        }

        console.log(`[SnapshotWorker] Successfully recalculated performance metrics for ${activeVaults.length} vaults.`);
    } catch (error) {
        console.error(`[SnapshotWorker] Failed to recalculate snapshots:`, error);
        throw error;
    }
}, {
    connection: redisConnection as any,
    concurrency: 1 // Snapshots are heavy aggregations, run them sequentially
});

snapshotWorker.on('failed', (job, err) => {
    console.error(`[SnapshotWorker] Job ${job?.id} failed with error: ${err.message}`);
});
