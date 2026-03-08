import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
    return (
        <div className="container mx-auto p-4 md:p-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">
                        Overview of your active copy-trading vaults and risk adjusted returns.
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
                        <div className="text-2xl font-bold">$45,231.89</div>
                        <p className="text-xs text-muted-foreground">
                            +20.1% from last month
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
                        <div className="text-2xl font-bold">3</div>
                        <p className="text-xs text-muted-foreground">
                            You are copying 3 top traders
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total PnL
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">+$2,450.00</div>
                        <p className="text-xs text-muted-foreground">
                            Across all vaults
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Risk Score (Argus)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            Low <Badge variant="secondary">Safe</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Aggregated portfolio risk
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Portfolio Breakdown placeholder */}
            <h3 className="text-xl font-bold tracking-tight pt-4">Your Active Vaults</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle>Alpha ETH Trend</CardTitle>
                                <CardDescription>Managed by 0xSammy</CardDescription>
                            </div>
                            <Badge>+12.4% APR</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">$15,000 USDL</div>
                        <p className="text-xs text-muted-foreground">Your Deposit</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
