"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SubscribeModal } from "@/components/ui/subscribe-modal"

import { useVaults, type VaultData } from "@/hooks/api/useVaults"
import { formatEther } from "viem"
import Loading from "@/app/loading"

type RiskFilter = "ALL" | "SAFE" | "MODERATE" | "HIGH"

const RISK_CYCLE: RiskFilter[] = ["ALL", "SAFE", "MODERATE", "HIGH"]

export default function TraderMarketplacePage() {
    const router = useRouter()
    const { vaults, loading, error } = useVaults()
    const [riskFilter, setRiskFilter] = useState<RiskFilter>("ALL")
    const [selectedVault, setSelectedVault] = useState<VaultData | null>(null)
    const [modalOpen, setModalOpen] = useState(false)

    const cycleFilter = () => {
        const current = RISK_CYCLE.indexOf(riskFilter)
        setRiskFilter(RISK_CYCLE[(current + 1) % RISK_CYCLE.length])
    }

    const handleSubscribe = (vault: VaultData) => {
        setSelectedVault(vault)
        setModalOpen(true)
    }

    const handleBecomeLeader = () => {
        window.open('https://colosseum.hyperpaxeer.com/dashboard', '_blank', 'noopener,noreferrer')
    }

    const displayedVaults = vaults?.filter(v => {
        if (riskFilter === "SAFE") return v.riskScore <= 40
        if (riskFilter === "MODERATE") return v.riskScore > 40 && v.riskScore <= 75
        if (riskFilter === "HIGH") return v.riskScore > 75
        return true
    }) || []

    const filterLabel = riskFilter !== "ALL" ? ` (${riskFilter})` : ""

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Trader Marketplace</h2>
                    <p className="text-muted-foreground">
                        Find top traders and subscribe to copy their winning strategies.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={cycleFilter} id="marketplace-risk-filter">
                        Risk Filter{filterLabel}
                    </Button>
                    <Button onClick={handleBecomeLeader} id="marketplace-become-leader">Become a Leader</Button>
                </div>
            </div>

            {loading ? (
                <Loading />
            ) : error ? (
                <div className="text-red-500 p-4 rounded-lg border border-red-500/20 bg-red-500/5">
                    Error loading data from protocol network.
                </div>
            ) : (
                <>
                    {displayedVaults.length === 0 && (
                        <div className="text-center p-16 text-muted-foreground bg-accent/30 rounded-xl border border-border/40">
                            No vaults match the selected filter.
                        </div>
                    )}
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {displayedVaults.map((vault) => (
                            <Card key={vault.id} className="hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 flex flex-col">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-xl">{vault.name}</CardTitle>
                                            <CardDescription>
                                                Leader: {vault.leader?.walletAddress.slice(0, 8)}...
                                            </CardDescription>
                                        </div>
                                        <Badge variant={
                                            vault.riskScore > 75 ? "destructive" :
                                                vault.riskScore > 40 ? "secondary" : "default"
                                        }>
                                            {vault.riskScore} Risk
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <div className="grid grid-cols-2 gap-4 my-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Follower TVL</p>
                                            <p className="text-2xl font-bold">
                                                {vault.tvl === "0" ? "0.00" : Number(formatEther(BigInt(vault.tvl))).toFixed(4)} {vault.baseAsset}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Historical ROI</p>
                                            <p className={`text-2xl font-bold ${vault.roi > 0 ? "text-green-500" : "text-red-500"}`}>
                                                {vault.roi > 0 ? '+' : ''}{vault.roi}%
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex flex-col gap-2">
                                        <Button
                                            id={`subscribe-btn-${vault.id}`}
                                            className="w-full bg-primary hover:bg-primary/90 font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                            onClick={() => handleSubscribe(vault)}
                                        >
                                            Subscribe to Copy Trade
                                        </Button>
                                        <Button
                                            id={`details-btn-${vault.id}`}
                                            variant="secondary"
                                            className="w-full"
                                            onClick={() => router.push(`/vaults/${vault.id}`)}
                                        >
                                            Trader Details
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            )}

            {/* Subscribe Modal */}
            <SubscribeModal
                vault={selectedVault}
                open={modalOpen}
                onClose={() => setModalOpen(false)}
            />
        </div>
    )
}
