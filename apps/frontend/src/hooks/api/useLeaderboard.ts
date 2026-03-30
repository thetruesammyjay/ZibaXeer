import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface LeaderData {
    id: string;
    walletAddress: string;
    argusScore: number;
    joinedAt: string;
    _count?: {
        vaultsLed: number;
    };
}

export interface LeaderboardResponse {
    data: LeaderData[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

function normalizeError(err: unknown): Error {
    if (err instanceof Error) {
        return err;
    }
    return new Error('Unknown error occurred');
}

export function useLeaderboard(limit = 50, offset = 0) {
    const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchLeaderboard() {
            try {
                const response = await fetch(`${API_URL}/leaderboard?limit=${limit}&offset=${offset}`);
                if (!response.ok) throw new Error('Network response was not ok');
                const json = await response.json();

                if (json.success) {
                    setLeaderboard({
                        data: json.data,
                        pagination: json.pagination
                    });
                } else {
                    throw new Error(json.message || 'Failed to fetch leaderboard');
                }
            } catch (err: unknown) {
                setError(normalizeError(err));
            } finally {
                setLoading(false);
            }
        }

        fetchLeaderboard();
    }, [limit, offset]);

    return { leaderboard, loading, error };
}
