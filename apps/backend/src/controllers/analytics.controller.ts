import { Request, Response } from 'express';
import prisma from '../lib/prisma';

/**
 * Retrieves global protocol analytics
 */
export const getGlobalAnalytics = async (req: Request, res: Response) => {
    try {
        // Aggregate global metrics across all Active Vaults
        const vaults = await prisma.vault.findMany({
            where: { status: 'ACTIVE' },
            select: { tvl: true, trades: { select: { isProfit: true } } }
        });

        let totalTvl = 0n;
        let totalTrades = 0;
        let profitableTrades = 0;

        vaults.forEach(vault => {
            // Assuming TVL is stored as a string representation of wei/smallest unit
            try {
                if (vault.tvl) totalTvl += BigInt(vault.tvl);
            } catch (e) {
                // Ignore invalid BigInt conversion
            }

            totalTrades += vault.trades.length;
            profitableTrades += vault.trades.filter(t => t.isProfit).length;
        });

        const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;

        res.status(200).json({
            success: true,
            data: {
                activeVaultsCount: vaults.length,
                totalTvl: totalTvl.toString(),
                totalTrades,
                winRate: Number(winRate.toFixed(2))
            }
        });
    } catch (error) {
        console.error('[AnalyticsController] Error fetching global analytics:', error);
        res.status(500).json({ success: false, message: 'Internal server error while fetching analytics' });
    }
};

/**
 * Retrieves performance analytics for a specific vault
 */
export const getVaultAnalytics = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        const vault = await prisma.vault.findFirst({
            where: {
                OR: [
                    { id },
                    { contractAddress: id }
                ]
            },
            include: {
                trades: true
            }
        });

        if (!vault) {
            return res.status(404).json({ success: false, message: 'Vault not found' });
        }

        const totalTrades = vault.trades.length;
        const profitableTrades = vault.trades.filter(t => t.isProfit).length;
        const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;

        res.status(200).json({
            success: true,
            data: {
                vaultId: vault.id,
                tvl: vault.tvl,
                roi: vault.roi,
                drawdown: vault.drawdown,
                totalTrades,
                winRate: Number(winRate.toFixed(2))
            }
        });
    } catch (error) {
        console.error(`[AnalyticsController] Error fetching analytics for vault ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
