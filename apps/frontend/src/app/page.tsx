import Link from "next/link"
import { ArrowRight, Box, LineChart, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden pt-24 pb-32 w-full text-center">
        {/* Background Gradients (H4F Inspired) */}
        <div className="absolute top-0 -z-10 h-full w-full bg-background">
          <div className="absolute bottom-auto left-auto right-0 top-0 h-[500px] w-[500px] -translate-x-[30%] translate-y-[20%] rounded-full bg-primary/20 opacity-50 blur-[80px]"></div>
          <div className="absolute bottom-0 left-0 right-auto top-auto h-[500px] w-[500px] -translate-y-[10%] translate-x-[20%] rounded-full bg-primary/10 opacity-50 blur-[80px]"></div>
        </div>

        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-8">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
              Paxeer Network Mainnet Live
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl">
              The Capital Layer of Web3 <br className="hidden sm:block" />
              <span className="text-primary">Copy-Trading Vaults</span>
            </h1>

            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-lg sm:leading-8">
              ZibaXeer is a decentralized copy-trading vault protocol deployed on HyperPaxeer. Mirror top-performing Colosseum traders transparently, non-custodially, and with configurable risk parameters.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="w-full sm:w-auto text-base">
                  Launch Web App <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/vaults">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-base">
                  Explore Vaults
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto py-24 px-4 space-y-16">
        <div className="text-center space-y-4 max-w-[800px] mx-auto">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Engineered for DeFi Traders</h2>
          <p className="text-muted-foreground md:text-lg">
            Built on HyperPaxeer to deliver high-speed, low-cost execution with full transparency.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="flex flex-col space-y-3 rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LineChart className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Argus Risk Engine</h3>
            <p className="text-muted-foreground">
              Real-time on-chain risk scoring utilizing the Argus oracle endpoint. Vaults are protected from catastrophic downside.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col space-y-3 rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Box className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Non-Custodial</h3>
            <p className="text-muted-foreground">
              Your funds, your rules. Traders execute trades, but they can never withdraw your managed US Dollars (USDL).
            </p>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col space-y-3 rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold">Performance Fees</h3>
            <p className="text-muted-foreground">
              Smart contracts automatically handle profit-sharing. Traders only get paid when you make money.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
