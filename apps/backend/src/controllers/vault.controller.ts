import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAllVaults = async (req: Request, res: Response) => {
    try {
        const vaults = await prisma.vault.findMany({
            include: {
                leader: true,
                _count: {
                    select: { followers: true, trades: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.status(200).json({ success: true, data: vaults });
    } catch (error) {
        console.error('[VaultController] Error fetching vaults:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const getVaultById = async (req: Request, res: Response) => {
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
                leader: true,
                trades: {
                    orderBy: { executedAt: 'desc' },
                    take: 10
                },
                _count: {
                    select: { followers: true }
                }
            }
        });

        if (!vault) {
            return res.status(404).json({ success: false, message: 'Vault not found' });
        }

        res.status(200).json({ success: true, data: vault });
    } catch (error) {
        console.error(`[VaultController] Error fetching vault ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
