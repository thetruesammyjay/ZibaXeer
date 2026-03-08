import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function VaultsPage() {
    // Mock data representing Vaults from the Colosseum/Registry
    const vaults = [
        {
            id: "v1",
            name: "Alpha ETH Trend",
            leader: "0xSammy",
            tvl: "$1.2M",
            apr: "+42.4%",
            risk: "Medium",
        },
        {
            id: "v2",
            name: "Delta Neutral Stable",
            leader: "0xWhale",
            tvl: "$5.4M",
            apr: "+12.1%",
            risk: "Low",
        },
        {
            id: "v3",
            name: "Degen Memecoin Sniper",
            leader: "0xChad",
            tvl: "$450K",
            apr: "+156.8%",
            risk: "High",
        },
        {
            id: "v4",
            name: "Bluechip Spot Accumulator",
            leader: "0xPaxeer",
            tvl: "$2.1M",
            apr: "+28.2%",
            risk: "Low",
        }
    ]

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

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {vaults.map((vault) => (
                    <Card key={vault.id} className="hover:border-primary/50 transition-colors flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl">{vault.name}</CardTitle>
                                    <CardDescription>Managed by {vault.leader}</CardDescription>
                                </div>
                                <Badge variant={
                                    vault.risk === "High" ? "destructive" :
                                        vault.risk === "Medium" ? "secondary" : "default"
                                }>
                                    {vault.risk} Risk
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="grid grid-cols-2 gap-4 my-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Value Locked</p>
                                    <p className="text-2xl font-bold">{vault.tvl}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Historical APR</p>
                                    <p className="text-2xl font-bold text-green-500">{vault.apr}</p>
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
        </div>
    )
}
