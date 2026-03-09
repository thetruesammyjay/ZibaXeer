import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface VaultData {
    id: string;
    contractAddress: string;
    leaderId: string;
    name: string;
    baseAsset: string;
    riskScore: number;
    tvl: string;
    roi: number;
    drawdown: number;
    status: 'ACTIVE' | 'PAUSED' | 'LIQUIDATED';
    _count?: {
        followers: number;
        trades: number;
    };
    leader?: {
        id: string;
        walletAddress: string;
        argusScore: number;
    };
}

export function useVaults() {
    const [vaults, setVaults] = useState<VaultData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchVaults() {
            try {
                const response = await fetch(`${API_URL}/vaults`);
                if (!response.ok) throw new Error('Network response was not ok');
                const json = await response.json();

                if (json.success) {
                    setVaults(json.data);
                } else {
                    throw new Error(json.message || 'Failed to fetch vaults');
                }
            } catch (err: any) {
                setError(err);
            } finally {
                setLoading(false);
            }
        }

        fetchVaults();
    }, []);

    return { vaults, loading, error };
}

export function useVault(id: string) {
    const [vault, setVault] = useState<VaultData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!id) return;

        async function fetchVault() {
            try {
                const response = await fetch(`${API_URL}/vaults/${id}`);
                if (!response.ok) throw new Error('Network response was not ok');
                const json = await response.json();

                if (json.success) {
                    setVault(json.data);
                } else {
                    throw new Error(json.message || 'Failed to fetch vault details');
                }
            } catch (err: any) {
                setError(err);
            } finally {
                setLoading(false);
            }
        }

        fetchVault();
    }, [id]);

    return { vault, loading, error };
}
