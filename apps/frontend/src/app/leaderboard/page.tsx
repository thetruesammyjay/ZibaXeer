"use client"

import { ExternalLink } from "lucide-react"
import { Trophy, Award } from "react-bootstrap-icons"
import { useLeaderboard } from "@/hooks/api/useLeaderboard"
import Loading from "@/app/loading"

const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL ?? 'https://paxscan.paxeer.app'

const HEADING = { fontFamily: "var(--font-bricolage, sans-serif)" }
const BODY    = { fontFamily: "var(--font-outfit, sans-serif)" }
const MONO    = { fontFamily: "var(--font-geist-mono, monospace)" }

const PODIUM = [
    {
        Icon: Trophy, label: "#1", rankColor: "#f59e0b",
        bg: "linear-gradient(135deg, rgba(245,158,11,0.10) 0%, rgba(12,18,35,0.80) 100%)",
        border: "rgba(245,158,11,0.30)", glow: "rgba(245,158,11,0.12)",
    },
    {
        Icon: Award,  label: "#2", rankColor: "#94a3b8",
        bg: "linear-gradient(135deg, rgba(148,163,184,0.07) 0%, rgba(12,18,35,0.80) 100%)",
        border: "rgba(148,163,184,0.20)", glow: "rgba(148,163,184,0.08)",
    },
    {
        Icon: Award,  label: "#3", rankColor: "#b45309",
        bg: "linear-gradient(135deg, rgba(180,83,9,0.10) 0%, rgba(12,18,35,0.80) 100%)",
        border: "rgba(180,83,9,0.25)", glow: "rgba(180,83,9,0.10)",
    },
]

export default function LeaderboardPage() {
    const { leaderboard, loading, error } = useLeaderboard()

    return (
        <div className="min-h-screen" style={{ background: "#080d1a" }}>
            {/* Page header */}
            <div
                className="border-b border-white/[0.06] px-4 py-8 md:py-10"
                style={{ background: "linear-gradient(to bottom, rgba(13,22,53,0.6), transparent)" }}
            >
                <div className="container mx-auto">
                    <div className="flex items-center gap-2 mb-1">
                        <Trophy className="h-4 w-4 text-[#f59e0b]" />
                        <p className="section-accent !mb-0">Leaderboard</p>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight" style={HEADING}>
                        Trader Leaderboard
                    </h1>
                    <p className="text-[#64748b] text-sm mt-1" style={BODY}>
                        Top performing traders ranked by Argus Reputation Score — updated in real time.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 pb-16 max-w-4xl space-y-3">
                {loading ? (
                    <Loading />
                ) : error ? (
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-6 text-red-400 text-sm" style={BODY}>
                        ⚠️ Error loading leaderboard data.
                    </div>
                ) : !leaderboard?.data?.length ? (
                    <div
                        className="rounded-2xl border border-white/[0.07] text-center py-16"
                        style={{ background: "rgba(12,18,35,0.5)" }}
                    >
                        <Trophy size={36} color="#475569" className="mb-3" />
                        <p className="font-semibold text-white" style={HEADING}>No traders yet</p>
                        <p className="text-[#475569] text-sm mt-1" style={BODY}>
                            Leaderboard populates as traders join the protocol.
                        </p>
                    </div>
                ) : (
                    leaderboard.data.map((leader, index) => {
                        const podium = PODIUM[index]
                        const isPodium = index < 3

                        return (
                            <a
                                key={leader.id}
                                href={`${EXPLORER_URL}/address/${leader.walletAddress}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block rounded-2xl border transition-all duration-200
                                           hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
                                style={{
                                    background: isPodium
                                        ? podium.bg
                                        : "rgba(12,18,35,0.70)",
                                    borderColor: isPodium
                                        ? podium.border
                                        : "rgba(255,255,255,0.07)",
                                    boxShadow: isPodium
                                        ? `0 0 24px ${podium.glow}`
                                        : "none",
                                }}
                            >
                                <div className="flex items-center gap-4 p-4 md:p-5">
                                    {/* Rank */}
                                    <div
                                        className="flex items-center justify-center min-w-[48px] h-12 rounded-xl shrink-0"
                                        style={isPodium
                                            ? { color: podium.rankColor }
                                            : { color: "#475569", fontFamily: "var(--font-bricolage, sans-serif)", fontSize: "1rem", fontWeight: 700 }
                                        }
                                    >
                                        {isPodium ? <podium.Icon size={24} /> : `#${index + 1}`}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                            <span
                                                className="font-semibold text-white text-sm truncate"
                                                style={MONO}
                                                title={leader.walletAddress}
                                            >
                                                {leader.walletAddress.slice(0, 8)}...{leader.walletAddress.slice(-6)}
                                            </span>
                                            {index < 3 && (
                                                <span
                                                    className="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0"
                                                    style={{
                                                        color: podium.rankColor,
                                                        background: `${podium.rankColor}18`,
                                                        border: `1px solid ${podium.rankColor}30`,
                                                    }}
                                                >
                                                    Top Rated
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-[#475569]" style={BODY}>
                                            Joined {new Date(leader.joinedAt).toLocaleDateString()}
                                        </p>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-6 md:gap-10 shrink-0">
                                        <div className="text-center hidden sm:block">
                                            <div
                                                className="text-xl md:text-2xl font-extrabold"
                                                style={{
                                                    ...HEADING,
                                                    color: isPodium ? podium.rankColor : "#D61F2C",
                                                }}
                                            >
                                                {leader.argusScore}
                                            </div>
                                            <p className="text-[10px] text-[#475569]" style={BODY}>Argus Score</p>
                                        </div>
                                        <div className="text-center">
                                            <div
                                                className="text-xl md:text-2xl font-extrabold text-white"
                                                style={HEADING}
                                            >
                                                {leader._count?.vaultsLed ?? 0}
                                            </div>
                                            <p className="text-[10px] text-[#475569]" style={BODY}>Vaults Led</p>
                                        </div>
                                        <ExternalLink className="h-3.5 w-3.5 text-[#475569] shrink-0 hidden sm:block" />
                                    </div>
                                </div>

                                {/* Argus score bar (podium only) */}
                                {isPodium && (
                                    <div className="px-5 pb-4">
                                        <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-700"
                                                style={{
                                                    width: `${Math.min(100, leader.argusScore)}%`,
                                                    background: `linear-gradient(90deg, ${podium.rankColor}, ${podium.rankColor}80)`,
                                                }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[10px] text-[#475569] mt-1" style={BODY}>
                                            <span>Argus Score</span>
                                            <span>{leader.argusScore}/100</span>
                                        </div>
                                    </div>
                                )}
                            </a>
                        )
                    })
                )}
            </div>
        </div>
    )
}
