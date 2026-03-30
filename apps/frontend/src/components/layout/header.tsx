"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Logo } from "@/components/icons/logo"
import { Button } from "@/components/ui/button"
import { useAccount } from "wagmi"
import { Menu, X } from "lucide-react"

const ConnectKitButton = dynamic(
    () => import("./connect-wallet-button").then((mod) => mod.ConnectWalletButton),
    {
        ssr: false,
        loading: () => <Button variant="outline">Connect Wallet</Button>,
    }
)

export function Header() {
    const pathname = usePathname()
    const { isConnected } = useAccount()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                {/* Left Side: Logo & Main Nav */}
                <div className="flex gap-6 md:gap-10 items-center">
                    <Link href="/" className="flex items-center space-x-2">
                        <Logo />
                        <span className="inline-block font-bold">ZibaXeer</span>
                    </Link>
                    <nav className="hidden gap-6 md:flex">
                        {isConnected && (
                            <Link
                                href="/dashboard"
                                className={`flex items-center text-sm font-medium transition-colors hover:text-foreground ${pathname === "/dashboard" ? "text-foreground" : "text-muted-foreground"
                                    }`}
                            >
                                Dashboard
                            </Link>
                        )}
                        <Link
                            href="/vaults"
                            className={`flex items-center text-sm font-medium transition-colors hover:text-foreground ${pathname === "/vaults" ? "text-foreground" : "text-muted-foreground"
                                }`}
                        >
                            Marketplace
                        </Link>
                        <Link
                            href="/leaderboard"
                            className={`flex items-center text-sm font-medium transition-colors hover:text-foreground ${pathname === "/leaderboard" ? "text-foreground" : "text-muted-foreground"
                                }`}
                        >
                            Leaderboard
                        </Link>
                    </nav>
                </div>

                {/* Right Side: Wallet Config & Mobile Toggle */}
                <div className="flex items-center gap-2 md:gap-4">
                    <ConnectKitButton />
                    
                    {/* Hamburger Toggle */}
                    <button
                        className="md:hidden p-2 text-muted-foreground hover:text-foreground focus:outline-none"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle Menu"
                    >
                        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute w-full left-0 border-b border-border/40 bg-background/95 backdrop-blur px-4 py-4 shadow-lg animate-in slide-in-from-top-2">
                    <nav className="flex flex-col space-y-4">
                        {isConnected && (
                            <Link
                                href="/dashboard"
                                className={`text-sm font-medium transition-colors hover:text-foreground ${pathname === "/dashboard" ? "text-foreground" : "text-muted-foreground"}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Dashboard
                            </Link>
                        )}
                        <Link
                            href="/vaults"
                            className={`text-sm font-medium transition-colors hover:text-foreground ${pathname === "/vaults" ? "text-foreground" : "text-muted-foreground"}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Marketplace
                        </Link>
                        <Link
                            href="/leaderboard"
                            className={`text-sm font-medium transition-colors hover:text-foreground ${pathname === "/leaderboard" ? "text-foreground" : "text-muted-foreground"}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Leaderboard
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    )
}
