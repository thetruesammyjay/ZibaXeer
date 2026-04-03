import { useReadContract } from 'wagmi';
import type { Address } from 'viem';

const ERC20_INFO_ABI = [
    {
        name: 'symbol',
        type: 'function',
        inputs: [],
        outputs: [{ name: '', type: 'string' }],
        stateMutability: 'view',
    },
    {
        name: 'decimals',
        type: 'function',
        inputs: [],
        outputs: [{ name: '', type: 'uint8' }],
        stateMutability: 'view',
    },
] as const;

/**
 * Reads symbol() and decimals() from any ERC-20 token on-chain.
 * Used by the Subscribe modal to display the correct token name and
 * convert human-readable amounts to raw bigint amounts.
 */
export function useTokenInfo(tokenAddress: Address | undefined) {
    const { data: symbol, isLoading: symbolLoading } = useReadContract({
        address: tokenAddress,
        abi: ERC20_INFO_ABI,
        functionName: 'symbol',
        query: { enabled: !!tokenAddress },
    });

    const { data: decimals, isLoading: decimalsLoading } = useReadContract({
        address: tokenAddress,
        abi: ERC20_INFO_ABI,
        functionName: 'decimals',
        query: { enabled: !!tokenAddress },
    });

    return {
        symbol: symbol as string | undefined,
        decimals: decimals as number | undefined,
        isLoading: symbolLoading || decimalsLoading,
    };
}
