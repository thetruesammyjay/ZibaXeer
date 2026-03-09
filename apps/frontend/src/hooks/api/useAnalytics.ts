import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface GlobalAnalytics {
    activeVaultsCount: number;
    totalTvl: string;
    totalTrades: number;
    winRate: number;
}

export function useGlobalAnalytics() {
    const [analytics, setAnalytics] = useState<GlobalAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                const response = await fetch(`${API_URL}/analytics/global`);
                if (!response.ok) throw new Error('Network response was not ok');
                const json = await response.json();

                if (json.success) {
                    setAnalytics(json.data);
                } else {
                    throw new Error(json.message || 'Failed to fetch analytics');
                }
            } catch (err: any) {
                setError(err);
            } finally {
                setLoading(false);
            }
        }

        fetchAnalytics();
    }, []);

    return { analytics, loading, error };
}
