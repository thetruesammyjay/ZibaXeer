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
    // PositionOpened(uint256 indexed positionId, address indexed trader, uint256 marketId,
    //                address collateralToken, uint256 collateralAmount, uint256 leverage, bool isLong)
    'event PositionOpened(uint256 indexed positionId, address indexed trader, uint256 marketId, address collateralToken, uint256 collateralAmount, uint256 leverage, bool isLong)',
    // PositionClosed(uint256 indexed positionId, address indexed trader, int256 pnl)
    'event PositionClosed(uint256 indexed positionId, address indexed trader, int256 pnl)',
];

/**
 * Start the Sidiora on-chain signal bridge.
 *
 * Phase 2 behaviour — two paths:
 *
 * A) **Live on-chain listener** (primary): subscribes to PositionOpened / PositionClosed
 *    events emitted by the Sidiora Diamond and queues them for the backend mirror worker.
 *    Filters events to leader addresses listed in KNOWN_LEADER_ADDRESSES env var.
 *
 * B) **Bootstrap fallback**: if SIDIORA_BOOTSTRAP_SIGNAL_JSON is set, queue it once
 *    immediately (useful for manual integration testing without live leaders).
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
    // Parse leader addresses from env (comma-separated, same format as KNOWN_VAULT_ADDRESSES)
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
            // leverage is 18-decimal fixed-point; convert to human-readable string
            const leverageHuman = (Number(leverage) / 1e18).toFixed(2);
            // collateralAmount decimals vary per token — store raw string, sequencer re-parses
            const sizeRaw = collateralAmount.toString();

            const payload: SidioraMirrorSignalPayload = {
                version: '1.0',
                eventType: 'LEADER_SIGNAL_RECEIVED',
                traceId: randomUUID(),
                leaderAddress: trader,
                vaultAddress: trader, // vault address resolved by backend if needed
                sidioraMarket: marketSymbol,
                side: isLong ? 'LONG' : 'SHORT',
                orderType: 'MARKET',
                leaderSize: sizeRaw,
                leaderPrice: '0', // not available in event; policy evaluator uses '0' gracefully
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
                sidioraMarket: 'UNKNOWN', // market not in close event; policy still evaluates
                side: 'LONG',             // direction not relevant for close
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

