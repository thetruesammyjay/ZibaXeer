/**
 * SidioraSequencer — submits accepted mirror signals to the Sidiora Diamond
 * as real on-chain transactions using viem with the mirror bot's private key.
 *
 * This replaces the stub-${traceId} placeholder in sidioraMirror.worker.ts.
 * The mirror bot EOA must be:
 *   1. Pre-funded with PAX for gas
 *   2. Authorized as a delegate via SidioraVaultAdapter.authorizeMirrorBot()
 */

import { createPublicClient, createWalletClient, http, parseUnits, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { SidioraMirrorSignalPayload } from '@zibaxeer/types';
import {
    SIDIORA_DIAMOND_ADDRESS,
    HYPERPAXEER_RPC_URL,
    MIRROR_BOT_PRIVATE_KEY,
    getCollateralDecimals,
    resolveMarketId,
} from '../config/sidiora';

export interface SequencerResult {
    txHash: string;
    requestId: string;
}

/**
 * Minimal ABI for the Sidiora Diamond PositionFacet.
 * Inlined so we have no dependency on the gitignored sidiora-perps workspace.
 * Source: sidiora-perps/Sidiora-Perpetual-Protocol/sdk/src/abis/position-facet.ts
 */
const POSITION_FACET_ABI = parseAbi([
    // openPosition(uint256 _marketId, address _collateralToken, uint256 _collateralAmount, uint256 _leverage, bool _isLong) returns (uint256 positionId)
    'function openPosition(uint256 _marketId, address _collateralToken, uint256 _collateralAmount, uint256 _leverage, bool _isLong) returns (uint256)',
    // closePosition(uint256 _positionId)
    'function closePosition(uint256 _positionId)',
]);

/** HyperPaxeer chain definition for viem */
const hyperPaxeerChain = {
    id: 125,
    name: 'HyperPaxeer',
    nativeCurrency: { name: 'PAX', symbol: 'PAX', decimals: 18 },
    rpcUrls: {
        default: { http: [HYPERPAXEER_RPC_URL] },
    },
} as const;

/** Timeout for waiting on a transaction receipt (ms) */
const RECEIPT_TIMEOUT_MS = 30_000;

/**
 * Submit an accepted Sidiora mirror signal to the on-chain Diamond.
 *
 * @throws if MIRROR_BOT_PRIVATE_KEY is not configured
 * @throws if the market symbol is not recognised
 * @throws if the on-chain transaction reverts or times out
 */
export async function executeSignal(
    signal: SidioraMirrorSignalPayload
): Promise<SequencerResult> {
    if (!MIRROR_BOT_PRIVATE_KEY || MIRROR_BOT_PRIVATE_KEY.length < 10) {
        throw new Error(
            'MIRROR_BOT_PRIVATE_KEY is not configured. ' +
            'Add it to Railway backend-zibaxeer environment variables.'
        );
    }

    const account = privateKeyToAccount(
        (MIRROR_BOT_PRIVATE_KEY.startsWith('0x')
            ? MIRROR_BOT_PRIVATE_KEY
            : `0x${MIRROR_BOT_PRIVATE_KEY}`) as `0x${string}`
    );

    const transport = http(HYPERPAXEER_RPC_URL);

    const publicClient = createPublicClient({
        chain: hyperPaxeerChain,
        transport,
    });

    const walletClient = createWalletClient({
        account,
        chain: hyperPaxeerChain,
        transport,
    });

    const diamondAddress = SIDIORA_DIAMOND_ADDRESS as `0x${string}`;

    let hash: `0x${string}`;

    if (signal.action === 'CLOSE') {
        if (!signal.positionId) {
            throw new Error(
                `[SidioraSequencer] CLOSE signal traceId=${signal.traceId} missing positionId`
            );
        }

        console.log(
            `[SidioraSequencer] Closing position ${signal.positionId} | traceId=${signal.traceId}`
        );

        hash = await walletClient.writeContract({
            address: diamondAddress,
            abi: POSITION_FACET_ABI,
            functionName: 'closePosition',
            args: [BigInt(signal.positionId)],
        });
    } else {
        // action === 'OPEN'
        const marketId = resolveMarketId(signal.sidioraMarket);
        const isLong = signal.side === 'LONG';
        const collateralDecimals = getCollateralDecimals(signal.collateralToken);

        // leaderLeverage is stored as a plain number string (e.g. "5") — Sidiora expects 18-decimal
        const leverageBn = parseUnits(signal.leaderLeverage, 18);

        // leaderSize is the notional/margin in human-readable units
        const collateralAmount = parseUnits(signal.leaderSize, collateralDecimals);

        console.log(
            `[SidioraSequencer] Opening position | market=${signal.sidioraMarket}(${marketId}) ` +
            `side=${signal.side} leverage=${signal.leaderLeverage}x ` +
            `collateral=${signal.leaderSize} token=${signal.collateralToken} | traceId=${signal.traceId}`
        );

        hash = await walletClient.writeContract({
            address: diamondAddress,
            abi: POSITION_FACET_ABI,
            functionName: 'openPosition',
            args: [
                marketId,
                signal.collateralToken as `0x${string}`,
                collateralAmount,
                leverageBn,
                isLong,
            ],
        });
    }

    console.log(`[SidioraSequencer] Tx submitted: ${hash} | traceId=${signal.traceId}`);

    // Wait for receipt with timeout
    const receipt = await Promise.race([
        publicClient.waitForTransactionReceipt({ hash }),
        new Promise<never>((_, reject) =>
            setTimeout(
                () => reject(new Error(`[SidioraSequencer] Receipt timeout for tx ${hash}`)),
                RECEIPT_TIMEOUT_MS
            )
        ),
    ]);

    if (receipt.status === 'reverted') {
        throw new Error(
            `[SidioraSequencer] Transaction ${hash} reverted on-chain | traceId=${signal.traceId}`
        );
    }

    console.log(`[SidioraSequencer] Confirmed: ${hash} | block=${receipt.blockNumber}`);

    return {
        txHash: hash,
        requestId: hash,
    };
}
