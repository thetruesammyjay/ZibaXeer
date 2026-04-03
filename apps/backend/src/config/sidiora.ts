/**
 * Sidiora Perpetual Protocol — backend configuration constants.
 *
 * Contract addresses sourced from sidiora-perps/Sidiora-Perpetual-Protocol/contracts.yaml
 * Network: Paxeer Mainnet (Chain ID 125)
 */

export const SIDIORA_DIAMOND_ADDRESS = '0xeA65FE02665852c615774A3041DFE6f00fb77537' as const;

export const HYPERPAXEER_RPC_URL =
    process.env.HYPERPAXEER_RPC_URL ?? 'https://public-mainnet.rpcpaxeer.online/evm';

/** Raw private key for the mirror bot EOA (prefunded with PAX for gas) */
export const MIRROR_BOT_PRIVATE_KEY = process.env.MIRROR_BOT_PRIVATE_KEY ?? '';

/**
 * Sidiora collateral token addresses and their decimals.
 * Source: contracts.yaml > collateral_tokens
 */
export const COLLATERAL_TOKENS: Record<string, { address: `0x${string}`; decimals: number }> = {
    USID: { address: '0x6C32c255EeBD6A72B56ee82454d7140020919652', decimals: 18 },
    USDC: { address: '0xf8850b62AE017c55be7f571BBad840b4f3DA7D49', decimals: 6 },
    USDT: { address: '0x5dfE06Ae465a39c442c45ed273c523BaC2d1f6a8', decimals: 6 },
    USDL: { address: '0x7c69c84daAEe90B21eeCABDb8f0387897E9B7B37', decimals: 6 },
};

/**
 * Lookup collateral token config by address (case-insensitive).
 * Returns USDC decimals (6) as a safe fallback if the token is unrecognised.
 */
export function getCollateralDecimals(tokenAddress: string): number {
    const lower = tokenAddress.toLowerCase();
    for (const info of Object.values(COLLATERAL_TOKENS)) {
        if (info.address.toLowerCase() === lower) {
            return info.decimals;
        }
    }
    console.warn(`[SidioraConfig] Unknown collateral token ${tokenAddress}, defaulting to 6 decimals`);
    return 6;
}

/**
 * Sidiora market symbol → numeric market ID.
 * Source: contracts.yaml > markets
 */
export const MARKET_IDS: Record<string, bigint> = {
    BTC: 0n,
    ETH: 1n,
    SOL: 2n,
    AVAX: 3n,
    LINK: 4n,
};

/**
 * Resolve a market symbol (case-insensitive) to its Sidiora market ID.
 * Throws if the market is not registered.
 */
export function resolveMarketId(symbol: string): bigint {
    const id = MARKET_IDS[symbol.toUpperCase()];
    if (id === undefined) {
        throw new Error(`[SidioraConfig] Unknown Sidiora market symbol: ${symbol}`);
    }
    return id;
}

/** Sanity-check env at startup. Call once from the mirror worker. */
export function assertSidioraConfig() {
    if (!MIRROR_BOT_PRIVATE_KEY || MIRROR_BOT_PRIVATE_KEY.length < 64) {
        console.warn(
            '[SidioraConfig] MIRROR_BOT_PRIVATE_KEY is not set or invalid. ' +
            'Sequencer calls will be skipped until the key is configured in Railway.'
        );
    }
}
