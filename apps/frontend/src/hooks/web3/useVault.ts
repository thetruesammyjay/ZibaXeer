import { useReadContract, useAccount } from 'wagmi';
import CopyTradingVaultABI from '../../abis/CopyTradingVault.json';
import { type Address } from 'viem';

/**
 * Hook to read the full on-chain state of a specific CopyTrading vault.
 */
export function useVaultData(vaultAddress: Address | undefined) {

    const { data: highWaterMark, refetch: refetchHWM } = useReadContract({
        address: vaultAddress,
        abi: CopyTradingVaultABI.abi,
        functionName: 'highWaterMark',
        query: { enabled: !!vaultAddress },
    });

    const { data: baseAsset, refetch: refetchBaseAsset } = useReadContract({
        address: vaultAddress,
        abi: CopyTradingVaultABI.abi,
        functionName: 'baseAsset',
        query: { enabled: !!vaultAddress },
    });

    const { data: totalVaultTVL, refetch: refetchTVL } = useReadContract({
        address: vaultAddress,
        abi: CopyTradingVaultABI.abi,
        functionName: 'totalVaultTVL',
        query: { enabled: !!vaultAddress, refetchInterval: 15_000 },
    });

    const { data: vaultName } = useReadContract({
        address: vaultAddress,
        abi: CopyTradingVaultABI.abi,
        functionName: 'vaultName',
        query: { enabled: !!vaultAddress },
    });

    const { data: leader } = useReadContract({
        address: vaultAddress,
        abi: CopyTradingVaultABI.abi,
        functionName: 'leader',
        query: { enabled: !!vaultAddress },
    });

    return {
        highWaterMark: highWaterMark ? BigInt(highWaterMark as string) : BigInt(0),
        baseAsset: baseAsset as Address | undefined,
        totalVaultTVL: totalVaultTVL ? BigInt(totalVaultTVL as string) : BigInt(0),
        vaultName: vaultName as string | undefined,
        leader: leader as Address | undefined,
        refetch: () => {
            refetchHWM();
            refetchBaseAsset();
            refetchTVL();
        },
    };
}

/**
 * Hook to read a specific follower's position within a vault.
 */
export function useFollowerPosition(vaultAddress: Address | undefined) {
    const { address: userAddress } = useAccount();

    const { data: followerData, refetch } = useReadContract({
        address: vaultAddress,
        abi: CopyTradingVaultABI.abi,
        functionName: 'followers',
        args: userAddress ? [userAddress] : undefined,
        query: {
            enabled: !!vaultAddress && !!userAddress,
        }
    });

    // data returns [depositedAmount, entryValue]
    const depositedAmount = followerData ? (followerData as [bigint, bigint])[0] : BigInt(0);
    const entryValue = followerData ? (followerData as [bigint, bigint])[1] : BigInt(0);

    return {
        depositedAmount,
        entryValue,
        refetch
    };
}
