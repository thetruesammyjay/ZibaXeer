import { getVaultContract } from '../config/contracts';

/**
 * Dynamically listen to events for a specific vault Address
 */
export async function listenToVault(vaultAddress: string) {
    const vault = getVaultContract(vaultAddress);

    console.log(`[VaultListener] Subscribing to events on Vault: ${vaultAddress}...`);

    // Listen for Follower Deposits
    vault.on('FollowerSubscribed', async (follower: string, amount: bigint) => {
        console.log(`[FollowerSubscribed] Follower: ${follower} | Amount: ${amount.toString()}`);
        // TODO: Forward to processors 
    });

    // Listen for Follower Withdrawals
    vault.on('FollowerUnsubscribed', async (follower: string, amount: bigint) => {
        console.log(`[FollowerUnsubscribed] Follower: ${follower} | Amount: ${amount.toString()}`);
        // TODO: Forward to processors
    });

    // Listen to PnL Triggers and Settlements
    // Depending on the exact ABI mappings, the listener would catch Trade executions
    vault.on('TradeExecuted', async (tradeHash: string, isProfit: boolean, pnlAmount: bigint) => {
        console.log(`[TradeExecuted] Tx: ${tradeHash} | Profit: ${isProfit} | Amount: ${pnlAmount.toString()}`);
        // TODO: Trigger PnL recalculation via pnl.processor.ts
    });
}
