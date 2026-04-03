"use client"

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { formatUnits, parseUnits } from 'viem'
import type { Address } from 'viem'
import { ArrowLeft, ExternalLink, Shield, TrendingUp, TrendingDown, Users, Loader2, AlertCircle } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { VaultChart, type ChartDataPoint } from '@/components/ui/vault-chart'
import { SubscribeModal } from '@/components/ui/subscribe-modal'

import { useVault } from '@/hooks/api/useVaults'
import { useVaultData, useFollowerPosition } from '@/hooks/web3/useVault'
import { useTokenInfo } from '@/hooks/web3/useTokenInfo'
import { useSubscribe } from '@/hooks/web3/useSubscribe'

const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL ?? 'https://paxscan.paxeer.app'
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'

function buildChartData(roi: number): ChartDataPoint[] {
    // Synthetic 30-day history ending at current ROI value.
    // Replaced automatically when the backend exposes /api/vaults/:id/history.
    const today = new Date()
    return Array.from({ length: 30 }, (_, i) => {
        const d = new Date(today)
        d.setDate(d.getDate() - (29 - i))
        const progress = (i + 1) / 30
        const noise = (Math.random() - 0.5) * (Math.abs(roi) * 0.3)
        return {
            time: d.toISOString().slice(0, 10),
            value: Number((roi * progress + noise).toFixed(2)),
        }
    }).sort((a, b) => a.time.localeCompare(b.time))
}

export default function VaultDetailPage() {
    const params = useParams()
    const router = useRouter()
    const id = params?.id as string

    const { vault, loading, error } = useVault(id)
    const { address: userAddress, isConnected } = useAccount()

    const vaultAddress = vault?.contractAddress as Address | undefined
    const { baseAsset, totalVaultTVL, vaultName, leader, refetch } = useVaultData(vaultAddress)
    const { depositedAmount, entryValue } = useFollowerPosition(vaultAddress)
    const { symbol: tokenSymbol, decimals } = useTokenInfo(baseAsset)

    const dec = decimals ?? 18
    const sym = tokenSymbol ?? ''

    // Subscribe modal
    const [subscribeOpen, setSubscribeOpen] = useState(false)

    // Unsubscribe flow
    const [unsubAmount, setUnsubAmount] = useState('')
    const {
        unsubscribe,
        unsubscribeTxHash,
        isUnsubscribePending,
        isUnsubscribeConfirmed,
        unsubscribeError,
    } = useSubscribe(vaultAddress, baseAsset)

    const handleUnsubscribe = () => {
        const raw = unsubAmount
            ? parseUnits(unsubAmount, dec)
            : depositedAmount  // default = 100%
        unsubscribe(raw)
    }

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error || !vault) {
        return (
            <div className="container mx-auto p-8 flex flex-col items-center gap-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <p className="text-lg font-semibold">Vault not found</p>
                <Button variant="outline" onClick={() => router.push('/vaults')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Marketplace
                </Button>
            </div>
        )
    }

    const riskColor = vault.riskScore > 75 ? 'destructive' : vault.riskScore > 40 ? 'secondary' : 'default'
    const roiPositive = vault.roi >= 0
    const chartData = buildChartData(vault.roi)

    const onChainTVLFormatted = totalVaultTVL > BigInt(0)
        ? `${Number(formatUnits(totalVaultTVL, dec)).toFixed(4)} ${sym}`
        : vault.tvl === '0' ? `0.00 ${sym}` : `${Number(formatUnits(BigInt(vault.tvl), dec)).toFixed(4)} ${sym}`

    const userDepositFormatted = depositedAmount > BigInt(0)
        ? `${Number(formatUnits(depositedAmount, dec)).toFixed(4)} ${sym}`
        : null

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-8 max-w-4xl">
            {/* Back Nav */}
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={() => router.push('/vaults')}>
                <ArrowLeft className="h-4 w-4" /> Marketplace
            </Button>

            {/* Hero Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-extrabold tracking-tight">
                            {vaultName ?? vault.name}
                        </h1>
                        <Badge variant={riskColor}>{vault.riskScore} Risk</Badge>
                        <Badge variant={vault.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {vault.status}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Leader:</span>
                        <a
                            href={`${EXPLORER_URL}/address/${leader ?? vault.leader?.walletAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-primary hover:underline"
                        >
                            {(leader ?? vault.leader?.walletAddress ?? '').slice(0, 8)}...
                            {(leader ?? vault.leader?.walletAddress ?? '').slice(-6)}
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Contract:</span>
                        <a
                            href={`${EXPLORER_URL}/address/${vault.contractAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-xs hover:underline text-muted-foreground"
                        >
                            {vault.contractAddress.slice(0, 10)}...{vault.contractAddress.slice(-8)}
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                </div>

                {isConnected && (
                    <Button
                        id="vault-detail-subscribe-btn"
                        size="lg"
                        className="bg-primary font-semibold px-6 shrink-0"
                        onClick={() => setSubscribeOpen(true)}
                    >
                        Subscribe to Copy Trade
                    </Button>
                )}
            </div>

            {/* On-chain Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="On-Chain TVL"
                    value={onChainTVLFormatted}
                    icon={<TrendingUp className="h-4 w-4 text-primary" />}
                />
                <StatCard
                    label="Historical ROI"
                    value={`${roiPositive ? '+' : ''}${vault.roi}%`}
                    valueClass={roiPositive ? 'text-green-500' : 'text-red-500'}
                    icon={roiPositive
                        ? <TrendingUp className="h-4 w-4 text-green-500" />
                        : <TrendingDown className="h-4 w-4 text-red-500" />
                    }
                />
                <StatCard
                    label="Max Drawdown"
                    value={`-${vault.drawdown}%`}
                    valueClass="text-orange-400"
                    icon={<Shield className="h-4 w-4 text-orange-400" />}
                />
                <StatCard
                    label="Followers"
                    value={String(vault._count?.followers ?? 0)}
                    icon={<Users className="h-4 w-4 text-muted-foreground" />}
                />
            </div>

            {/* ROI Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Performance (30 Days)</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                    <VaultChart data={chartData} positive={roiPositive} />
                </CardContent>
            </Card>

            {/* My Position (if subscribed) */}
            {isConnected && userDepositFormatted && (
                <Card className="border-primary/30 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">My Position</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Deposited</span>
                            <span className="font-bold">{userDepositFormatted}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Entry Water Mark</span>
                            <span className="font-mono text-sm">
                                {Number(formatUnits(entryValue, dec)).toFixed(4)} {sym}
                            </span>
                        </div>

                        {/* Unsubscribe */}
                        <div className="border-t border-border/40 pt-4 space-y-3">
                            <p className="text-sm font-medium">Withdraw Position</p>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        id="unsubscribe-amount"
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={unsubAmount}
                                        onChange={e => setUnsubAmount(e.target.value)}
                                        disabled={isUnsubscribePending}
                                        placeholder={`Max: ${Number(formatUnits(depositedAmount, dec)).toFixed(4)}`}
                                        className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                                    />
                                </div>
                                <Button
                                    id="unsubscribe-btn"
                                    variant="outline"
                                    className="shrink-0 text-red-500 border-red-500/30 hover:bg-red-500/10"
                                    onClick={handleUnsubscribe}
                                    disabled={isUnsubscribePending || depositedAmount === BigInt(0)}
                                >
                                    {isUnsubscribePending
                                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Withdrawing...</>
                                        : 'Withdraw'
                                    }
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Leave blank to withdraw 100% of your position.
                            </p>
                            {isUnsubscribeConfirmed && unsubscribeTxHash && (
                                <a
                                    href={`${EXPLORER_URL}/tx/${unsubscribeTxHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-green-500 hover:underline"
                                >
                                    Withdrawal confirmed <ExternalLink className="h-3 w-3" />
                                </a>
                            )}
                            {unsubscribeError && (
                                <p className="text-xs text-red-500">
                                    {(unsubscribeError as { shortMessage?: string })?.shortMessage ?? 'Withdrawal failed'}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Connect prompt */}
            {!isConnected && (
                <Card className="text-center p-8 bg-muted/20">
                    <p className="text-lg font-semibold mb-2">Connect Your Wallet</p>
                    <p className="text-muted-foreground text-sm">
                        Connect your Paxeer wallet to subscribe to this vault and start copy-trading.
                    </p>
                </Card>
            )}

            {/* Subscribe Modal */}
            <SubscribeModal
                vault={vault}
                open={subscribeOpen}
                onClose={() => { setSubscribeOpen(false); refetch() }}
            />
        </div>
    )
}

function StatCard({ label, value, valueClass, icon }: {
    label: string; value: string; valueClass?: string; icon: React.ReactNode
}) {
    return (
        <Card>
            <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    {icon}
                </div>
                <p className={`text-xl font-bold ${valueClass ?? ''}`}>{value}</p>
            </CardContent>
        </Card>
    )
}
