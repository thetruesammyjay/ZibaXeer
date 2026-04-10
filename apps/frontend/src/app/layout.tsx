import type { Metadata } from "next"
import { Geist, Geist_Mono, Bricolage_Grotesque, Outfit } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Web3Provider } from "@/components/web3-provider"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
})

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
})

export const metadata: Metadata = {
  title: "ZibaXeer — The Capital Layer of Web3 Copy Trading",
  description:
    "Mirror top Colosseum traders on HyperPaxeer — transparently, non-custodially, on-chain. Performance-only fees. Full custody of your capital.",
  keywords: ["copy trading", "DeFi", "HyperPaxeer", "ZibaXeer", "Colosseum", "vaults", "on-chain"],
  openGraph: {
    title: "ZibaXeer — Web3 Copy Trading",
    description: "Mirror top Colosseum traders on HyperPaxeer. Non-custodial vaults, performance-only fees.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} ${outfit.variable} antialiased min-h-screen bg-background font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Web3Provider>
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  )
}

