import { snapshotQueue } from '../queues/index.js';

/**
 * Scaffold for vault PnL recalculations.
 * 
 * Invoked by the trade/deposit/withdraw listeners to update the aggregated metrics of the vault.
 */
export async function updateVaultMetrics(vaultAddress: string) {
    console.log(`[PnLProcessor] Queuing PnL recalculations for Vault ${vaultAddress}...`);

    try {
        await snapshotQueue.add('trigger-snapshot', {
            vaultAddress
        });

        console.log(`[PnLProcessor] Successfully queued metric recalculation for Vault ${vaultAddress}.`);
        return true;
    } catch (err) {
        console.error(`[PnLProcessor] Failed to queue metrics for Vault ${vaultAddress}:`, err);
        return false;
    }
}
