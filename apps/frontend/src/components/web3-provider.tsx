"use client"

import { WagmiProvider, createConfig, http } from "wagmi"
import { mainnet, sepolia } from "wagmi/chains"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ConnectKitProvider, getDefaultConfig } from "connectkit"

// Note: HyperPaxeer mainnet configuration will be added here
const hyperPaxeer = {
    id: 125,
    name: "HyperPaxeer",
    nativeCurrency: { name: "Paxeer", symbol: "PAX", decimals: 18 },
    rpcUrls: {
        default: { http: ["https://mainnet-beta.rpc.hyperpaxeer.com/rpc"] },
    },
    blockExplorers: {
        default: { name: "PaxScan", url: "https://paxscan.paxeer.app" },
    },
} as const

const config = createConfig(
    getDefaultConfig({
        // Your dApps chains
        chains: [hyperPaxeer, mainnet, sepolia],
        transports: {
            // RPC URL for each chain
            [hyperPaxeer.id]: http(hyperPaxeer.rpcUrls.default.http[0]),
            [mainnet.id]: http(),
            [sepolia.id]: http(),
        },

        // Required API Keys
        walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo_project_id",

        // Required App Info
        appName: "ZibaXeer",
        appDescription: "The On-Chain Copy-Trading Vaults.",
        appUrl: "https://zibaxeer.io",
        appIcon: "https://zibaxeer.io/logo.png",
    }),
)

const queryClient = new QueryClient()

export function Web3Provider({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <ConnectKitProvider
                    mode="dark"
                    customTheme={{
                        "--ck-font-family": "var(--font-geist-sans)",
                        "--ck-border-radius": "0.5rem",
                        "--ck-overlay-backdrop-filter": "blur(4px)",
                    }}
                >
                    {children}
                </ConnectKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}
