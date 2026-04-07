import { ethers } from 'ethers';
import { getVaultFactoryContract, getVaultContract, provider } from '../config/contracts.js';
import { vaultDeployedQueue } from '../queues/index.js';
import { listenToVault } from './vault.listener.js';
import { VaultDeployedPayload } from '@zibaxeer/types';

let pollingInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Poll for VaultDeployed events using queryFilter instead of eth_newFilter.
 *
 * Avoids the HyperPaxeer RPC filter expiry problem entirely — queryFilter
 * fetches logs by block range on demand rather than registering a persistent
 * server-side filter that expires after inactivity.
 *
 * Safe to call multiple times (e.g. after reconnect) — clears the previous
 * polling interval before starting a new one.
 */
export async function listenToVaultFactory() {
    // Clear any previous polling loop
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }

    const factory = getVaultFactoryContract();
    const factoryAddress = await factory.getAddress();
    let lastBlock = await provider.getBlockNumber();
    console.log(`[VaultFactoryListener] Polling for VaultDeployed on ${factoryAddress} from block ${lastBlock}...`);

    pollingInterval = setInterval(async () => {
        try {
            const currentBlock = await provider.getBlockNumber();
            if (currentBlock <= lastBlock) return;

            const events = await factory.queryFilter('VaultDeployed', lastBlock + 1, currentBlock);
            lastBlock = currentBlock;

            for (const rawEvent of events) {
                const event = rawEvent as ethers.EventLog;
                const [leader, vaultProxy] = event.args as unknown as [string, string];
                try {
                    console.log(`[VaultDeployed] New Vault: ${vaultProxy} | Leader: ${leader}`);

                    // Wait briefly to ensure RPC state is synced to the new proxy
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    // Read baseAsset on-chain — not emitted in the event
                    const vaultContract = getVaultContract(vaultProxy) as any;
                    const baseAsset: string = await vaultContract.baseAsset();
                    console.log(`[VaultDeployed] BaseAsset: ${baseAsset}`);

                    await vaultDeployedQueue.add('register-vault', {
                        vaultAddress: vaultProxy,
                        leader,
                        baseAsset,
                    } as VaultDeployedPayload);

                    console.log(`[VaultFactoryListener] Queued DB registration for ${vaultProxy}`);

                    // Immediately start watching this vault's trades and subscriptions
                    await listenToVault(vaultProxy);
                } catch (innerErr) {
                    console.error(`[VaultFactoryListener] Error handling VaultDeployed for ${vaultProxy}:`, innerErr);
                }
            }
        } catch (err) {
            console.error('[VaultFactoryListener] Polling error:', err);
        }
    }, 5_000); // poll every 5 seconds
}
