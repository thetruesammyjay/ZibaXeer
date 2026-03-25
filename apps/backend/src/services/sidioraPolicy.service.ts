import { SidioraRiskPolicy } from '@zibaxeer/types';

const currentPolicy: SidioraRiskPolicy = {
    version: '1.0.0',
    maxLeverage: 10,
    maxNotionalPerMarketBps: 2000,
    maxPortfolioNotionalBps: 6000,
    maxSlippageBps: 75,
    maxOrderSkewBps: 30,
    minHealthFactor: 1.2,
    cooldownSeconds: 15,
    dailyLossLimitBps: 500,
};

const frozenVaults = new Set<string>();

export function getSidioraPolicy(): SidioraRiskPolicy {
    return { ...currentPolicy };
}

export function updateSidioraPolicy(patch: Partial<SidioraRiskPolicy>): SidioraRiskPolicy {
    if (patch.maxLeverage !== undefined && patch.maxLeverage <= 0) {
        throw new Error('maxLeverage must be greater than 0');
    }

    if (patch.minHealthFactor !== undefined && patch.minHealthFactor <= 0) {
        throw new Error('minHealthFactor must be greater than 0');
    }

    Object.assign(currentPolicy, patch);

    if (patch.version === undefined) {
        currentPolicy.version = `${Date.now()}`;
    }

    return { ...currentPolicy };
}

export function freezeVaultMirroring(vaultAddress: string) {
    frozenVaults.add(vaultAddress.toLowerCase());
}

export function unfreezeVaultMirroring(vaultAddress: string) {
    frozenVaults.delete(vaultAddress.toLowerCase());
}

export function isVaultFrozen(vaultAddress: string): boolean {
    return frozenVaults.has(vaultAddress.toLowerCase());
}

export function listFrozenVaults(): string[] {
    return Array.from(frozenVaults.values());
}
