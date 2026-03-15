"use client"

import { WagmiProvider, createConfig, http } from "wagmi"
import { injected } from "wagmi/connectors"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ConnectKitProvider } from "connectkit"

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

const config = createConfig({
    chains: [hyperPaxeer],
    connectors: [injected()],
    transports: {
        [hyperPaxeer.id]: http(hyperPaxeer.rpcUrls.default.http[0]),
    },
    ssr: true,
})

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
