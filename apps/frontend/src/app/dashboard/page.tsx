"use client"

import Link from "next/link"
import { useAccount } from "wagmi"
import { formatUnits } from "viem"
import {
    TrendingUp, DollarSign, BarChart2, Layers,
    ArrowRight, Wallet, Activity
} from "lucide-react"
import { ShieldLock } from "react-bootstrap-icons"
import { useGlobalAnalytics } from "@/hooks/api/useAnalytics"
import { useVaults } from "@/hooks/api/useVaults"
import { useUserPortfolio } from "@/hooks/web3/useUserPortfolio"
import { Badge } from "@/components/ui/badge"

const HEADING = { fontFamily: "var(--font-bricolage, sans-serif)" }
const BODY    = { fontFamily: "var(--font-outfit, sans-serif)" }

export default function DashboardPage() {
    const { isConnected } = useAccount()
    const { analytics, loading } = useGlobalAnalytics()
    const { vaults } = useVaults()
    const vaultAddresses = vaults.map((v) => v.contractAddress)
    const { totalDepositedFormatted, isLoading: portfolioLoading } = useUserPortfolio(vaultAddresses)

    return (
        <div className="min-h-screen" style={{ background: "#080d1a" }}>
            {/* Page header gradient */}
            <div
                className="border-b border-white/[0.06] px-4 py-8 md:py-10"
                style={{ background: "linear-gradient(to bottom, rgba(13,22,53,0.6), transparent)" }}
            >
                <div className="container mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2.5 mb-1">
                            <span className="pulse-dot w-2 h-2 rounded-full bg-green-400 shrink-0" />
                            <span className="text-xs text-[#64748b] uppercase tracking-widest" style={BODY}>Live Protocol Data</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight" style={HEADING}>
                            Dashboard
                        </h1>
                        <p className="text-[#64748b] text-sm mt-1" style={BODY}>
                            Global protocol analytics and your personal vault positions.
                        </p>
                    </div>
                    <Link
                        href="/vaults"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white
                                   bg-[#D61F2C] hover:bg-[#b91c1c] transition-all min-h-[44px]"
                    >
                        Explore Vaults <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 space-y-8 pb-16">

                {/* ── Analytics Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {/* My Capital */}
                    <div
                        className="relative rounded-2xl p-5 border border-white/[0.07] overflow-hidden"
                        style={{ background: "rgba(12,18,35,0.8)" }}
                    >
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#D61F2C]" />
                        <div className="flex items-start justify-between mb-3">
                            <p className="text-xs text-[#64748b] uppercase tracking-wider" style={BODY}>My Capital</p>
                            <div className="rounded-lg p-1.5 bg-[#D61F2C]/10"><Wallet className="h-3.5 w-3.5 text-[#D61F2C]" /></div>
                        </div>
                        <div className="text-2xl md:text-3xl font-extrabold text-white" style={HEADING}>
                            {!isConnected ? "—" : portfolioLoading ? "..." : Number(totalDepositedFormatted).toFixed(4)}
                        </div>
                        <p className="text-[11px] text-[#475569] mt-1" style={BODY}>
                            {isConnected ? "Across active vaults" : "Connect wallet"}
                        </p>
                    </div>

                    {/* TVL */}
                    <div
                        className="relative rounded-2xl p-5 border border-white/[0.07] overflow-hidden"
                        style={{ background: "rgba(12,18,35,0.8)" }}
                    >
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#5BC0EB]" />
                        <div className="flex items-start justify-between mb-3">
                            <p className="text-xs text-[#64748b] uppercase tracking-wider" style={BODY}>Protocol TVL</p>
                            <div className="rounded-lg p-1.5 bg-[#5BC0EB]/10"><DollarSign className="h-3.5 w-3.5 text-[#5BC0EB]" /></div>
                        </div>
                        <div className="text-2xl md:text-3xl font-extrabold text-white" style={HEADING}>
                            {loading ? "..." : analytics?.totalTvl ? Number(formatUnits(BigInt(analytics.totalTvl), 18)).toFixed(2) : "0.00"}
                        </div>
                        <p className="text-[11px] text-[#475569] mt-1" style={BODY}>Aggregated capital (PAX)</p>
                    </div>

                    {/* Win Rate */}
                    <div
                        className="relative rounded-2xl p-5 border border-white/[0.07] overflow-hidden"
                        style={{ background: "rgba(12,18,35,0.8)" }}
                    >
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-green-500" />
                        <div className="flex items-start justify-between mb-3">
                            <p className="text-xs text-[#64748b] uppercase tracking-wider" style={BODY}>Win Rate</p>
                            <div className="rounded-lg p-1.5 bg-green-500/10"><TrendingUp className="h-3.5 w-3.5 text-green-500" /></div>
                        </div>
                        <div className="text-2xl md:text-3xl font-extrabold text-green-400" style={HEADING}>
                            {loading ? "..." : `${analytics?.winRate ?? 0}%`}
                        </div>
                        <p className="text-[11px] text-[#475569] mt-1" style={BODY}>
                            Over {analytics?.totalTrades ?? 0} trades
                        </p>
                    </div>

                    {/* Active Vaults */}
                    <div
                        className="relative rounded-2xl p-5 border border-white/[0.07] overflow-hidden"
                        style={{ background: "rgba(12,18,35,0.8)" }}
                    >
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-purple-500" />
                        <div className="flex items-start justify-between mb-3">
                            <p className="text-xs text-[#64748b] uppercase tracking-wider" style={BODY}>Active Vaults</p>
                            <div className="rounded-lg p-1.5 bg-purple-500/10"><Layers className="h-3.5 w-3.5 text-purple-400" /></div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <div className="text-2xl md:text-3xl font-extrabold text-white" style={HEADING}>
                                {loading ? "..." : analytics?.activeVaultsCount ?? 0}
                            </div>
                            <Badge variant="secondary" className="text-[10px]">Live</Badge>
                        </div>
                        <p className="text-[11px] text-[#475569] mt-1" style={BODY}>Argus-validated leaders</p>
                    </div>
                </div>

                {/* ── Vault Network ── */}
                {isConnected ? (
                    <div>
                        <div className="flex items-center gap-3 mb-5">
                            <BarChart2 className="h-5 w-5 text-[#D61F2C]" />
                            <h2 className="text-xl font-bold text-white" style={HEADING}>Vault Network</h2>
                            <Activity className="h-3.5 w-3.5 text-[#22c55e] ml-auto" />
                            <span className="text-xs text-[#22c55e]">Live</span>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {vaults.map((vault) => (
                                <Link key={vault.id} href={`/vaults/${vault.id}`} className="group block">
                                    <div
                                        className="rounded-2xl p-5 border border-white/[0.07] transition-all duration-200
                                                   hover:border-[rgba(214,31,44,0.3)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]
                                                   hover:-translate-y-1 cursor-pointer h-full"
                                        style={{ background: "rgba(12,18,35,0.7)" }}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-white text-base leading-tight" style={HEADING}>
                                                    {vault.name}
                                                </h3>
                                                <p className="text-xs text-[#64748b] mt-0.5" style={BODY}>
                                                    {vault._count?.followers ?? 0} followers
                                                </p>
                                            </div>
                                            <Badge
                                                variant={vault.roi > 0 ? "default" : "destructive"}
                                                className="shrink-0 ml-2"
                                            >
                                                {vault.roi > 0 ? "+" : ""}{vault.roi}% ROI
                                            </Badge>
                                        </div>
                                        <div>
                                            <div className="text-xl font-extrabold text-white" style={HEADING}>
                                                {vault.tvl === "0" ? "0.00" : Number(formatUnits(BigInt(vault.tvl), 18)).toFixed(4)}
                                            </div>
                                            <p className="text-xs text-[#475569]" style={BODY}>
                                                {vault.baseAsset} · Total Vault Value
                                            </p>
                                        </div>
                                        <div className="mt-4 flex items-center gap-1 text-xs text-[#D61F2C] opacity-0 group-hover:opacity-100 transition-opacity" style={BODY}>
                                            View Vault <ArrowRight className="h-3 w-3" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div
                        className="rounded-2xl border border-white/[0.07] p-12 md:p-16 text-center"
                        style={{ background: "rgba(12,18,35,0.5)" }}
                    >
                        <div className="flex justify-center mb-4 text-[#475569]">
                            <ShieldLock size={48} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2" style={HEADING}>Connect Your Wallet</h3>
                        <p className="text-[#64748b] text-sm max-w-sm mx-auto" style={BODY}>
                            Connect your Paxeer wallet to view your portfolio and active copy-trading vaults.
                        </p>
                    </div>
                )}

            </div>
        </div>
    )
}
