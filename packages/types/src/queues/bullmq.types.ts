/**
 * Payload pushed by the Indexer when a `TradeExecuted` blockchain event occurs.
 * Consumed by the `tradeWorker` in the Backend API.
 */
export interface TradeJobPayload {
    txHash: string;
    vaultAddress: string;
    assetIn: string;
    assetOut: string;
    amountIn: string;
    amountOut: string;
    isProfit: boolean;
    pnlAmount: string; // BigInt representation locally
    timestamp: number;
}

/**
 * Payload pushed by the Indexer for cron snapshot triggers.
 * Consumed by the `snapshotWorker` in the Backend API to regenerate Vault TVL and ROI.
 */
export interface SnapshotJobPayload {
    vaultAddress: string;
    interval?: string; // e.g. '1H', '24H', '7D'
    triggeredAt?: number;
}

/**
 * Payload pushed by the Indexer when `vaultFactory` emits a deployment event.
 * Consumed by the `vaultWorker` in the Backend API to map the strategy Leader into PostgreSQL.
 */
export interface VaultDeployedPayload {
    vaultAddress: string;
    leader: string;
    baseAsset: string;
}

/**
 * Payload pushed by the Indexer when Followers deposit or withdraw liquidity.
 * Consumed by the `followerWorker` in the Backend API to calculate aggregate pool size locally.
 */
export interface FollowerPayload {
    vaultAddress: string;
    followerAddress: string;
    amount: string; // BigInt as string
    action: 'DEPOSIT' | 'WITHDRAW';
}
