"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Logo } from "@/components/icons/logo"
import { Button } from "@/components/ui/button"
import { useAccount } from "wagmi"

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

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                {/* Left Side: Logo & Main Nav */}
                <div className="flex gap-6 md:gap-10">
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
                            Vaults
                        </Link>
                    </nav>
                </div>

                {/* Right Side: Wallet Config */}
                <div className="flex items-center gap-2">
                    <ConnectKitButton />
                </div>
            </div>
        </header>
    )
}
