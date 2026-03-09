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
import { useAccount, useBalance } from "wagmi"
import { formatEther } from "viem"
import { useGlobalAnalytics } from "@/hooks/api/useAnalytics"
import { useVaults } from "@/hooks/api/useVaults"

export default function DashboardPage() {
    const { address, isConnected } = useAccount()
    const { data: balanceData } = useBalance({ address })
    const { analytics, loading } = useGlobalAnalytics()
    const { vaults } = useVaults()

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">
                        Global protocol analytics and your personal wallet state.
                    </p>
                </div>
                <Button>Explore New Vaults</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Managed Value
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isConnected && balanceData
                                ? `${Number(formatEther(balanceData.value)).toFixed(4)} ${balanceData.symbol}`
                                : "$0.00"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            +20.1% from last month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Protocol Total Value Locked
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            {loading ? "..." : (analytics?.totalTvl ? `$${formatEther(BigInt(analytics.totalTvl))}` : "$0.00")}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Aggregated capital across vaults
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Protocol Win Rate
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">
                            {loading ? "..." : `${analytics?.winRate || 0}%`}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Across {analytics?.totalTrades || 0} executed trades
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Vaults
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            {loading ? "..." : (analytics?.activeVaultsCount || 0)} <Badge variant="secondary">Live</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Managed by Argus validated leaders
                        </p>
                    </CardContent>
                </Card>
            </div>

            {isConnected ? (
                <>
                    <h3 className="text-xl font-bold tracking-tight pt-4">All Vaults Network</h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {vaults.map((vault) => (
                            <Card key={vault.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle>{vault.name}</CardTitle>
                                            <CardDescription>Followers: {vault._count?.followers || 0}</CardDescription>
                                        </div>
                                        <Badge>{vault.roi > 0 ? '+' : ''}{vault.roi}% ROI</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-lg font-bold">{vault.tvl === "0" ? "0.00" : formatEther(BigInt(vault.tvl))} {vault.baseAsset}</div>
                                    <p className="text-xs text-muted-foreground">Total Vault Value</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-muted/20">
                    <h3 className="text-xl font-bold mb-2">Connect Your Wallet</h3>
                    <p className="text-muted-foreground mb-4">Connect your Paxeer wallet to view your portfolio and active copy-trading vaults.</p>
                </div>
            )}
        </div>
    )
}
