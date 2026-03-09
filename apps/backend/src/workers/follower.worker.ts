import { Worker, Job } from 'bullmq';
import { FollowerPayload } from '@zibaxeer/types';
import redisConnection from '../config/redis';
import prisma from '../lib/prisma';

/**
 * BullMQ Worker handling deposit and withdrawal interactions emitted by the Contract.
 * Manages the User state for followers and updates the mapping connecting them to vaults.
 */
export const followerWorker = new Worker('FollowerEventQueue', async (job: Job<FollowerPayload>) => {
    console.log(`[FollowerWorker] Syncing ${job.data.action} for ${job.data.followerAddress}`);

    try {
        const { vaultAddress, followerAddress, amount, action } = job.data;

        // Resolve the internal Vault ID
        const vault = await prisma.vault.findUnique({
            where: { contractAddress: vaultAddress }
        });

        if (!vault) throw new Error(`Vault ${vaultAddress} not tracked in Database`);

        // Ensure Follower exists as a User object
        const user = await prisma.user.upsert({
            where: { walletAddress: followerAddress },
            update: {},
            create: { walletAddress: followerAddress }
        });

        if (action === 'DEPOSIT') {
            const existingSub = await prisma.followerSubscription.findFirst({
                where: { userId: user.id, vaultId: vault.id }
            });

            if (existingSub) {
                // Add on to the current balance internally via BigInt math
                const combinedDeposit = (BigInt(existingSub.depositedAmount) + BigInt(amount)).toString();
                await prisma.followerSubscription.update({
                    where: { id: existingSub.id },
                    data: { depositedAmount: combinedDeposit }
                });
            } else {
                // First time subscription tracking
                await prisma.followerSubscription.create({
                    data: {
                        userId: user.id,
                        vaultId: vault.id,
                        depositedAmount: amount
                    }
                });
            }
        } else if (action === 'WITHDRAW') {
            // Find existing subscription
            const existingSub = await prisma.followerSubscription.findFirst({
                where: { userId: user.id, vaultId: vault.id }
            });

            if (existingSub) {
                const remainingBalance = BigInt(existingSub.depositedAmount) - BigInt(amount);

                if (remainingBalance <= 0n) {
                    // Completely removed liquidity - revoke sub entirely
                    await prisma.followerSubscription.delete({
                        where: { id: existingSub.id }
                    });
                } else {
                    await prisma.followerSubscription.update({
                        where: { id: existingSub.id },
                        data: { depositedAmount: remainingBalance.toString() }
                    });
                }
            }
        }

        console.log(`[FollowerWorker] Processed ${action} for ${user.id} against Vault ${vault.id}`);

    } catch (error) {
        console.error(`[FollowerWorker] Job ${job.id} failed:`, error);
        throw error;
    }
}, {
    connection: redisConnection as any,
    concurrency: 10 // Safe to parallelize user updates
});

followerWorker.on('failed', (job, err) => {
    console.error(`[FollowerWorker] Critical Error on Job ${job?.id}: ${err.message}`);
});
