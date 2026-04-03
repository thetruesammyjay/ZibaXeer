import 'dotenv/config';
import { listenToVaultFactory } from './listeners/vaultFactory.listener.js';
import { listenToVault } from './listeners/vault.listener.js';
import { startSidioraSignalBridge } from './listeners/sidiora.listener.js';
import { provider } from './config/contracts.js';

const KNOWN_VAULT_ADDRESSES = (process.env.KNOWN_VAULT_ADDRESSES ?? '')
    .split(',')
    .map(a => a.trim())
    .filter(Boolean);

let isRestarting = false;

/**
 * Starts (or restarts) all on-chain listeners.
 * Safe to call multiple times — each listener cleans up its own stale contract
 * instance before re-attaching, so we never accumulate duplicate handlers.
 */
async function startAllListeners() {
    await listenToVaultFactory();
    await startSidioraSignalBridge();
    if (KNOWN_VAULT_ADDRESSES.length > 0) {
        console.log(`[Indexer] Bootstrapping ${KNOWN_VAULT_ADDRESSES.length} known vault(s)...`);
        await Promise.all(KNOWN_VAULT_ADDRESSES.map(address => listenToVault(address)));
    }
}

/**
 * Global provider error handler.
 *
 * HyperPaxeer's JSON-RPC node drops eth_newFilter registrations after ~5 minutes of
 * inactivity. ethers v6 surfaces these as provider 'error' events with code=UNKNOWN_ERROR
 * and message 'filter … not found'. This handler detects that condition, removes itself,
 * restarts every listener (which recreates fresh filters), then re-arms for the next cycle.
 */
function setupGlobalFilterReconnect() {
    const onError = (err: Error & { code?: string; error?: { message?: string } }) => {
        const isFilterExpiry =
            err?.code === 'UNKNOWN_ERROR' &&
            (err?.error?.message ?? '').includes('filter') &&
            (err?.error?.message ?? '').includes('not found');

        if (isFilterExpiry && !isRestarting) {
            isRestarting = true;
            console.warn('[Indexer] RPC filter expired — restarting all listeners in 5s...');
            provider.off('error', onError); // remove self to avoid duplicate calls
            setTimeout(async () => {
                try {
                    await startAllListeners();
                    console.log('[Indexer] ♻️  All listeners reconnected after filter expiry.');
                    setupGlobalFilterReconnect(); // re-arm for next expiry cycle
                } catch (restartErr) {
                    console.error('[Indexer] Failed to restart listeners after filter expiry:', restartErr);
                } finally {
                    isRestarting = false;
                }
            }, 5_000);
        } else if (!isFilterExpiry) {
            console.error('[Indexer] Provider error:', err);
        }
    };

    provider.on('error', onError);
}

async function main() {
    console.log('[Indexer] ZibaXeer Indexer starting...');
    console.log(`[Indexer] RPC:     ${process.env.HYPERPAXEER_RPC_URL}`);
    console.log(`[Indexer] Factory: ${process.env.VAULT_FACTORY_ADDRESS}`);
    console.log(`[Indexer] Redis:   ${process.env.REDIS_URL ? 'SET ✅' : 'NOT SET ❌ (using localhost fallback)'}`);

    setupGlobalFilterReconnect();
    await startAllListeners();

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
