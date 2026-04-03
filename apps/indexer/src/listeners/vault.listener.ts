import { getVaultContract } from '../config/contracts.js';
import { followerEventQueue } from '../queues/index.js';
import { processTrade } from '../processors/trade.processor.js';
import { updateVaultMetrics } from '../processors/pnl.processor.js';
import { FollowerPayload } from '@zibaxeer/types';

/** Stored so we can remove old listeners per-vault before re-attaching on reconnect. */
const vaultContractMap = new Map<string, ReturnType<typeof getVaultContract>>();

/**
 * Dynamically listen to events for a specific CopyTradingVault proxy.
 * Handles: TradeExecuted, FollowerSubscribed, FollowerUnsubscribed
 *
 * Safe to call multiple times for the same address (e.g. after RPC filter expiry reconnect)
 * — cleans up the previous contract instance's listeners before creating fresh ones.
 */
export async function listenToVault(vaultAddress: string) {
    // Clean up stale listeners for this vault
    vaultContractMap.get(vaultAddress)?.removeAllListeners();

    const vault = getVaultContract(vaultAddress);
    vaultContractMap.set(vaultAddress, vault);

    console.log(`[VaultListener] Subscribing to events on Vault: ${vaultAddress}...`);

    // ABI: TradeExecuted(address indexed tokenIn, address indexed tokenOut, uint256 totalAmountSwapped)
    vault.on('TradeExecuted', async (tokenIn: string, tokenOut: string, totalAmountSwapped: bigint, event: any) => {
        const txHash = event.log.transactionHash;
        console.log(`[TradeExecuted] Vault: ${vaultAddress} | Tx: ${txHash} | ${tokenIn} → ${tokenOut} | Amount: ${totalAmountSwapped.toString()}`);
        try {
            const block = await event.log.getBlock();
            await processTrade(vaultAddress, tokenIn, tokenOut, totalAmountSwapped, txHash, block.timestamp);
            await updateVaultMetrics(vaultAddress);
        } catch (err) {
            console.error(`[VaultListener] Error processing TradeExecuted ${txHash}:`, err);
        }
    });

    // ABI: FollowerSubscribed(address indexed follower, uint256 amount)
    vault.on('FollowerSubscribed', async (follower: string, amount: bigint, _event: any) => {
        console.log(`[FollowerSubscribed] Vault: ${vaultAddress} | Follower: ${follower} | Amount: ${amount.toString()}`);
        try {
            await followerEventQueue.add('follower-subscribed', {
                vaultAddress,
                followerAddress: follower,
                amount: amount.toString(),
                action: 'DEPOSIT',
            } as FollowerPayload);
        } catch (err) {
            console.error(`[VaultListener] Error queuing FollowerSubscribed for ${follower}:`, err);
        }
    });

    // ABI: FollowerUnsubscribed(address indexed follower, uint256 amount)
    vault.on('FollowerUnsubscribed', async (follower: string, amount: bigint, _event: any) => {
        console.log(`[FollowerUnsubscribed] Vault: ${vaultAddress} | Follower: ${follower} | Amount: ${amount.toString()}`);
        try {
            await followerEventQueue.add('follower-unsubscribed', {
                vaultAddress,
                followerAddress: follower,
                amount: amount.toString(),
                action: 'WITHDRAW',
            } as FollowerPayload);
        } catch (err) {
            console.error(`[VaultListener] Error queuing FollowerUnsubscribed for ${follower}:`, err);
        }
    });
}
