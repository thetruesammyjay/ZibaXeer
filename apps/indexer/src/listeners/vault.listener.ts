import { ethers } from 'ethers';
import { getVaultContract, provider } from '../config/contracts.js';
import { followerEventQueue } from '../queues/index.js';
import { processTrade } from '../processors/trade.processor.js';
import { updateVaultMetrics } from '../processors/pnl.processor.js';
import { FollowerPayload } from '@zibaxeer/types';

/** Polling intervals keyed by vault address so each can be independently cleared on restart. */
const vaultPollingIntervals = new Map<string, ReturnType<typeof setInterval>>();

/**
 * Poll for events on a specific CopyTradingVault proxy.
 * Handles: TradeExecuted, FollowerSubscribed, FollowerUnsubscribed
 *
 * Uses queryFilter polling instead of eth_newFilter to avoid HyperPaxeer RPC
 * filter expiry. Safe to call multiple times for the same address.
 */
export async function listenToVault(vaultAddress: string) {
    // Clear any previous polling loop for this vault
    const existing = vaultPollingIntervals.get(vaultAddress);
    if (existing) {
        clearInterval(existing);
        vaultPollingIntervals.delete(vaultAddress);
    }

    const vault = getVaultContract(vaultAddress);
    let lastBlock = await provider.getBlockNumber();
    console.log(`[VaultListener] Polling events on Vault: ${vaultAddress} from block ${lastBlock}...`);

    const interval = setInterval(async () => {
        try {
            const currentBlock = await provider.getBlockNumber();

            // HyperPaxeer eth_getLogs only supports single-block queries (from == to).
            // Loop block-by-block rather than using a range.
            for (let block = lastBlock + 1; block <= currentBlock; block++) {
                try {
                    const [tradeEvents, subscribedEvents, unsubscribedEvents] = await Promise.all([
                        vault.queryFilter('TradeExecuted', block, block),
                        vault.queryFilter('FollowerSubscribed', block, block),
                        vault.queryFilter('FollowerUnsubscribed', block, block),
                    ]);
                    lastBlock = block;

                    // ── TradeExecuted ──────────────────────────────────────────────────
                    for (const rawEvent of tradeEvents) {
                        const event = rawEvent as ethers.EventLog;
                        const [tokenIn, tokenOut, totalAmountSwapped] = event.args as unknown as [string, string, bigint];
                        const txHash = event.transactionHash;
                        console.log(`[TradeExecuted] Vault: ${vaultAddress} | Tx: ${txHash} | ${tokenIn} → ${tokenOut} | Amount: ${totalAmountSwapped.toString()}`);
                        try {
                            const blk = await provider.getBlock(event.blockNumber);
                            await processTrade(vaultAddress, tokenIn, tokenOut, totalAmountSwapped, txHash, blk!.timestamp);
                            await updateVaultMetrics(vaultAddress);
                        } catch (err) {
                            console.error(`[VaultListener] Error processing TradeExecuted ${txHash}:`, err);
                        }
                    }

                    // ── FollowerSubscribed ─────────────────────────────────────────────
                    for (const rawEvent of subscribedEvents) {
                        const event = rawEvent as ethers.EventLog;
                        const [follower, amount] = event.args as unknown as [string, bigint];
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
                    }

                    // ── FollowerUnsubscribed ───────────────────────────────────────────
                    for (const rawEvent of unsubscribedEvents) {
                        const event = rawEvent as ethers.EventLog;
                        const [follower, amount] = event.args as unknown as [string, bigint];
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
                    }
                } catch (blockErr) {
                    console.error(`[VaultListener] Error querying block ${block} for vault ${vaultAddress}:`, blockErr);
                    break; // retry this block on next poll cycle
                }
            }
        } catch (err) {
            console.error(`[VaultListener] Polling error for vault ${vaultAddress}:`, err);
        }
    }, 5_000);


    vaultPollingIntervals.set(vaultAddress, interval);
}
