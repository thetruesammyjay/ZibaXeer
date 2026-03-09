import { Request, Response } from 'express';
import prisma from '../lib/prisma';

/**
 * Retrieves the global leaderboard of Gladiators based on Argus Reputation Score
 */
export const getLeaderboard = async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        // Fetch users sorted by highest Argus Score (Reputation)
        const leaders = await prisma.user.findMany({
            where: {
                argusScore: { gt: 0 } // Only fetch users who have an established positive score
            },
            orderBy: {
                argusScore: 'desc'
            },
            take: Math.min(limit, 100), // Cap at 100 max per request to prevent DB abuse
            skip: offset,
            include: {
                _count: {
                    select: { vaultsLed: true }
                }
            }
        });

        // Also get the total count for pagination metadata
        const totalCount = await prisma.user.count({
            where: { argusScore: { gt: 0 } }
        });

        res.status(200).json({
            success: true,
            data: leaders,
            pagination: {
                total: totalCount,
                limit,
                offset,
                hasMore: offset + leaders.length < totalCount
            }
        });
    } catch (error) {
        console.error('[LeaderboardController] Error fetching leaderboard:', error);
        res.status(500).json({ success: false, message: 'Internal server error while fetching leaderboard' });
    }
};
