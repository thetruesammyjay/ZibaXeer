"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Logo } from "@/components/icons/logo"
import { Button } from "@/components/ui/button"
import { useAccount } from "wagmi"
import { Menu, X } from "lucide-react"

const ConnectWalletButton = dynamic(
    () => import("./connect-wallet-button").then((mod) => mod.ConnectWalletButton),
    {
        ssr: false,
        loading: () => <Button variant="outline" size="sm">Connect Wallet</Button>,
    }
)

const NAV_LINKS = [
    { label: "Marketplace", href: "/vaults" },
    { label: "Leaderboard", href: "/leaderboard" },
]

/* ============================================================
   Floating Pill Nav — rendered on the landing page (/)
   ============================================================ */
function PillHeader() {
    const [open, setOpen] = useState(false)

    return (
        <>
            {/* Desktop pill */}
            <header className="fixed top-5 left-1/2 -translate-x-1/2 z-50 hidden md:flex items-center gap-1
                               px-4 py-2.5 rounded-full
                               bg-[rgba(7,9,15,0.75)] backdrop-blur-xl
                               border border-white/[0.08]
                               shadow-[0_4px_32px_rgba(0,0,0,0.4)]
                               whitespace-nowrap">
                <Link href="/" className="flex items-center gap-2 mr-4">
                    <Logo />
                    <span className="text-sm font-bold" style={{ fontFamily: "var(--font-bricolage, sans-serif)" }}>
                        ZibaXeer
                    </span>
                </Link>

                <div className="flex items-center gap-1">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="px-3.5 py-1.5 text-sm text-[#94a3b8] hover:text-white rounded-full
                                       hover:bg-white/[0.06] transition-all duration-200"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                <div className="ml-3 h-4 w-px bg-white/10" />

                <Link
                    href="/dashboard"
                    className="ml-3 px-4 py-1.5 rounded-full text-sm font-semibold
                               bg-[#D61F2C] hover:bg-[#b91c1c] text-white
                               transition-all duration-200 hover:shadow-[0_0_16px_rgba(214,31,44,0.4)]"
                >
                    Launch App →
                </Link>
            </header>

            {/* Mobile pill */}
            <header className="fixed top-4 left-4 right-4 z-50 md:hidden
                               flex items-center justify-between
                               px-4 py-3 rounded-2xl
                               bg-[rgba(7,9,15,0.85)] backdrop-blur-xl
                               border border-white/[0.08]
                               shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
                <Link href="/" className="flex items-center gap-2">
                    <Logo />
                    <span className="text-sm font-bold" style={{ fontFamily: "var(--font-bricolage, sans-serif)" }}>
                        ZibaXeer
                    </span>
                </Link>
                <button
                    onClick={() => setOpen((o) => !o)}
                    className="p-2 text-[#94a3b8] hover:text-white focus:outline-none min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Toggle menu"
                >
                    {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </header>

            {/* Mobile dropdown */}
            {open && (
                <div className="fixed top-[72px] left-4 right-4 z-50 md:hidden
                                rounded-2xl bg-[rgba(10,14,26,0.97)] backdrop-blur-xl
                                border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.6)]
                                p-4 flex flex-col gap-2">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setOpen(false)}
                            className="px-4 py-3 text-sm text-[#94a3b8] hover:text-white hover:bg-white/[0.06]
                                       rounded-xl transition-all min-h-[44px] flex items-center"
                        >
                            {link.label}
                        </Link>
                    ))}
                    <Link
                        href="/dashboard"
                        onClick={() => setOpen(false)}
                        className="mt-1 px-4 py-3 rounded-xl text-sm font-semibold text-center
                                   bg-[#D61F2C] hover:bg-[#b91c1c] text-white transition-all min-h-[44px] flex items-center justify-center"
                    >
                        Launch App →
                    </Link>
                </div>
            )}
        </>
    )
}

/* ============================================================
   Sticky App Header — rendered on all other pages
   ============================================================ */
function AppHeader() {
    const pathname = usePathname()
    const { isConnected } = useAccount()
    const [open, setOpen] = useState(false)

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#080d1a]/95 backdrop-blur-xl">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                {/* Left */}
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2.5">
                        <Logo />
                        <span className="font-bold text-sm" style={{ fontFamily: "var(--font-bricolage, sans-serif)" }}>
                            ZibaXeer
                        </span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-1">
                        {isConnected && (
                            <Link
                                href="/dashboard"
                                className={`px-3.5 py-1.5 text-sm rounded-lg transition-colors
                                    ${pathname === "/dashboard"
                                        ? "text-white bg-white/[0.07]"
                                        : "text-[#94a3b8] hover:text-white hover:bg-white/[0.05]"}`}
                            >
                                Dashboard
                            </Link>
                        )}
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`px-3.5 py-1.5 text-sm rounded-lg transition-colors
                                    ${pathname === link.href
                                        ? "text-white bg-white/[0.07]"
                                        : "text-[#94a3b8] hover:text-white hover:bg-white/[0.05]"}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Right */}
                <div className="flex items-center gap-2">
                    <ConnectWalletButton />
                    <button
                        className="md:hidden p-2 text-[#94a3b8] hover:text-white focus:outline-none min-w-[44px] min-h-[44px] flex items-center justify-center"
                        onClick={() => setOpen((o) => !o)}
                        aria-label="Toggle menu"
                    >
                        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile dropdown */}
            {open && (
                <div className="md:hidden absolute w-full left-0 bg-[#080d1a]/97 backdrop-blur-xl border-b border-white/[0.06] px-4 py-4 shadow-xl">
                    <nav className="flex flex-col gap-1">
                        {isConnected && (
                            <Link
                                href="/dashboard"
                                onClick={() => setOpen(false)}
                                className="px-4 py-3 text-sm text-[#94a3b8] hover:text-white hover:bg-white/[0.05] rounded-xl min-h-[44px] flex items-center"
                            >
                                Dashboard
                            </Link>
                        )}
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setOpen(false)}
                                className="px-4 py-3 text-sm text-[#94a3b8] hover:text-white hover:bg-white/[0.05] rounded-xl min-h-[44px] flex items-center"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            )}
        </header>
    )
}

/* ============================================================
   Root Export — switches based on pathname
   ============================================================ */
export function Header() {
    const pathname = usePathname()
    if (pathname === "/") return <PillHeader />
    return <AppHeader />
}
