import { getVaultContract } from '../config/contracts.js';
import { followerEventQueue } from '../queues/index.js';
import { processTrade } from '../processors/trade.processor.js';

/**
 * Dynamically listen to events for a specific vault Address
 */
export async function listenToVault(vaultAddress: string) {
    const vault = getVaultContract(vaultAddress);

    console.log(`[VaultListener] Subscribing to events on Vault: ${vaultAddress}...`);

    // Listen for Follower Deposits
    vault.on('FollowerSubscribed', async (follower: string, amount: bigint) => {
        console.log(`[FollowerSubscribed] Follower: ${follower} | Amount: ${amount.toString()}`);
        await followerEventQueue.add('follower-subscribed', {
            vaultAddress,
            followerAddress: follower,
            amount: amount.toString(),
            action: 'DEPOSIT'
        });
    });

    // Listen for Follower Withdrawals
    vault.on('FollowerUnsubscribed', async (follower: string, amount: bigint) => {
        console.log(`[FollowerUnsubscribed] Follower: ${follower} | Amount: ${amount.toString()}`);
        await followerEventQueue.add('follower-unsubscribed', {
            vaultAddress,
            followerAddress: follower,
            amount: amount.toString(),
            action: 'WITHDRAW'
        });
    });

    vault.on('TradeExecuted', async (
        tradeHash: string,
        tokenIn: string,
        tokenOut: string,
        totalAmountSwapped: string,
        isProfit: boolean,
        pnlAmount: bigint,
        event: any
    ) => {
        console.log(`[TradeExecuted] Tx: ${tradeHash} | Swap Amount: ${totalAmountSwapped.toString()}`);

        // Forward the actual execution onto the TradeProcessor containing our Queue logic
        const timestamp = (await event.getBlock()).timestamp;
        await processTrade(
            vaultAddress,
            tradeHash,
            tokenIn,
            tokenOut,
            totalAmountSwapped.toString(),
            isProfit,
            pnlAmount,
            timestamp
        );
    });
}
