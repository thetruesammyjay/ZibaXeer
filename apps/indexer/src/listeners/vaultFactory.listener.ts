import { getVaultFactoryContract } from '../config/contracts';

/**
 * Listen for newly deployed vault contracts
 */
export async function listenToVaultFactory() {
    const factory = getVaultFactoryContract();

    console.log(`[VaultFactoryListener] Subscribing to VaultCreated on ${await factory.getAddress()}...`);

    factory.on('VaultCreated', async (vaultAddress: string, leader: string, baseAsset: string, name: string) => {
        console.log(`[VaultCreated] New Vault Deployed!`);
        console.log(`  Address: ${vaultAddress}`);
        console.log(`  Leader:  ${leader}`);
        console.log(`  Name:    ${name}`);
        console.log(`  Asset:   ${baseAsset}`);

        // TODO: Send payload to processors to enter into database
        // await processNewVault(vaultAddress, leader, name, baseAsset);
    });
}

// Ensure the listener boots if run directly
if (require.main === module) {
    listenToVaultFactory().catch(console.error);
}
