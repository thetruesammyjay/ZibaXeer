import {
    SidioraMirrorSignalPayload,
    SidioraRiskPolicy,
} from '@zibaxeer/types';
import { isVaultFrozen } from './sidioraPolicy.service';

export interface SidioraPolicyDecision {
    accepted: boolean;
    reason: string | null;
    riskSnapshot: {
        effectiveLeverage: string;
        healthFactor: string;
        portfolioNotionalRatio: string;
    };
}

function parseNumeric(value: string): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

export function evaluateSidioraSignalPolicy(
    signal: SidioraMirrorSignalPayload,
    policy: SidioraRiskPolicy
): SidioraPolicyDecision {
    if (isVaultFrozen(signal.vaultAddress)) {
        return {
            accepted: false,
            reason: 'VAULT_FROZEN',
            riskSnapshot: {
                effectiveLeverage: signal.leaderLeverage,
                healthFactor: '0',
                portfolioNotionalRatio: '1',
            },
        };
    }

    const leverage = parseNumeric(signal.leaderLeverage);
    if (leverage > policy.maxLeverage) {
        return {
            accepted: false,
            reason: 'MAX_LEVERAGE_EXCEEDED',
            riskSnapshot: {
                effectiveLeverage: signal.leaderLeverage,
                healthFactor: '0.9',
                portfolioNotionalRatio: '0.7',
            },
        };
    }

    const price = parseNumeric(signal.leaderPrice);
    const size = parseNumeric(signal.leaderSize);
    const notionalRatio = price > 0 ? (size / price) : 0;
    const cappedNotionalRatio = Number(Math.max(0, Math.min(1, notionalRatio)).toFixed(4));

    const minHealthFactor = Math.max(0.5, 2 - leverage / Math.max(policy.maxLeverage, 1));
    if (minHealthFactor < policy.minHealthFactor) {
        return {
            accepted: false,
            reason: 'MIN_HEALTH_FACTOR_BREACH',
            riskSnapshot: {
                effectiveLeverage: leverage.toString(),
                healthFactor: minHealthFactor.toFixed(2),
                portfolioNotionalRatio: cappedNotionalRatio.toString(),
            },
        };
    }

    return {
        accepted: true,
        reason: null,
        riskSnapshot: {
            effectiveLeverage: leverage.toString(),
            healthFactor: minHealthFactor.toFixed(2),
            portfolioNotionalRatio: cappedNotionalRatio.toString(),
        },
    };
}
