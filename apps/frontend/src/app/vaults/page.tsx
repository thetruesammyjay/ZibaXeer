"use client"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { useVaults } from "@/hooks/api/useVaults"
import { formatEther } from "viem"
import { useState } from "react"
import Loading from "@/app/loading"

export default function TraderMarketplacePage() {
    const { vaults, loading, error } = useVaults()
    const [riskFilter, setRiskFilter] = useState<"ALL" | "SAFE" | "MODERATE">("ALL")

    const handleFilterClick = () => {
        if (riskFilter === "ALL") setRiskFilter("SAFE")
        else if (riskFilter === "SAFE") setRiskFilter("MODERATE")
        else setRiskFilter("ALL")
    }

    const handleBecomeLeader = () => {
        alert("Colosseum Registration for Season 2 is coming soon! Check our Discord for more updates.")
    }

    const displayedVaults = vaults?.filter(v => {
        if (riskFilter === "SAFE") return v.riskScore <= 40;
        if (riskFilter === "MODERATE") return v.riskScore > 40 && v.riskScore <= 75;
        return true;
    }) || [];

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
                    <Button variant="outline" onClick={handleFilterClick}>
                        Filter by Risk {riskFilter !== "ALL" ? `(${riskFilter})` : ""}
                    </Button>
                    <Button onClick={handleBecomeLeader}>Become a Leader</Button>
                </div>
            </div>

            {loading ? (
                <Loading />
            ) : error ? (
                <div className="text-red-500">Error loading data from protocol network.</div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {displayedVaults.map((vault) => (
                        <Card key={vault.id} className="hover:border-primary/50 transition-colors flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl">{vault.name}</CardTitle>
                                        <CardDescription>Trader: {vault.leader?.walletAddress.slice(0, 8)}...</CardDescription>
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
                                        <p className="text-2xl font-bold">{vault.tvl === "0" ? "0.00" : formatEther(BigInt(vault.tvl))} {vault.baseAsset}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Historical ROI</p>
                                        <p className={`text-2xl font-bold ${vault.roi > 0 ? "text-green-500" : "text-red-500"}`}>
                                            {vault.roi > 0 ? '+' : ''}{vault.roi}%
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-6 flex flex-col gap-2">
                                    <Button className="w-full bg-blue-600 hover:bg-blue-700 font-semibold px-4 py-2 text-white shadow-sm transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95">Subscribe to Copy Trade</Button>
                                    <Button variant="secondary" className="w-full">Trader Details</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
