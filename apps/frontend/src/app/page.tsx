"use client"

import Link from "next/link"
import { formatUnits } from "viem"
import { useGlobalAnalytics } from "@/hooks/api/useAnalytics"
import { useLeaderboard } from "@/hooks/api/useLeaderboard"
import { ChevronDown, ShieldCheck, Lock, TrendingUp, Zap, Eye, Gauge, ExternalLink } from "lucide-react"
import {
    BarChart, GraphUpArrow, Lightning, CurrencyExchange,
    EyeSlash, Bank, CashStack,
    Search, CreditCard, RocketTakeoff,
    Trophy, Award,
    ShieldLock, Gem, LightningFill, Coin, Shield,
} from "react-bootstrap-icons"

const EXPLORER = "https://paxscan.paxeer.app"

export default function LandingPage() {
    const { analytics, loading: analyticsLoading } = useGlobalAnalytics()
    const { leaderboard, loading: lbLoading } = useLeaderboard()

    const tvlFormatted = analytics?.totalTvl
        ? Number(formatUnits(BigInt(analytics.totalTvl), 18)).toLocaleString("en-US", { maximumFractionDigits: 2 })
        : "—"

    return (
        <div className="relative min-h-screen overflow-x-hidden" style={{ background: "#07090f" }}>

            {/* ── Fixed Background Layer (blobs + grid) ── */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
                <div className="float-anim absolute" style={{ width: "min(600px,90vw)", height: "min(600px,90vw)", top: "-10%", right: "-15%", background: "radial-gradient(circle,rgba(214,31,44,0.18) 0%,transparent 70%)", borderRadius: "9999px", filter: "blur(60px)", animationDelay: "0s" }} />
                <div className="float-slow absolute" style={{ width: "min(500px,80vw)", height: "min(500px,80vw)", bottom: "5%", left: "-12%", background: "radial-gradient(circle,rgba(91,192,235,0.14) 0%,transparent 70%)", borderRadius: "9999px", filter: "blur(60px)", animationDelay: "1.5s" }} />
                <div className="float-anim absolute" style={{ width: "min(400px,70vw)", height: "min(400px,70vw)", top: "40%", left: "50%", transform: "translate(-50%,-50%)", background: "radial-gradient(circle,rgba(139,92,246,0.08) 0%,transparent 70%)", borderRadius: "9999px", filter: "blur(60px)", animationDelay: "0.8s" }} />
                <div className="bg-grid absolute inset-0" />
            </div>

            {/* ── Floating BI Icons (decorative) ── */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
                <div className="float-emoji emoji-d1 absolute" style={{ top: "12%", left: "5%", color: "#D61F2C", opacity: 0.12 }}>
                    <GraphUpArrow size={38} />
                </div>
                <div className="float-emoji emoji-d2 absolute hidden sm:block" style={{ top: "25%", right: "6%", color: "#5BC0EB", opacity: 0.10 }}>
                    <Coin size={34} />
                </div>
                <div className="float-emoji emoji-d3 absolute" style={{ top: "55%", left: "3%", color: "#D61F2C", opacity: 0.11 }}>
                    <ShieldLock size={32} />
                </div>
                <div className="float-emoji emoji-d4 absolute hidden md:block" style={{ top: "70%", right: "8%", color: "#5BC0EB", opacity: 0.10 }}>
                    <LightningFill size={30} />
                </div>
                <div className="float-emoji emoji-d5 absolute hidden sm:block" style={{ top: "38%", right: "3%", color: "#a855f7", opacity: 0.09 }}>
                    <Gem size={28} />
                </div>
                <div className="float-emoji emoji-d2 absolute hidden lg:block" style={{ top: "82%", left: "12%", color: "#5BC0EB", opacity: 0.09 }}>
                    <Shield size={26} />
                </div>
                <div className="float-emoji emoji-d3 absolute hidden md:block" style={{ top: "18%", left: "48%", color: "#f59e0b", opacity: 0.09 }}>
                    <Trophy size={28} />
                </div>
            </div>

            {/* Spacer for pill nav */}
            <div className="h-20 md:h-24" />

            {/* ═══════════════════════════════════════
                SECTION 1 — HERO
            ═══════════════════════════════════════ */}
            <section className="relative px-4 pt-8 pb-16 md:pt-16 md:pb-24 text-center">
                <div className="mx-auto max-w-4xl">
                    <div className="fade-in-up d1 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] border border-white/[0.10] mb-8 text-sm text-[#94a3b8]">
                        <span className="pulse-dot w-2 h-2 rounded-full bg-green-400" />
                        HyperPaxeer Mainnet Live · Chain ID 125
                    </div>

                    <h1
                        className="fade-in-up d2 text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6"
                        style={{ fontFamily: "var(--font-bricolage, sans-serif)" }}
                    >
                        <span className="block text-white">The Capital Layer of</span>
                        <span className="gradient-text">Web3 Copy Trading.</span>
                    </h1>


                    <p className="fade-in-up d3 text-base sm:text-lg md:text-xl text-[#94a3b8] max-w-2xl mx-auto leading-relaxed mb-4" style={{ fontFamily: "var(--font-outfit, sans-serif)" }}>
                        Mirror top Colosseum traders on HyperPaxeer — transparently, non-custodially, with
                        configurable risk. Performance-only fees. You keep full custody of your capital.
                    </p>

                    <p className="fade-in-up d4 text-sm text-[#64748b] max-w-xl mx-auto mb-10 leading-relaxed" style={{ fontFamily: "var(--font-outfit, sans-serif)" }}>
                        ZibaXeer connects retail investors with Argus-verified Colosseum strategy vaults.
                        Subscribe with any ERC-20 allocation. Profits mirror automatically. Leave anytime.
                    </p>

                    <div className="fade-in-up d5 flex flex-col sm:flex-row gap-3 justify-center items-center">
                        <Link href="/dashboard" className="w-full sm:w-auto px-7 py-3.5 rounded-full font-semibold text-sm text-white bg-[#D61F2C] hover:bg-[#b91c1c] glow-pulse transition-all duration-200 hover:shadow-[0_0_24px_rgba(214,31,44,0.50)] min-h-[48px] flex items-center justify-center">
                            Launch App →
                        </Link>
                        <Link href="/vaults" className="w-full sm:w-auto px-7 py-3.5 rounded-full font-semibold text-sm text-white border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/[0.20] transition-all duration-200 min-h-[48px] flex items-center justify-center">
                            Explore Vaults
                        </Link>
                    </div>

                    <div className="bounce-slow mt-16 flex justify-center text-[#475569]">
                        <ChevronDown className="h-5 w-5" />
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                SECTION 2 — PROTOCOL STATS
            ═══════════════════════════════════════ */}
            <section className="px-4 pb-20 md:pb-28">
                <div className="mx-auto max-w-5xl">
                    <div className="mx-auto max-w-xs sm:max-w-none grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        {[
                            { label: "Active Vaults",    Icon: BarChart,         value: analyticsLoading ? "..." : String(analytics?.activeVaultsCount ?? 0), suffix: "",    accent: "#D61F2C" },
                            { label: "Protocol TVL",     Icon: CurrencyExchange,  value: analyticsLoading ? "..." : tvlFormatted,                             suffix: " PAX", accent: "#5BC0EB" },
                            { label: "Global Win Rate",  Icon: GraphUpArrow,      value: analyticsLoading ? "..." : String(analytics?.winRate ?? 0),          suffix: "%",   accent: "#22c55e" },
                            { label: "Total Trades",     Icon: Lightning,         value: analyticsLoading ? "..." : String(analytics?.totalTrades ?? 0),      suffix: "",    accent: "#a855f7" },
                        ].map((stat) => (
                            <div key={stat.label} className="glass-card p-5 md:p-6 text-center">
                                <div className="flex justify-center mb-3" style={{ color: stat.accent, opacity: 0.85 }}>
                                    <stat.Icon size={26} />
                                </div>
                                <div className="text-2xl md:text-3xl font-extrabold mb-1" style={{ fontFamily: "var(--font-bricolage, sans-serif)", color: stat.accent }}>
                                    {stat.value}{stat.suffix}
                                </div>
                                <div className="text-xs text-[#64748b]" style={{ fontFamily: "var(--font-outfit, sans-serif)" }}>
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                SECTION 3 — PROBLEM / SOLUTION
            ═══════════════════════════════════════ */}
            <section className="px-4 py-16 md:py-24">
                <div className="mx-auto max-w-5xl">
                    <div className="text-center mb-12">
                        <p className="section-accent">The Problem</p>
                        <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "var(--font-bricolage, sans-serif)" }}>
                            Copy trading is broken.
                            <span className="gradient-text"> We fixed it.</span>
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 md:gap-6">
                        {[
                            {
                                ProblemIcon: EyeSlash,  problemTitle: "Opacity",
                                problemDesc: "Most platforms hide trade execution behind closed systems. You can't verify what's happening with your capital.",
                                SolutionIcon: Eye,      solution: "Full On-Chain Transparency",
                                solutionDesc: "Every trade is on-chain. Query any vault's history on PaxScan at any time. Verify before you trust.",
                                color: "#5BC0EB",
                            },
                            {
                                ProblemIcon: Bank,      problemTitle: "Custody Risk",
                                problemDesc: "When a platform holds your funds, you're exposed to hacks, insolvencies, and exit scams.",
                                SolutionIcon: Lock,     solution: "Non-Custodial Vaults",
                                solutionDesc: "Your capital never leaves smart contracts you can verify. Leaders can only trade — never withdraw your funds.",
                                color: "#22c55e",
                            },
                            {
                                ProblemIcon: CashStack,    problemTitle: "Misaligned Fees",
                                problemDesc: "Managers charge management fees even when they lose money. Their success isn't tied to yours.",
                                SolutionIcon: TrendingUp,  solution: "Performance-Only Revenue",
                                solutionDesc: "Leaders earn on your profits only. If they don't make money for you, they make zero. True alignment.",
                                color: "#D61F2C",
                            },
                        ].map((item) => (
                            <div key={item.problemTitle} className="glass-card p-6 flex flex-col gap-5">
                                <div>
                                    <div className="flex items-center gap-2 mb-2 text-[#94a3b8]" style={{ fontFamily: "var(--font-bricolage, sans-serif)" }}>
                                        <item.ProblemIcon size={16} />
                                        <span className="text-base font-semibold">{item.problemTitle}</span>
                                    </div>
                                    <p className="text-sm text-[#475569] leading-relaxed" style={{ fontFamily: "var(--font-outfit, sans-serif)" }}>
                                        {item.problemDesc}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 text-[#374151]">
                                    <div className="flex-1 h-px bg-white/[0.06]" />
                                    <span className="text-base">→</span>
                                    <div className="flex-1 h-px bg-white/[0.06]" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        {/* Lucide icon for solution — intentionally kept */}
                                        <span style={{ color: item.color }}><item.SolutionIcon className="h-5 w-5" /></span>
                                        <div className="text-sm font-bold" style={{ fontFamily: "var(--font-bricolage, sans-serif)", color: item.color }}>
                                            {item.solution}
                                        </div>
                                    </div>
                                    <p className="text-sm text-[#64748b] leading-relaxed" style={{ fontFamily: "var(--font-outfit, sans-serif)" }}>
                                        {item.solutionDesc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                SECTION 4 — HOW IT WORKS
            ═══════════════════════════════════════ */}
            <section className="px-4 py-16 md:py-24">
                <div className="mx-auto max-w-4xl">
                    <div className="text-center mb-14">
                        <p className="section-accent">How It Works</p>
                        <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "var(--font-bricolage, sans-serif)" }}>
                            Three steps to start
                            <span className="gradient-text"> copy trading.</span>
                        </h2>
                    </div>

                    <div className="relative grid md:grid-cols-3 gap-8">
                        <div className="hidden md:block absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-[#D61F2C]/40 via-white/10 to-[#5BC0EB]/40" />

                        {[
                            { BIIcon: Search,       step: "01", title: "Browse & Compare",       color: "#D61F2C", desc: "Discover Argus-verified Colosseum traders ranked by win rate, ROI, drawdown, and risk score. Filter by risk tier." },
                            { BIIcon: CreditCard,   step: "02", title: "Subscribe with Capital",  color: "#a855f7", desc: "Choose your allocation. Sign an ERC-20 approve transaction. One confirmation and your capital is allocated." },
                            { BIIcon: RocketTakeoff,step: "03", title: "Earn Proportionally",     color: "#5BC0EB", desc: "When the leader trades on Sidiora, your vault mirrors proportional positions automatically. Profits flow back. Fees only on gains." },
                        ].map((step, i) => (
                            <div key={i} className="relative flex flex-col items-center text-center gap-4">
                                <div className="relative z-10 w-20 h-20 rounded-full flex flex-col items-center justify-center bg-[#0e1424] border-2" style={{ borderColor: step.color }}>
                                    <step.BIIcon size={26} color={step.color} />
                                    <span className="text-[10px] font-mono text-[#475569] mt-0.5">{step.step}</span>
                                </div>
                                <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-bricolage, sans-serif)", color: step.color }}>
                                    {step.title}
                                </h3>
                                <p className="text-sm text-[#64748b] leading-relaxed max-w-xs" style={{ fontFamily: "var(--font-outfit, sans-serif)" }}>
                                    {step.desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 text-center">
                        <Link href="/vaults" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#D61F2C]/40 bg-[#D61F2C]/10 text-[#D61F2C] text-sm font-semibold hover:bg-[#D61F2C]/20 hover:border-[#D61F2C]/60 transition-all min-h-[48px]">
                            Browse Vaults Now →
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                SECTION 5 — CORE FEATURES
            ═══════════════════════════════════════ */}
            <section className="px-4 py-16 md:py-24">
                <div className="mx-auto max-w-5xl">
                    <div className="text-center mb-12">
                        <p className="section-accent">Core Features</p>
                        <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "var(--font-bricolage, sans-serif)" }}>
                            Everything you need.
                            <span className="gradient-text"> Nothing you don&apos;t.</span>
                        </h2>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { icon: <ShieldCheck className="h-6 w-6" />, title: "Argus Risk Engine",             desc: "Real-time behavioral scoring using 500+ on-chain signals. Vaults are validated, monitored, and frozen on anomaly detection.", color: "#D61F2C" },
                            { icon: <Lock        className="h-6 w-6" />, title: "Non-Custodial Vaults",          desc: "Your funds stay in auditable smart contracts. Leaders have trade access, never withdrawal access. Your keys, your capital.",  color: "#5BC0EB" },
                            { icon: <TrendingUp  className="h-6 w-6" />, title: "Performance-Only Fees",          desc: "5–25% of realized profits. Zero management fees. Zero recurring charges. Leaders win when you win.",                         color: "#22c55e" },
                            { icon: <Zap         className="h-6 w-6" />, title: "Sidiora Perps Integration",      desc: "Mirror perpetual futures trades via the Sidiora off-chain sequencer. Full perp exposure with on-chain settlement.",         color: "#a855f7" },
                            { icon: <Eye         className="h-6 w-6" />, title: "Full On-Chain Transparency",     desc: "Every subscribe, trade, and withdrawal is recorded on HyperPaxeer. Query any transaction on PaxScan at any time.",          color: "#f59e0b" },
                            { icon: <Gauge       className="h-6 w-6" />, title: "2-Second Block Finality",        desc: "CometBFT consensus delivers instant single-slot finality on HyperPaxeer. Trades confirm in 2s — no waiting.",               color: "#5BC0EB" },
                        ].map((f) => (
                            <div key={f.title} className="glass-card p-6 flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${f.color}18`, color: f.color }}>
                                        {f.icon}
                                    </div>
                                    <h3 className="font-bold text-white text-sm" style={{ fontFamily: "var(--font-bricolage, sans-serif)" }}>
                                        {f.title}
                                    </h3>
                                </div>
                                <p className="text-sm text-[#64748b] leading-relaxed" style={{ fontFamily: "var(--font-outfit, sans-serif)" }}>
                                    {f.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                SECTION 6 — RISK TIERS
            ═══════════════════════════════════════ */}
            <section className="px-4 py-16 md:py-24">
                <div className="mx-auto max-w-4xl">
                    <div className="text-center mb-12">
                        <p className="section-accent">Risk Tiers</p>
                        <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "var(--font-bricolage, sans-serif)" }}>
                            Choose your
                            <span className="gradient-text"> risk appetite.</span>
                        </h2>
                        <p className="text-[#64748b] text-sm mt-3 max-w-lg mx-auto" style={{ fontFamily: "var(--font-outfit, sans-serif)" }}>
                            Argus scores every vault from 0–100. Filter to match your risk tolerance.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        {[
                            { tier: "SAFE",     range: "Score ≤ 40",  borderClass: "risk-safe",     bg: "rgba(34,197,94,0.06)",    color: "#22c55e", traits: ["Established track records", "Lower position volatility", "Steady, consistent returns"], ideal: "Conservative capital allocation" },
                            { tier: "MODERATE", range: "Score 41–75", borderClass: "risk-moderate", bg: "rgba(234,179,8,0.06)",    color: "#eab308", traits: ["Active trading frequency", "Strong ROI potential", "Balanced risk/reward"],            ideal: "Most popular tier" },
                            { tier: "HIGH",     range: "Score > 75",  borderClass: "risk-high",     bg: "rgba(239,68,68,0.06)",    color: "#ef4444", traits: ["Aggressive strategies", "High potential returns", "Maximum drawdown risk"],            ideal: "Risk-tolerant followers only" },
                        ].map((tier) => (
                            <div key={tier.tier} className={`glass-card ${tier.borderClass} p-6 flex flex-col gap-4`} style={{ background: tier.bg }}>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ background: tier.color }} />
                                        <span className="font-bold text-base" style={{ fontFamily: "var(--font-bricolage, sans-serif)", color: tier.color }}>
                                            {tier.tier}
                                        </span>
                                    </div>
                                    <div className="text-xs font-mono text-[#64748b]">{tier.range}</div>
                                </div>
                                <ul className="flex flex-col gap-1.5">
                                    {tier.traits.map((t) => (
                                        <li key={t} className="flex items-start gap-2 text-sm text-[#94a3b8]" style={{ fontFamily: "var(--font-outfit, sans-serif)" }}>
                                            <span className="mt-0.5 shrink-0" style={{ color: tier.color }}>✓</span>
                                            {t}
                                        </li>
                                    ))}
                                </ul>
                                <div className="text-xs text-[#64748b] italic border-t border-white/[0.06] pt-3" style={{ fontFamily: "var(--font-outfit, sans-serif)" }}>
                                    Ideal for: {tier.ideal}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                SECTION 7 — LEADERBOARD PREVIEW
            ═══════════════════════════════════════ */}
            <section className="px-4 py-16 md:py-24">
                <div className="mx-auto max-w-4xl">
                    <div className="text-center mb-12">
                        <p className="section-accent">Top Traders</p>
                        <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "var(--font-bricolage, sans-serif)" }}>
                            Argus-verified
                            <span className="gradient-text"> Colosseum leaders.</span>
                        </h2>
                        <p className="text-[#64748b] text-sm mt-3" style={{ fontFamily: "var(--font-outfit, sans-serif)" }}>
                            Ranked by Argus Reputation Score — updated in real time.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        {lbLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="glass-card p-5 h-[72px] animate-pulse bg-white/[0.02]" />
                            ))
                        ) : (leaderboard?.data.slice(0, 3) ?? []).map((leader, idx) => {
                            const rankColors = ["#f59e0b", "#94a3b8", "#b45309"]
                            const RankIcons = [Trophy, Award, Award]
                            const RankIcon = RankIcons[idx]
                            return (
                                <a
                                    key={leader.id}
                                    href={`${EXPLORER}/address/${leader.walletAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="glass-card flex items-center gap-4 px-5 py-4 hover:border-[rgba(214,31,44,0.3)]"
                                >
                                    <RankIcon size={22} color={rankColors[idx]} className="shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-mono text-sm font-semibold text-white truncate" style={{ fontFamily: "var(--font-geist-mono, monospace)" }}>
                                            {leader.walletAddress.slice(0, 8)}...{leader.walletAddress.slice(-6)}
                                        </div>
                                        <div className="text-xs text-[#64748b]">{leader._count?.vaultsLed ?? 0} vaults led</div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-xl font-extrabold" style={{ fontFamily: "var(--font-bricolage, sans-serif)", color: rankColors[idx] }}>
                                            {leader.argusScore}
                                        </div>
                                        <div className="text-[10px] text-[#475569]">Argus Score</div>
                                    </div>
                                    <ExternalLink className="h-3.5 w-3.5 text-[#475569] shrink-0" />
                                </a>
                            )
                        })}

                        {(!lbLoading && (!leaderboard?.data || leaderboard.data.length === 0)) && (
                            <div className="glass-card text-center p-10 flex flex-col items-center gap-3 text-[#475569] text-sm">
                                <Trophy size={32} color="#475569" />
                                <span>Leaderboard populates as traders join the protocol.</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 text-center">
                        <Link href="/leaderboard" className="inline-flex items-center gap-2 text-sm text-[#5BC0EB] hover:text-white transition-colors">
                            View full leaderboard →
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                SECTION 8 — WHY HYPERPAXEER
            ═══════════════════════════════════════ */}
            <section className="px-4 py-16 md:py-24">
                <div className="mx-auto max-w-4xl">
                    <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
                        <div>
                            <p className="section-accent">The Network</p>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "var(--font-bricolage, sans-serif)" }}>
                                Built on
                                <span className="gradient-text"> HyperPaxeer.</span>
                            </h2>
                            <p className="text-[#64748b] text-sm leading-relaxed mb-6" style={{ fontFamily: "var(--font-outfit, sans-serif)" }}>
                                HyperPaxeer&apos;s funded wallet model gives ZibaXeer an immediate liquidity advantage.
                                Colosseum leaders start with $50,000+ USDL funded wallets — meaning your copy position
                                includes real, funded strategy execution from day one.
                            </p>
                            <div className="flex flex-col gap-2">
                                {[
                                    { k: "Consensus",   v: "CometBFT (instant finality)" },
                                    { k: "Block Time",  v: "~2 seconds" },
                                    { k: "Chain ID",    v: "125" },
                                    { k: "Native Token",v: "PAX" },
                                    { k: "RPC",         v: "public-mainnet.rpcpaxeer.online/evm" },
                                ].map((row) => (
                                    <div key={row.k} className="flex justify-between items-center py-2 border-b border-white/[0.05] text-sm">
                                        <span className="text-[#64748b]" style={{ fontFamily: "var(--font-outfit, sans-serif)" }}>{row.k}</span>
                                        <span className="font-mono text-white/80 text-xs">{row.v}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* MetaMask card — 🦊 intentionally kept */}
                        <div className="glass-card p-6 flex flex-col gap-4">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xl">🦊</span>
                                <h3 className="font-bold text-white text-sm" style={{ fontFamily: "var(--font-bricolage, sans-serif)" }}>
                                    Add HyperPaxeer to MetaMask
                                </h3>
                            </div>
                            <p className="text-xs text-[#64748b]" style={{ fontFamily: "var(--font-outfit, sans-serif)" }}>
                                Connect your wallet and add the HyperPaxeer network to get started.
                            </p>
                            {[
                                { label: "Network Name", value: "HyperPaxeer" },
                                { label: "Chain ID",     value: "125" },
                                { label: "Currency",     value: "PAX" },
                                { label: "RPC URL",      value: "public-mainnet.rpcpaxeer.online/evm" },
                                { label: "Explorer",     value: "paxscan.paxeer.app" },
                            ].map((row) => (
                                <div key={row.label} className="flex flex-col gap-0.5">
                                    <span className="text-[10px] text-[#475569] uppercase tracking-wider" style={{ fontFamily: "var(--font-outfit, sans-serif)" }}>
                                        {row.label}
                                    </span>
                                    <code className="text-xs bg-white/[0.04] px-3 py-1.5 rounded-lg text-[#94a3b8] font-mono border border-white/[0.06]">
                                        {row.value}
                                    </code>
                                </div>
                            ))}
                            <Link href="/dashboard" className="mt-2 text-center py-3 rounded-xl font-semibold text-sm text-white bg-[#D61F2C] hover:bg-[#b91c1c] transition-all min-h-[48px] flex items-center justify-center">
                                Launch App & Connect Wallet
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                SECTION 9 — FINAL CTA
            ═══════════════════════════════════════ */}
            <section className="px-4 pt-8 pb-24 md:pb-32">
                <div className="mx-auto max-w-3xl">
                    <div className="relative glass-card text-center px-6 py-14 md:py-20 overflow-hidden glow-pulse" style={{ borderColor: "rgba(214,31,44,0.25)" }}>
                        <div className="absolute inset-0 -z-10 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(214,31,44,0.12) 0%, transparent 70%)" }} />
                        <div className="flex justify-center mb-5 text-[#D61F2C] opacity-70">
                            <RocketTakeoff size={40} />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4" style={{ fontFamily: "var(--font-bricolage, sans-serif)" }}>
                            Ready to start
                            <span className="gradient-text"> copy trading?</span>
                        </h2>
                        <p className="text-[#64748b] text-sm md:text-base mb-8 max-w-md mx-auto leading-relaxed" style={{ fontFamily: "var(--font-outfit, sans-serif)" }}>
                            Join the Colosseum traders already live on HyperPaxeer Mainnet.
                            Non-custodial. Transparent. Performance-fee only.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link href="/dashboard" className="px-8 py-3.5 rounded-full font-semibold text-sm text-white bg-[#D61F2C] hover:bg-[#b91c1c] hover:shadow-[0_0_28px_rgba(214,31,44,0.5)] transition-all min-h-[48px] flex items-center justify-center">
                                Launch App →
                            </Link>
                            <Link href="/leaderboard" className="px-8 py-3.5 rounded-full font-semibold text-sm text-white border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.08] transition-all min-h-[48px] flex items-center justify-center">
                                View Leaderboard
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    )
}
