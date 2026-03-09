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

export default function VaultsPage() {
    const { vaults, loading, error } = useVaults()

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Vaults Marketplace</h2>
                    <p className="text-muted-foreground">
                        Explore and allocate capital to top-performing Colosseum strategy vaults.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Filter by Risk</Button>
                    <Button>Create Vault</Button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">Loading vaults...</div>
            ) : error ? (
                <div className="text-red-500">Error loading vaults from protocol network.</div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {vaults.map((vault) => (
                        <Card key={vault.id} className="hover:border-primary/50 transition-colors flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl">{vault.name}</CardTitle>
                                        <CardDescription>Leader: {vault.leader?.walletAddress.slice(0, 8)}...</CardDescription>
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
                                        <p className="text-sm text-muted-foreground">Total Value Locked</p>
                                        <p className="text-2xl font-bold">{vault.tvl === "0" ? "0.00" : formatEther(BigInt(vault.tvl))} {vault.baseAsset}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Historical ROI</p>
                                        <p className={`text-2xl font-bold ${vault.roi > 0 ? "text-green-500" : "text-red-500"}`}>
                                            {vault.roi > 0 ? '+' : ''}{vault.roi}%
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-6 flex gap-2">
                                    <Button className="w-full">Deposit</Button>
                                    <Button variant="secondary" className="w-full">View Details</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
