"use client"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"

import { useLeaderboard } from "@/hooks/api/useLeaderboard"
import Loading from "@/app/loading"

const EXPLORER_URL = process.env.NEXT_PUBLIC_EXPLORER_URL ?? 'https://paxscan.paxeer.app'

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
                <div className="text-red-500 p-4 rounded-lg border border-red-500/20 bg-red-500/5">
                    Error loading leaderboard data from protocol network.
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {leaderboard?.data.map((leader, index) => (
                        <Card
                            key={leader.id}
                            className="hover:border-primary/50 transition-all duration-200 hover:shadow-md hover:shadow-primary/5 flex flex-col md:flex-row items-center p-4 gap-4 md:gap-6"
                        >
                            {/* Rank Badge */}
                            <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-xl shrink-0
                                ${index === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                  index === 1 ? 'bg-zinc-400/20 text-zinc-300 border border-zinc-400/30' :
                                  index === 2 ? 'bg-orange-700/20 text-orange-500 border border-orange-700/30' :
                                  'bg-primary/10 text-primary border border-primary/20'}`}
                            >
                                #{index + 1}
                            </div>

                            {/* Leader Info */}
                            <div className="flex-1 text-center md:text-left">
                                <CardTitle className="text-lg mb-1 flex items-center justify-center md:justify-start gap-2 flex-wrap">
                                    {/* Address with PaxScan link */}
                                    <a
                                        href={`${EXPLORER_URL}/address/${leader.walletAddress}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 font-mono hover:text-primary transition-colors"
                                        title={leader.walletAddress}
                                    >
                                        {leader.walletAddress.slice(0, 6)}...{leader.walletAddress.slice(-4)}
                                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                    </a>
                                    {index < 3 && (
                                        <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600 text-xs">
                                            Top Rated
                                        </Badge>
                                    )}
                                </CardTitle>
                                <CardDescription>Joined {new Date(leader.joinedAt).toLocaleDateString()}</CardDescription>
                            </div>

                            {/* Stats */}
                            <div className="flex gap-6 md:gap-10 text-center shrink-0">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-0.5">Argus Score</p>
                                    <p className="text-2xl font-bold text-primary">{leader.argusScore}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-0.5">Vaults Led</p>
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
