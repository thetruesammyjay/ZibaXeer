import { getVaultFactoryContract, getVaultContract } from '../config/contracts.js';
import { vaultDeployedQueue } from '../queues/index.js';
import { listenToVault } from './vault.listener.js';
import { VaultDeployedPayload } from '@zibaxeer/types';

/** Stored so we can remove old listeners before re-attaching on reconnect. */
let factoryContractRef: ReturnType<typeof getVaultFactoryContract> | null = null;

/**
 * Listen for newly deployed vault contracts emitted by VaultFactory.
 * ABI: VaultDeployed(address indexed leader, address indexed vaultProxy)
 *
 * Safe to call multiple times (e.g. after RPC filter expiry reconnect) — cleans up
 * the previous contract instance's listeners before creating fresh ones.
 */
export async function listenToVaultFactory() {
    // Clean up stale listeners from the previous contract instance
    factoryContractRef?.removeAllListeners();

    const factory = getVaultFactoryContract();
    factoryContractRef = factory;

    const factoryAddress = await factory.getAddress();
    console.log(`[VaultFactoryListener] Subscribing to VaultDeployed on ${factoryAddress}...`);

    factory.on('VaultDeployed', async (leader: string, vaultProxy: string, event: any) => {
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
        } catch (error) {
            console.error(`[VaultFactoryListener] Error handling VaultDeployed for ${vaultProxy}:`, error);
        }
    });
}
