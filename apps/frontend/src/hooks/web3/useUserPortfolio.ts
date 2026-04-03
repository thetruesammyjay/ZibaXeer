import { useReadContracts, useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import type { Address } from 'viem';
import CopyTradingVaultABI from '../../abis/CopyTradingVault.json';

/**
 * Reads followers(userAddress).deposited across ALL vault proxy addresses
 * and sums them to produce the user's total capital deployed in ZibaXeer.
 *
 * This replaces the old `useBalance` approach which showed the raw PAX
 * native balance, which was unrelated to the user's vault positions.
 */
export function useUserPortfolio(vaultAddresses: string[]) {
    const { address: userAddress } = useAccount();

    const validAddresses = vaultAddresses.filter(
        addr => addr && addr !== '0x0000000000000000000000000000000000000000'
    );

    const contracts = validAddresses.map(addr => ({
        address: addr as Address,
        abi: CopyTradingVaultABI.abi as never,
        functionName: 'followers' as const,
        args: [userAddress as Address],
    }));

    type ContractResult = { status: 'success'; result: unknown } | { status: 'failure'; error: Error };

    const { data: rawData, isLoading } = useReadContracts({
        contracts,
        query: {
            enabled: !!userAddress && validAddresses.length > 0,
            refetchInterval: 30_000,
        },
    });

    // Cast to a typed array — wagmi infers 'never' when contracts is built dynamically
    const data = rawData as ContractResult[] | undefined;

    // Sum deposited amounts across all vaults
    const totalDepositedRaw = data?.reduce((acc, result) => {
        if (result.status === 'success') {
            const [deposited] = result.result as [bigint, bigint];
            return acc + deposited;
        }
        return acc;
    }, BigInt(0)) ?? BigInt(0);

    // Individual vault positions for breakdown display
    const positions = validAddresses.map((addr, i) => {
        const result = data?.[i];
        if (result?.status === 'success') {
            const [deposited, waterMark] = result.result as [bigint, bigint];
            return { vaultAddress: addr, deposited, waterMark };
        }
        return { vaultAddress: addr, deposited: BigInt(0), waterMark: BigInt(0) };
    });

    return {
        totalDepositedRaw,
        // Formatted as 18-decimal ETH-like value (baseAsset is 18-decimal on HyperPaxeer)
        totalDepositedFormatted: formatUnits(totalDepositedRaw, 18),
        positions,
        isLoading,
        isConnected: !!userAddress,
    };
}
