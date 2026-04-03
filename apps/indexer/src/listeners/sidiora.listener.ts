import { ethers } from 'ethers';
import { randomUUID } from 'node:crypto';
import { SidioraMirrorSignalPayload } from '@zibaxeer/types';
import { processSidioraLeaderSignal } from '../processors/sidiora.processor.js';
import { provider } from '../config/contracts.js';

/** Sidiora Diamond proxy address (chain 125) */
const SIDIORA_DIAMOND = '0xeA65FE02665852c615774A3041DFE6f00fb77537';

/** Default collateral token — USDC on Paxeer (6 decimals) */
const DEFAULT_COLLATERAL_TOKEN = '0xf8850b62AE017c55be7f571BBad840b4f3DA7D49';

/** Market ID → symbol map (from contracts.yaml) */
const MARKET_SYMBOLS: Record<number, string> = {
    0: 'BTC',
    1: 'ETH',
    2: 'SOL',
    3: 'AVAX',
    4: 'LINK',
};

/**
 * Minimal ABI for Sidiora Diamond events we need to index.
 * PositionOpened and PositionClosed are emitted by PositionFacet.
 */
const SIDIORA_EVENTS_ABI = [
    'event PositionOpened(uint256 indexed positionId, address indexed trader, uint256 marketId, address collateralToken, uint256 collateralAmount, uint256 leverage, bool isLong)',
    'event PositionClosed(uint256 indexed positionId, address indexed trader, int256 pnl)',
];

/**
 * Start the Sidiora on-chain signal bridge.
 *
 * Two paths:
 * A) Live on-chain listener — subscribes to PositionOpened/PositionClosed on the Sidiora
 *    Diamond, filtered by KNOWN_LEADER_ADDRESSES. Auto-reconnects when RPC filter expires.
 * B) Bootstrap fallback — if SIDIORA_BOOTSTRAP_SIGNAL_JSON is set, queue it once immediately.
 */
export async function startSidioraSignalBridge() {
    // ── Path B: bootstrap fallback ────────────────────────────────────────────
    const raw = process.env.SIDIORA_BOOTSTRAP_SIGNAL_JSON;
    if (raw) {
        try {
            const payload = JSON.parse(raw) as SidioraMirrorSignalPayload;
            const ok = await processSidioraLeaderSignal(payload);
            if (ok) {
                console.log(`[SidioraListener] Bootstrap signal queued | traceId=${payload.traceId}`);
            }
        } catch (err) {
            console.error('[SidioraListener] Failed to parse SIDIORA_BOOTSTRAP_SIGNAL_JSON:', err);
        }
    }

    // ── Path A: live on-chain listener ────────────────────────────────────────
    const knownLeaders = new Set(
        (process.env.KNOWN_LEADER_ADDRESSES ?? '')
            .split(',')
            .map(a => a.trim().toLowerCase())
            .filter(Boolean)
    );

    if (knownLeaders.size === 0) {
        console.log(
            '[SidioraListener] KNOWN_LEADER_ADDRESSES not set — live listener not started. ' +
            'Add leader EOA addresses (comma-separated) to watch for Sidiora signals.'
        );
        return;
    }

    attachDiamondListeners(knownLeaders);
}

/**
 * Attaches PositionOpened / PositionClosed listeners on the Sidiora Diamond.
 * Extracted into its own function so it can be called again on filter expiry.
 *
 * HyperPaxeer's RPC drops eth_newFilter registrations after ~5 minutes of inactivity.
 * ethers v6 surfaces this as a provider 'error' event (code=UNKNOWN_ERROR,
 * message contains 'filter ... not found'). We detect that, remove all stale
 * listeners, and re-attach after a 2-second backoff — no pod restart required.
 */
function attachDiamondListeners(knownLeaders: Set<string>) {
    console.log(
        `[SidioraListener] Subscribing to Sidiora Diamond ${SIDIORA_DIAMOND} ` +
        `for ${knownLeaders.size} leader(s)...`
    );

    const diamond = new ethers.Contract(SIDIORA_DIAMOND, SIDIORA_EVENTS_ABI, provider);

    // ── PositionOpened ────────────────────────────────────────────────────────
    diamond.on(
        'PositionOpened',
        async (
            positionId: bigint,
            trader: string,
            marketId: bigint,
            collateralToken: string,
            collateralAmount: bigint,
            leverage: bigint,
            isLong: boolean,
            event: ethers.EventLog
        ) => {
            if (!knownLeaders.has(trader.toLowerCase())) return;

            const marketSymbol = MARKET_SYMBOLS[Number(marketId)] ?? `MARKET_${marketId}`;
            const leverageHuman = (Number(leverage) / 1e18).toFixed(2);
            const sizeRaw = collateralAmount.toString();

            const payload: SidioraMirrorSignalPayload = {
                version: '1.0',
                eventType: 'LEADER_SIGNAL_RECEIVED',
                traceId: randomUUID(),
                leaderAddress: trader,
                vaultAddress: trader,
                sidioraMarket: marketSymbol,
                side: isLong ? 'LONG' : 'SHORT',
                orderType: 'MARKET',
                leaderSize: sizeRaw,
                leaderPrice: '0',
                leaderLeverage: leverageHuman,
                collateralToken,
                action: 'OPEN',
                positionId: positionId.toString(),
                timestamp: Math.floor(Date.now() / 1000),
                source: `diamond:${event.transactionHash}`,
            };

            console.log(
                `[SidioraListener] PositionOpened | leader=${trader} market=${marketSymbol} ` +
                `side=${payload.side} leverage=${leverageHuman}x | traceId=${payload.traceId}`
            );

            try {
                await processSidioraLeaderSignal(payload);
            } catch (err) {
                console.error(`[SidioraListener] Failed to queue PositionOpened signal:`, err);
            }
        }
    );

    // ── PositionClosed ────────────────────────────────────────────────────────
    diamond.on(
        'PositionClosed',
        async (
            positionId: bigint,
            trader: string,
            _pnl: bigint,
            event: ethers.EventLog
        ) => {
            if (!knownLeaders.has(trader.toLowerCase())) return;

            const payload: SidioraMirrorSignalPayload = {
                version: '1.0',
                eventType: 'LEADER_SIGNAL_RECEIVED',
                traceId: randomUUID(),
                leaderAddress: trader,
                vaultAddress: trader,
                sidioraMarket: 'UNKNOWN',
                side: 'LONG',
                orderType: 'MARKET',
                leaderSize: '0',
                leaderPrice: '0',
                leaderLeverage: '1',
                collateralToken: DEFAULT_COLLATERAL_TOKEN,
                action: 'CLOSE',
                positionId: positionId.toString(),
                timestamp: Math.floor(Date.now() / 1000),
                source: `diamond:${event.transactionHash}`,
            };

            console.log(
                `[SidioraListener] PositionClosed | leader=${trader} positionId=${positionId} ` +
                `| traceId=${payload.traceId}`
            );

            try {
                await processSidioraLeaderSignal(payload);
            } catch (err) {
                console.error(`[SidioraListener] Failed to queue PositionClosed signal:`, err);
            }
        }
    );

    console.log('[SidioraListener] Live listener active. Watching for leader position events...');
}
