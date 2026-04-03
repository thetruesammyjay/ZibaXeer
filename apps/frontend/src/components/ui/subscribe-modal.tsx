"use client"

import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, CheckCircle, ExternalLink, Loader2, AlertCircle } from 'lucide-react'
import { parseUnits, formatUnits } from 'viem'
import type { Address } from 'viem'
import { Button } from '@/components/ui/button'
import { useSubscribe } from '@/hooks/web3/useSubscribe'
import { useTokenInfo } from '@/hooks/web3/useTokenInfo'
import { useVaultData } from '@/hooks/web3/useVault'
import { VaultData } from '@/hooks/api/useVaults'

const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL ?? 'https://paxscan.paxeer.app'

interface SubscribeModalProps {
    vault: VaultData | null
    open: boolean
    onClose: () => void
}

type Step = 'input' | 'approving' | 'subscribing' | 'success' | 'error'

export function SubscribeModal({ vault, open, onClose }: SubscribeModalProps) {
    const [amountStr, setAmountStr] = useState('')
    const [step, setStep] = useState<Step>('input')
    const [parsedAmount, setParsedAmount] = useState<bigint>(BigInt(0))

    const vaultAddress = vault?.contractAddress as Address | undefined
    const { baseAsset } = useVaultData(vaultAddress)
    const { symbol, decimals, isLoading: tokenLoading } = useTokenInfo(baseAsset)

    const {
        approve,
        subscribe,
        isApprovePending, isApproveConfirmed, approveError,
        isSubscribePending, isSubscribeConfirmed, subscribeTxHash,
        subscribeError,
        resetAll,
    } = useSubscribe(vaultAddress, baseAsset)

    // Step machine: approved → trigger subscribe
    useEffect(() => {
        if (isApproveConfirmed && step === 'approving') {
            setStep('subscribing')
            subscribe(parsedAmount)
        }
    }, [isApproveConfirmed])  // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (isSubscribeConfirmed && step === 'subscribing') {
            setStep('success')
        }
    }, [isSubscribeConfirmed])  // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if ((approveError || subscribeError) && step !== 'input') {
            setStep('error')
        }
    }, [approveError, subscribeError])  // eslint-disable-line react-hooks/exhaustive-deps

    const handleClose = () => {
        setStep('input')
        setAmountStr('')
        setParsedAmount(BigInt(0))
        resetAll()
        onClose()
    }

    const handleApprove = () => {
        if (!decimals || !amountStr || Number(amountStr) <= 0) return
        const raw = parseUnits(amountStr, decimals)
        setParsedAmount(raw)
        setStep('approving')
        approve(raw)
    }

    const errorMessage =
        (approveError as { shortMessage?: string })?.shortMessage ??
        (subscribeError as { shortMessage?: string })?.shortMessage ??
        'Transaction failed. Please try again.'

    const tokenSymbol = tokenLoading ? '...' : (symbol ?? 'TOKEN')
    const dec = decimals ?? 18

    return (
        <Dialog.Root open={open} onOpenChange={(v) => !v && handleClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border/40 bg-card p-6 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <Dialog.Title className="text-lg font-bold">
                                Subscribe to Copy Trade
                            </Dialog.Title>
                            <Dialog.Description className="text-sm text-muted-foreground mt-1">
                                {vault?.name}
                            </Dialog.Description>
                        </div>
                        <Dialog.Close asChild>
                            <button
                                onClick={handleClose}
                                className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </Dialog.Close>
                    </div>

                    {/* Success State */}
                    {step === 'success' && (
                        <div className="flex flex-col items-center text-center gap-4 py-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                                <CheckCircle className="h-8 w-8 text-green-500" />
                            </div>
                            <div>
                                <p className="text-lg font-bold">Subscription Active!</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    You are now copy-trading {vault?.leader?.walletAddress?.slice(0, 6)}...
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Amount: {formatUnits(parsedAmount, dec)} {tokenSymbol}
                                </p>
                            </div>
                            {subscribeTxHash && (
                                <a
                                    href={`${EXPLORER_URL}/tx/${subscribeTxHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                                >
                                    View on PaxScan <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                            )}
                            <Button className="w-full mt-2" onClick={handleClose}>Done</Button>
                        </div>
                    )}

                    {/* Error State */}
                    {step === 'error' && (
                        <div className="flex flex-col items-center text-center gap-4 py-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                                <AlertCircle className="h-8 w-8 text-red-500" />
                            </div>
                            <div>
                                <p className="text-lg font-bold">Transaction Failed</p>
                                <p className="text-sm text-muted-foreground mt-1 max-w-xs">{errorMessage}</p>
                            </div>
                            <Button variant="outline" className="w-full" onClick={() => { setStep('input'); resetAll() }}>
                                Try Again
                            </Button>
                        </div>
                    )}

                    {/* Input + Progress State */}
                    {(step === 'input' || step === 'approving' || step === 'subscribing') && (
                        <>
                            {/* Vault stats */}
                            <div className="grid grid-cols-3 gap-3 mb-6 rounded-xl bg-muted/30 p-3">
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground">ROI</p>
                                    <p className={`text-sm font-bold ${vault?.roi && vault.roi > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {vault?.roi && vault.roi > 0 ? '+' : ''}{vault?.roi ?? 0}%
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground">Risk Score</p>
                                    <p className="text-sm font-bold">{vault?.riskScore ?? '—'}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground">Followers</p>
                                    <p className="text-sm font-bold">{vault?._count?.followers ?? 0}</p>
                                </div>
                            </div>

                            {/* Amount Input */}
                            <div className="mb-6">
                                <label className="text-sm font-medium mb-2 block">
                                    Amount to Subscribe
                                </label>
                                <div className="relative">
                                    <input
                                        id="subscribe-amount"
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={amountStr}
                                        onChange={(e) => setAmountStr(e.target.value)}
                                        disabled={step !== 'input'}
                                        placeholder="0.00"
                                        className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 pr-20 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                                        {tokenSymbol}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1.5">
                                    Funds are held non-custodially in the vault contract.
                                </p>
                            </div>

                            {/* Progress Steps */}
                            <div className="mb-6 flex items-center gap-2">
                                <StepBadge number={1} label="Approve" active={step === 'approving'} done={isApproveConfirmed} />
                                <div className="flex-1 h-px bg-border/40" />
                                <StepBadge number={2} label="Subscribe" active={step === 'subscribing'} done={isSubscribeConfirmed} />
                            </div>

                            {/* Action Button */}
                            {step === 'input' && (
                                <Button
                                    id="subscribe-approve-btn"
                                    className="w-full h-12 text-base font-semibold"
                                    onClick={handleApprove}
                                    disabled={!amountStr || Number(amountStr) <= 0 || tokenLoading}
                                >
                                    Approve {tokenSymbol}
                                </Button>
                            )}
                            {step === 'approving' && (
                                <Button className="w-full h-12" disabled>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {isApprovePending ? 'Approving...' : 'Confirming Approval...'}
                                </Button>
                            )}
                            {step === 'subscribing' && (
                                <Button className="w-full h-12" disabled>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {isSubscribePending ? 'Subscribing...' : 'Confirming Subscribe...'}
                                </Button>
                            )}
                        </>
                    )}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}

function StepBadge({ number, label, active, done }: {
    number: number; label: string; active: boolean; done: boolean
}) {
    return (
        <div className={`flex items-center gap-1.5 text-xs transition-colors ${done ? 'text-green-500' : active ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold transition-colors
                ${done ? 'border-green-500 bg-green-500/10' : active ? 'border-primary bg-primary/10' : 'border-border'}`}>
                {done ? '✓' : number}
            </div>
            {label}
        </div>
    )
}
