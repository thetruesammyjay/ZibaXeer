"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatEther } from "viem"
import { ArrowRight, Filter, TrendingUp, TrendingDown, Users, ExternalLink } from "lucide-react"
import { Search as BiSearch } from "react-bootstrap-icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SubscribeModal } from "@/components/ui/subscribe-modal"
import { useVaults, type VaultData } from "@/hooks/api/useVaults"
import Loading from "@/app/loading"

type RiskFilter = "ALL" | "SAFE" | "MODERATE" | "HIGH"

const FILTERS: { label: string; value: RiskFilter; color: string }[] = [
    { label: "All",      value: "ALL",      color: "default" },
    { label: "🟢 Safe",  value: "SAFE",     color: "safe" },
    { label: "🟡 Mod",   value: "MODERATE", color: "moderate" },
    { label: "🔴 High",  value: "HIGH",     color: "high" },
]

const HEADING = { fontFamily: "var(--font-bricolage, sans-serif)" }
const BODY    = { fontFamily: "var(--font-outfit, sans-serif)" }

function riskBorderClass(score: number) {
    if (score <= 40)  return "risk-safe"
    if (score <= 75)  return "risk-moderate"
    return "risk-high"
}
function riskColor(score: number) {
    if (score <= 40)  return "#22c55e"
    if (score <= 75)  return "#eab308"
    return "#ef4444"
}
function riskLabel(score: number) {
    if (score <= 40)  return "SAFE"
    if (score <= 75)  return "MODERATE"
    return "HIGH"
}

export default function TraderMarketplacePage() {
    const router = useRouter()
    const { vaults, loading, error } = useVaults()
    const [filter, setFilter]   = useState<RiskFilter>("ALL")
    const [selected, setSelected] = useState<VaultData | null>(null)
    const [modalOpen, setModalOpen] = useState(false)

    const displayed = vaults?.filter((v) => {
        if (filter === "SAFE")     return v.riskScore <= 40
        if (filter === "MODERATE") return v.riskScore > 40 && v.riskScore <= 75
        if (filter === "HIGH")     return v.riskScore > 75
        return true
    }) ?? []

    const handleSubscribe = (vault: VaultData) => {
        setSelected(vault)
        setModalOpen(true)
    }

    return (
        <div className="min-h-screen" style={{ background: "#080d1a" }}>
            {/* Page header */}
            <div
                className="border-b border-white/[0.06] px-4 py-8 md:py-10"
                style={{ background: "linear-gradient(to bottom, rgba(13,22,53,0.6), transparent)" }}
            >
                <div className="container mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <p className="section-accent">Marketplace</p>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight" style={HEADING}>
                                Trader Marketplace
                            </h1>
                            <p className="text-[#64748b] text-sm mt-1" style={BODY}>
                                Find top Argus-verified traders and subscribe to copy their strategies.
                            </p>
                        </div>
                        <a
                            href="https://colosseum.hyperpaxeer.com/dashboard"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white
                                       bg-[#D61F2C] hover:bg-[#b91c1c] transition-all min-h-[44px]"
                        >
                            Become a Leader <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                    </div>

                    {/* Segmented filter */}
                    <div className="mt-6 flex items-center gap-1.5 flex-wrap">
                        <Filter className="h-3.5 w-3.5 text-[#475569] shrink-0" />
                        {FILTERS.map((f) => (
                            <button
                                key={f.value}
                                id={`marketplace-filter-${f.value.toLowerCase()}`}
                                onClick={() => setFilter(f.value)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all min-h-[36px]
                                    ${filter === f.value
                                        ? "bg-[#D61F2C] text-white shadow-[0_0_12px_rgba(214,31,44,0.3)]"
                                        : "bg-white/[0.05] text-[#94a3b8] hover:bg-white/[0.08] hover:text-white border border-white/[0.06]"
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                        <span className="ml-auto text-xs text-[#475569]" style={BODY}>
                            {displayed.length} vault{displayed.length !== 1 ? "s" : ""}
                        </span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-8 pb-16">
                {loading ? (
                    <Loading />
                ) : error ? (
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-6 text-red-400 text-sm" style={BODY}>
                        ⚠️ Error loading vault data from the protocol network.
                    </div>
                ) : displayed.length === 0 ? (
                    <div
                        className="rounded-2xl border border-white/[0.07] text-center py-16"
                        style={{ background: "rgba(12,18,35,0.5)" }}
                    >
                        <div className="flex justify-center mb-3 text-[#475569]">
                            <BiSearch size={40} />
                        </div>
                        <p className="font-semibold text-white" style={HEADING}>No vaults match this filter</p>
                        <p className="text-[#475569] text-sm mt-1" style={BODY}>Try "All" or a different risk tier.</p>
                    </div>
                ) : (
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {displayed.map((vault) => {
                            const rc = riskColor(vault.riskScore)
                            const rl = riskLabel(vault.riskScore)
                            const rb = riskBorderClass(vault.riskScore)
                            return (
                                <div
                                    key={vault.id}
                                    className={`relative rounded-2xl border border-white/[0.07] flex flex-col
                                                overflow-hidden transition-all duration-200
                                                hover:border-[rgba(214,31,44,0.25)] hover:-translate-y-1
                                                hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] ${rb}`}
                                    style={{ background: "rgba(12,18,35,0.75)" }}
                                >
                                    {/* Header */}
                                    <div className="p-5 pb-4">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-bold text-white text-lg leading-tight" style={HEADING}>
                                                {vault.name}
                                            </h3>
                                            <span
                                                className="ml-2 px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0"
                                                style={{ color: rc, background: `${rc}18`, border: `1px solid ${rc}30` }}
                                            >
                                                {rl}
                                            </span>
                                        </div>
                                        <p className="text-xs text-[#475569] font-mono" style={{ fontFamily: "var(--font-geist-mono, monospace)" }}>
                                            {vault.leader?.walletAddress.slice(0, 8)}...{vault.leader?.walletAddress.slice(-6)}
                                        </p>
                                    </div>

                                    {/* Stats */}
                                    <div className="px-5 pb-5 grid grid-cols-2 gap-4 border-t border-white/[0.05] pt-4">
                                        <div>
                                            <p className="text-[11px] text-[#475569] mb-1" style={BODY}>Follower TVL</p>
                                            <p className="text-xl font-extrabold text-white" style={HEADING}>
                                                {vault.tvl === "0" ? "0.00" : Number(formatEther(BigInt(vault.tvl))).toFixed(4)}
                                            </p>
                                            <p className="text-[11px] text-[#475569]" style={BODY}>{vault.baseAsset}</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-[#475569] mb-1" style={BODY}>Historical ROI</p>
                                            <p
                                                className="text-xl font-extrabold flex items-center gap-1"
                                                style={{ ...HEADING, color: vault.roi >= 0 ? "#22c55e" : "#ef4444" }}
                                            >
                                                {vault.roi >= 0
                                                    ? <TrendingUp className="h-4 w-4 shrink-0" />
                                                    : <TrendingDown className="h-4 w-4 shrink-0" />
                                                }
                                                {vault.roi > 0 ? "+" : ""}{vault.roi}%
                                            </p>
                                        </div>
                                    </div>

                                    {/* Followers row */}
                                    <div className="px-5 pb-4 flex items-center gap-1.5 text-xs text-[#475569]">
                                        <Users className="h-3.5 w-3.5" />
                                        <span style={BODY}>{vault._count?.followers ?? 0} followers</span>
                                        <span className="mx-1">·</span>
                                        <span style={BODY}>Risk: {vault.riskScore}</span>
                                    </div>

                                    {/* Actions */}
                                    <div className="px-5 pb-5 mt-auto flex flex-col gap-2">
                                        <Button
                                            id={`subscribe-btn-${vault.id}`}
                                            className="w-full font-semibold rounded-xl bg-[#D61F2C] hover:bg-[#b91c1c] text-white
                                                       hover:shadow-[0_0_16px_rgba(214,31,44,0.35)] transition-all min-h-[44px]"
                                            onClick={() => handleSubscribe(vault)}
                                        >
                                            Subscribe to Copy Trade
                                        </Button>
                                        <Button
                                            id={`details-btn-${vault.id}`}
                                            variant="ghost"
                                            className="w-full rounded-xl text-[#94a3b8] hover:text-white hover:bg-white/[0.05] min-h-[44px]"
                                            onClick={() => router.push(`/vaults/${vault.id}`)}
                                        >
                                            Trader Details <ArrowRight className="h-3.5 w-3.5 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            <SubscribeModal
                vault={selected}
                open={modalOpen}
                onClose={() => setModalOpen(false)}
            />
        </div>
    )
}
