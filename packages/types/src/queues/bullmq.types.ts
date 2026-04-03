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

/**
 * Sidiora mirror risk policy values used by backend mirror workers.
 */
export interface SidioraRiskPolicy {
    version: string;
    maxLeverage: number;
    maxNotionalPerMarketBps: number;
    maxPortfolioNotionalBps: number;
    maxSlippageBps: number;
    maxOrderSkewBps: number;
    minHealthFactor: number;
    cooldownSeconds: number;
    dailyLossLimitBps: number;
}

/**
 * Payload produced by the indexer whenever a leader Sidiora signal is captured.
 */
export interface SidioraMirrorSignalPayload {
    version: '1.0';
    eventType: 'LEADER_SIGNAL_RECEIVED';
    traceId: string;
    leaderAddress: string;
    vaultAddress: string;
    sidioraMarket: string;
    side: 'LONG' | 'SHORT';
    orderType: 'MARKET' | 'LIMIT';
    leaderSize: string;
    leaderPrice: string;
    leaderLeverage: string;
    /**
     * ERC-20 token address to use as collateral margin on Sidiora.
     * Must be one of: USID, USDC, USDT, USDL on chain 125.
     */
    collateralToken: string;
    /**
     * Whether this signal opens a new position or closes an existing one.
     */
    action: 'OPEN' | 'CLOSE';
    /**
     * Sidiora positionId to close. Required when action === 'CLOSE'.
     */
    positionId?: string;
    timestamp: number;
    source: string;
}

/**
 * Result payload emitted by backend mirror worker after policy + idempotency checks.
 */
export interface SidioraMirrorExecutionResultPayload {
    version: '1.0';
    eventType: 'MIRROR_EXECUTION_RESULT';
    traceId: string;
    vaultAddress: string;
    leaderAddress: string;
    followerAddress: string;
    sidioraAccount: string;
    status:
        | 'ACCEPTED'
        | 'REJECTED_POLICY'
        | 'DUPLICATE_IGNORED'
        | 'SEQUENCER_SUBMITTED'
        | 'SEQUENCER_FAILED';
    reason: string | null;
    riskSnapshot: {
        effectiveLeverage: string;
        healthFactor: string;
        portfolioNotionalRatio: string;
    };
    sequencerRequestId: string;
    timestamp: number;
}

/**
 * Alert payload for operational handling when Sidiora risk checks fail.
 */
export interface SidioraRiskAlertPayload {
    traceId: string;
    vaultAddress: string;
    leaderAddress: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    reason: string;
    createdAt: number;
}
