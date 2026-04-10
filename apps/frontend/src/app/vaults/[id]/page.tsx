"use client"

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { formatUnits, parseUnits } from 'viem'
import type { Address } from 'viem'
import { ArrowLeft, ExternalLink, Shield, TrendingUp, TrendingDown, Users, Loader2, AlertCircle } from 'lucide-react'
import { ShieldLock } from 'react-bootstrap-icons'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { VaultChart, type ChartDataPoint } from '@/components/ui/vault-chart'
import { SubscribeModal } from '@/components/ui/subscribe-modal'

import { useVault } from '@/hooks/api/useVaults'
import { useVaultData, useFollowerPosition } from '@/hooks/web3/useVault'
import { useTokenInfo } from '@/hooks/web3/useTokenInfo'
import { useSubscribe } from '@/hooks/web3/useSubscribe'

const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL ?? 'https://paxscan.paxeer.app'

const HEADING = { fontFamily: "var(--font-bricolage, sans-serif)" }
const BODY    = { fontFamily: "var(--font-outfit, sans-serif)" }
const MONO    = { fontFamily: "var(--font-geist-mono, monospace)" }

function buildChartData(roi: number): ChartDataPoint[] {
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
    const params   = useParams()
    const router   = useRouter()
    const id       = params?.id as string

    const { vault, loading, error } = useVault(id)
    const { address: userAddress, isConnected } = useAccount()

    const vaultAddress = vault?.contractAddress as Address | undefined
    const { baseAsset, totalVaultTVL, vaultName, leader, refetch } = useVaultData(vaultAddress)
    const { depositedAmount, entryValue } = useFollowerPosition(vaultAddress)
    const { symbol: tokenSymbol, decimals } = useTokenInfo(baseAsset)

    const dec = decimals ?? 18
    const sym = tokenSymbol ?? ''

    const [subscribeOpen, setSubscribeOpen]   = useState(false)
    const [unsubAmount,   setUnsubAmount]     = useState('')

    const { unsubscribe, unsubscribeTxHash, isUnsubscribePending, isUnsubscribeConfirmed, unsubscribeError } =
        useSubscribe(vaultAddress, baseAsset)

    const handleUnsubscribe = () => {
        const raw = unsubAmount ? parseUnits(unsubAmount, dec) : depositedAmount
        unsubscribe(raw)
    }

    /* ── Loading ── */
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: "#080d1a" }}>
                <Loader2 className="h-8 w-8 animate-spin text-[#D61F2C]" />
            </div>
        )
    }

    /* ── Error ── */
    if (error || !vault) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8" style={{ background: "#080d1a" }}>
                <AlertCircle className="h-12 w-12 text-red-500" />
                <p className="text-lg font-semibold text-white" style={HEADING}>Vault not found</p>
                <Button variant="outline" onClick={() => router.push('/vaults')} className="min-h-[44px]">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Marketplace
                </Button>
            </div>
        )
    }

    const riskColor = vault.riskScore > 75 ? '#ef4444' : vault.riskScore > 40 ? '#eab308' : '#22c55e'
    const riskLabel = vault.riskScore > 75 ? 'HIGH' : vault.riskScore > 40 ? 'MODERATE' : 'SAFE'
    const roiPositive = vault.roi >= 0
    const chartData   = buildChartData(vault.roi)

    const onChainTVLFormatted = totalVaultTVL > BigInt(0)
        ? `${Number(formatUnits(totalVaultTVL, dec)).toFixed(4)} ${sym}`
        : vault.tvl === '0' ? `0.00 ${sym}` : `${Number(formatUnits(BigInt(vault.tvl), dec)).toFixed(4)} ${sym}`

    const userDepositFormatted = depositedAmount > BigInt(0)
        ? `${Number(formatUnits(depositedAmount, dec)).toFixed(4)} ${sym}`
        : null

    return (
        <div className="min-h-screen" style={{ background: "#080d1a" }}>

            {/* ── Hero Header ── */}
            <div
                className="border-b border-white/[0.06] px-4 py-8 md:py-10"
                style={{ background: "linear-gradient(to bottom, rgba(13,22,53,0.7), transparent)" }}
            >
                <div className="container mx-auto max-w-4xl">
                    {/* Back */}
                    <button
                        onClick={() => router.push('/vaults')}
                        className="flex items-center gap-1.5 text-xs text-[#64748b] hover:text-white transition-colors mb-5 min-h-[36px]"
                        style={BODY}
                    >
                        <ArrowLeft className="h-3.5 w-3.5" /> Marketplace
                    </button>

                    <div className="flex flex-col md:flex-row justify-between items-start gap-5">
                        <div>
                            <div className="flex flex-wrap items-center gap-2.5 mb-2">
                                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight" style={HEADING}>
                                    {vaultName ?? vault.name}
                                </h1>
                                <span
                                    className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                                    style={{ color: riskColor, background: `${riskColor}18`, border: `1px solid ${riskColor}30` }}
                                >
                                    {riskLabel}
                                </span>
                                <Badge variant={vault.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs">
                                    {vault.status}
                                </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#64748b]">
                                <span style={BODY}>Leader: <a
                                    href={`${EXPLORER_URL}/address/${leader ?? vault.leader?.walletAddress}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="font-mono text-[#5BC0EB] hover:underline"
                                    style={MONO}
                                >
                                    {(leader ?? vault.leader?.walletAddress ?? '').slice(0, 8)}...{(leader ?? vault.leader?.walletAddress ?? '').slice(-6)}
                                    <ExternalLink className="inline h-3 w-3 ml-0.5" />
                                </a></span>
                                <span style={BODY}>Contract: <a
                                    href={`${EXPLORER_URL}/address/${vault.contractAddress}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="font-mono text-[#475569] hover:text-white hover:underline"
                                    style={MONO}
                                >
                                    {vault.contractAddress.slice(0, 8)}...{vault.contractAddress.slice(-6)}
                                    <ExternalLink className="inline h-3 w-3 ml-0.5" />
                                </a></span>
                            </div>
                        </div>

                        {isConnected && (
                            <Button
                                id="vault-detail-subscribe-btn"
                                onClick={() => setSubscribeOpen(true)}
                                className="shrink-0 bg-[#D61F2C] hover:bg-[#b91c1c] font-semibold px-6 rounded-xl
                                           hover:shadow-[0_0_20px_rgba(214,31,44,0.4)] transition-all min-h-[48px]"
                            >
                                Subscribe to Copy Trade
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 space-y-6 max-w-4xl pb-16">

                {/* ── On-chain Stats ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        {
                            label: "On-Chain TVL", value: onChainTVLFormatted,
                            icon: <TrendingUp className="h-4 w-4" />, color: "#5BC0EB",
                        },
                        {
                            label: "Historical ROI", value: `${roiPositive ? '+' : ''}${vault.roi}%`,
                            icon: roiPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />,
                            color: roiPositive ? "#22c55e" : "#ef4444",
                            valueColor: roiPositive ? "#22c55e" : "#ef4444",
                        },
                        {
                            label: "Max Drawdown", value: `-${vault.drawdown}%`,
                            icon: <Shield className="h-4 w-4" />, color: "#f59e0b",
                            valueColor: "#f59e0b",
                        },
                        {
                            label: "Followers", value: String(vault._count?.followers ?? 0),
                            icon: <Users className="h-4 w-4" />, color: "#94a3b8",
                        },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-2xl p-4 border border-white/[0.07]"
                            style={{ background: "rgba(12,18,35,0.8)" }}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] text-[#475569]" style={BODY}>{stat.label}</span>
                                <span style={{ color: stat.color }}>{stat.icon}</span>
                            </div>
                            <div
                                className="text-xl font-extrabold"
                                style={{ ...HEADING, color: stat.valueColor ?? "white" }}
                            >
                                {stat.value}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Chart ── */}
                <div
                    className="rounded-2xl border border-white/[0.07] p-5"
                    style={{ background: "rgba(12,18,35,0.7)" }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-white" style={HEADING}>Performance (30 Days)</h2>
                        <span className="text-xs text-[#475569]" style={BODY}>Synthetic until live history endpoint</span>
                    </div>
                    <VaultChart data={chartData} positive={roiPositive} />
                </div>

                {/* ── My Position (if subscribed) ── */}
                {isConnected && userDepositFormatted && (
                    <div
                        className="rounded-2xl border p-5 space-y-4"
                        style={{
                            background: "rgba(214,31,44,0.04)",
                            borderColor: "rgba(214,31,44,0.25)",
                        }}
                    >
                        <h2 className="text-base font-semibold text-white" style={HEADING}>My Position</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-[#475569] mb-1" style={BODY}>Deposited</p>
                                <p className="text-lg font-bold text-white" style={HEADING}>{userDepositFormatted}</p>
                            </div>
                            <div>
                                <p className="text-xs text-[#475569] mb-1" style={BODY}>Entry Watermark</p>
                                <p className="font-mono text-sm text-[#94a3b8]" style={MONO}>
                                    {Number(formatUnits(entryValue, dec)).toFixed(4)} {sym}
                                </p>
                            </div>
                        </div>

                        {/* Withdraw */}
                        <div className="border-t border-white/[0.06] pt-4 space-y-3">
                            <p className="text-sm font-semibold text-white" style={HEADING}>Withdraw Position</p>
                            <div className="flex gap-2">
                                <input
                                    id="unsubscribe-amount"
                                    type="number" min="0" step="any"
                                    value={unsubAmount}
                                    onChange={(e) => setUnsubAmount(e.target.value)}
                                    disabled={isUnsubscribePending}
                                    placeholder={`Max: ${Number(formatUnits(depositedAmount, dec)).toFixed(4)}`}
                                    className="flex-1 rounded-xl border border-white/[0.10] bg-white/[0.04]
                                               px-3 py-2 text-sm text-white focus:outline-none focus:ring-2
                                               focus:ring-[#D61F2C]/40 disabled:opacity-50 min-h-[44px]"
                                />
                                <Button
                                    id="unsubscribe-btn"
                                    variant="outline"
                                    disabled={isUnsubscribePending || depositedAmount === BigInt(0)}
                                    onClick={handleUnsubscribe}
                                    className="rounded-xl text-red-400 border-red-500/30 hover:bg-red-500/10 shrink-0 min-h-[44px]"
                                >
                                    {isUnsubscribePending
                                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Withdrawing...</>
                                        : "Withdraw"
                                    }
                                </Button>
                            </div>
                            <p className="text-xs text-[#475569]" style={BODY}>Leave blank to withdraw 100% of your position.</p>
                            {isUnsubscribeConfirmed && unsubscribeTxHash && (
                                <a
                                    href={`${EXPLORER_URL}/tx/${unsubscribeTxHash}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-green-400 hover:underline"
                                >
                                    Withdrawal confirmed <ExternalLink className="h-3 w-3" />
                                </a>
                            )}
                            {unsubscribeError && (
                                <p className="text-xs text-red-400" style={BODY}>
                                    {(unsubscribeError as { shortMessage?: string })?.shortMessage ?? 'Withdrawal failed'}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Connect prompt ── */}
                {!isConnected && (
                    <div
                        className="rounded-2xl border border-white/[0.07] text-center p-10"
                        style={{ background: "rgba(12,18,35,0.5)" }}
                    >
                        <div className="flex justify-center mb-3 text-[#475569]">
                            <ShieldLock size={44} />
                        </div>
                        <p className="text-lg font-semibold text-white mb-2" style={HEADING}>Connect Your Wallet</p>
                        <p className="text-[#64748b] text-sm" style={BODY}>
                            Connect your Paxeer wallet to subscribe and start copy-trading this vault.
                        </p>
                    </div>

                )}
            </div>

            <SubscribeModal
                vault={vault}
                open={subscribeOpen}
                onClose={() => { setSubscribeOpen(false); refetch() }}
            />
        </div>
    )
}
