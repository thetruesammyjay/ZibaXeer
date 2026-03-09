import { Worker, Job } from 'bullmq';
import { VaultDeployedPayload } from '@zibaxeer/types';
import redisConnection from '../config/redis';
import prisma from '../lib/prisma';

/**
 * BullMQ Worker handling Vault deployments discovered by the Indexer's Event Listener.
 * Registers the Vault Leader conditionally as a User, and then inserts the new
 * CopyTradingVault into the PostgreSQL database.
 */
export const vaultWorker = new Worker('VaultDeployedQueue', async (job: Job<VaultDeployedPayload>) => {
    console.log(`[VaultWorker] Processing new Vault deployment: ${job.data.vaultAddress}`);

    try {
        const { vaultAddress, leader, baseAsset } = job.data;

        // 1. Conditionally upsert the User (Leader)
        // Even if Argus hasn't rated them yet, we need the DB entity mapped
        const user = await prisma.user.upsert({
            where: { walletAddress: leader },
            update: {},
            create: {
                walletAddress: leader,
            }
        });

        // 2. Insert the active Vault correctly linked to the User
        const vault = await prisma.vault.create({
            data: {
                contractAddress: vaultAddress,
                name: `Vault ID: ${vaultAddress.slice(0, 6)}`, // Temporary pending a Graph Indexer read
                baseAsset: baseAsset,
                leaderId: user.id,
                status: 'ACTIVE',
                tvl: "0",
                roi: 0,
                drawdown: 0
            }
        });

        console.log(`[VaultWorker] Successfully registered Vault ${vault.id} to Postgres`);

    } catch (error) {
        console.error(`[VaultWorker] Failed to process deployment job ${job.id}:`, error);
        throw error;
    }
}, {
    connection: redisConnection as any,
});

vaultWorker.on('failed', (job, err) => {
    console.error(`[VaultWorker] Job ${job?.id} failed with error: ${err.message}`);
});
