import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import type { Address } from 'viem';
import CopyTradingVaultABI from '../../abis/CopyTradingVault.json';

const ERC20_APPROVE_ABI = [
    {
        name: 'approve',
        type: 'function',
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
    },
] as const;

/**
 * Two-step subscribe flow:
 *   1. ERC-20 approve(vaultAddress, amount) on baseAsset token
 *   2. CopyTradingVault.subscribe(amount)
 *
 * Also exposes unsubscribe(amount) for the vault detail page withdraw flow.
 */
export function useSubscribe(
    vaultAddress: Address | undefined,
    baseAsset: Address | undefined
) {
    // ── Step 1: Approve ────────────────────────────────────────────────────────
    const {
        writeContract: writeApprove,
        data: approveTxHash,
        isPending: isApproveSigning,
        error: approveWriteError,
        reset: resetApprove,
    } = useWriteContract();

    const {
        isLoading: isApproveConfirming,
        isSuccess: isApproveConfirmed,
    } = useWaitForTransactionReceipt({ hash: approveTxHash });

    // ── Step 2: Subscribe ──────────────────────────────────────────────────────
    const {
        writeContract: writeSubscribe,
        data: subscribeTxHash,
        isPending: isSubscribeSigning,
        error: subscribeWriteError,
        reset: resetSubscribe,
    } = useWriteContract();

    const {
        isLoading: isSubscribeConfirming,
        isSuccess: isSubscribeConfirmed,
    } = useWaitForTransactionReceipt({ hash: subscribeTxHash });

    // ── Unsubscribe ────────────────────────────────────────────────────────────
    const {
        writeContract: writeUnsubscribe,
        data: unsubscribeTxHash,
        isPending: isUnsubscribeSigning,
        error: unsubscribeWriteError,
        reset: resetUnsubscribe,
    } = useWriteContract();

    const {
        isLoading: isUnsubscribeConfirming,
        isSuccess: isUnsubscribeConfirmed,
    } = useWaitForTransactionReceipt({ hash: unsubscribeTxHash });

    // ── Actions ────────────────────────────────────────────────────────────────
    const approve = (amount: bigint) => {
        if (!baseAsset || !vaultAddress) return;
        writeApprove({
            address: baseAsset,
            abi: ERC20_APPROVE_ABI,
            functionName: 'approve',
            args: [vaultAddress, amount],
        });
    };

    const subscribe = (amount: bigint) => {
        if (!vaultAddress) return;
        writeSubscribe({
            address: vaultAddress,
            abi: CopyTradingVaultABI.abi as never,
            functionName: 'subscribe',
            args: [amount],
        });
    };

    const unsubscribe = (amount: bigint) => {
        if (!vaultAddress) return;
        writeUnsubscribe({
            address: vaultAddress,
            abi: CopyTradingVaultABI.abi as never,
            functionName: 'unsubscribe',
            args: [amount],
        });
    };

    const resetAll = () => {
        resetApprove();
        resetSubscribe();
        resetUnsubscribe();
    };

    return {
        // subscribe flow
        approve,
        subscribe,
        approveTxHash,
        subscribeTxHash,
        isApprovePending: isApproveSigning || isApproveConfirming,
        isApproveConfirmed,
        isSubscribePending: isSubscribeSigning || isSubscribeConfirming,
        isSubscribeConfirmed,
        approveError: approveWriteError,
        subscribeError: subscribeWriteError,

        // unsubscribe flow
        unsubscribe,
        unsubscribeTxHash,
        isUnsubscribePending: isUnsubscribeSigning || isUnsubscribeConfirming,
        isUnsubscribeConfirmed,
        unsubscribeError: unsubscribeWriteError,

        resetAll,
    };
}
