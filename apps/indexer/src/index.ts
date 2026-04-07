import 'dotenv/config';
import { listenToVaultFactory } from './listeners/vaultFactory.listener.js';
import { listenToVault } from './listeners/vault.listener.js';
import { startSidioraSignalBridge } from './listeners/sidiora.listener.js';

const KNOWN_VAULT_ADDRESSES = (process.env.KNOWN_VAULT_ADDRESSES ?? '')
    .split(',')
    .map(a => a.trim())
    .filter(Boolean);

async function main() {
    console.log('[Indexer] ZibaXeer Indexer starting...');
    console.log(`[Indexer] RPC:     ${process.env.HYPERPAXEER_RPC_URL}`);
    console.log(`[Indexer] Factory: ${process.env.VAULT_FACTORY_ADDRESS}`);
    console.log(`[Indexer] Redis:   ${process.env.REDIS_URL ? 'SET ✅' : 'NOT SET ❌ (using localhost fallback)'}`);

    // Watch VaultFactory for new vault deployments (polling-based, no eth_newFilter)
    await listenToVaultFactory();

    // Start Sidiora leader-signal bridge (bootstrap/env-driven in Phase 1)
    await startSidioraSignalBridge();

    // Bootstrap any vaults already deployed before this process started
    if (KNOWN_VAULT_ADDRESSES.length > 0) {
        console.log(`[Indexer] Bootstrapping ${KNOWN_VAULT_ADDRESSES.length} known vault(s)...`);
        await Promise.all(KNOWN_VAULT_ADDRESSES.map(address => listenToVault(address)));
    }

    console.log('[Indexer] Listening for on-chain events. Press Ctrl+C to stop.');
}

main().catch((err) => {
    console.error('[Indexer] Fatal startup error:', err);
    process.exit(1);
});

process.on('SIGINT', () => {
    console.log('\n[Indexer] Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('[Indexer] Received SIGTERM, shutting down...');
    process.exit(0);
});
