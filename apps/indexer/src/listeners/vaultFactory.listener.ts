import { getVaultFactoryContract, getVaultContract } from '../config/contracts.js';
import { vaultDeployedQueue } from '../queues/index.js';
import { VaultDeployedPayload } from '@zibaxeer/types';

/**
 * Listen for newly deployed vault contracts
 */
export async function listenToVaultFactory() {
    const factory = getVaultFactoryContract();
    const factoryAddress = await factory.getAddress();

    console.log(`[VaultFactoryListener] Subscribing to VaultDeployed on ${factoryAddress}...`);

    factory.on('VaultDeployed', async (vaultAddress: string, leader: string) => {
        try {
            console.log(`[VaultDeployed] New Vault clone detected: ${vaultAddress}`);

            // Wait briefly to ensure RPC state is synced to the new clone before reading
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Fetch dynamically initialized variables directly from the new proxy
            const vaultContract: any = getVaultContract(vaultAddress);
            const baseAsset = await vaultContract.baseAsset();

            console.log(`  Leader:  ${leader}`);
            console.log(`  Asset:   ${baseAsset}`);

            await vaultDeployedQueue.add('register-vault', {
                vaultAddress,
                leader,
                baseAsset,
            } as VaultDeployedPayload);

            console.log(`[VaultFactoryListener] Queued database registration for ${vaultAddress}`);
        } catch (error) {
            console.error(`[VaultFactoryListener] Error handling event for ${vaultAddress}:`, error);
        }
    });
}

// Ensure the listener boots if run directly
if (require.main === module) {
    listenToVaultFactory().catch(console.error);
}
