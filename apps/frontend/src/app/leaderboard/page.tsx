"use client"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { useLeaderboard } from "@/hooks/api/useLeaderboard"
import Loading from "@/app/loading"

export default function LeaderboardPage() {
    const { leaderboard, loading, error } = useLeaderboard()

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Trader Leaderboard</h2>
                    <p className="text-muted-foreground">
                        The top performing traders ranked by Argus Reputation Score.
                    </p>
                </div>
            </div>

            {loading ? (
                <Loading />
            ) : error ? (
                <div className="text-red-500">Error loading leaderboard data from protocol network.</div>
            ) : (
                <div className="flex flex-col gap-4">
                    {leaderboard?.data.map((leader, index) => (
                        <Card key={leader.id} className="hover:border-primary/50 transition-colors flex flex-col md:flex-row items-center p-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-xl mr-6">
                                #{index + 1}
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-xl mb-1 flex items-center gap-2">
                                    {leader.walletAddress.slice(0, 6)}...{leader.walletAddress.slice(-4)}
                                    {index < 3 && <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">Top Rated</Badge>}
                                </CardTitle>
                                <CardDescription>Joined on {new Date(leader.joinedAt).toLocaleDateString()}</CardDescription>
                            </div>
                            <div className="flex gap-8 mt-4 md:mt-0 text-center">
                                <div>
                                    <p className="text-sm text-muted-foreground">Argus Score</p>
                                    <p className="text-2xl font-bold text-primary">{leader.argusScore}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Vaults Led</p>
                                    <p className="text-2xl font-bold">{leader._count?.vaultsLed || 0}</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                    {(!leaderboard?.data || leaderboard.data.length === 0) && (
                        <div className="text-center p-12 text-muted-foreground bg-accent/50 rounded-lg">
                            No traders found on the leaderboard yet.
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
