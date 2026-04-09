# ZibaXeer

**On-Chain Copy-Trading Vault — Social Trading Protocol on Paxeer Network**

ZibaXeer is a decentralized copy-trading vault protocol deployed on **HyperPaxeer** (EVM Chain ID `125`). It enables top-performing Colosseum traders to create strategy vaults that other funded wallets can mirror — transparently, non-custodially, and with configurable risk parameters.

> Built natively on PaxDex. Powered by the Argus Risk Engine. Designed for the capital layer of Web3.

---

## Documentation

Full docs are available at **[sammyjaysoftwaresolutionsandconsultancyltd.mintlify.app](https://sammyjaysoftwaresolutionsandconsultancyltd.mintlify.app)**.

Covers Getting Started, system architecture, backend API, smart contracts, and the indexer.

---

## Table of Contents

- [Frontend Snapshots](#frontend-snapshots)
- [Current Status](#current-status)
- [Overview](#overview)
- [Architecture](#architecture)
- [Core Features](#core-features)
- [Protocol Mechanics](#protocol-mechanics)
- [Smart Contract Architecture](#smart-contract-architecture)
- [Tech Stack](#tech-stack)
- [Network Configuration](#network-configuration)
- [Getting Started](#getting-started)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security](#security)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Frontend Snapshots

### Web

![ZibaXeer Web Snapshot](./Zibaxeer-Web.jpeg)

### Mobile

![ZibaXeer Mobile Snapshot](./ZibaXeer-mobile.jpeg)

---

## Current Status

**🟢 LIVE on HyperPaxeer Mainnet (Chain ID 125) — April 2026**

### Deployed Contracts

| Contract | Address |
|---|---|
| ZibaXeerToken | [`0xD3A558E2627B5b0f6E7ba76cf92052f3743F3Df1`](https://paxscan.paxeer.app/address/0xD3A558E2627B5b0f6E7ba76cf92052f3743F3Df1) |
| ArgusOracle Proxy | [`0xc990Ae725E0C0e3Fc80A947558Ff9605A483DFF1`](https://paxscan.paxeer.app/address/0xc990Ae725E0C0e3Fc80A947558Ff9605A483DFF1) |
| PaxDexAdapter Proxy | [`0x6f7e1D9d047c59b02709Db7eCBFd4Ceda2DB49fd`](https://paxscan.paxeer.app/address/0x6f7e1D9d047c59b02709Db7eCBFd4Ceda2DB49fd) |
| RiskManager Proxy | [`0xb451F66fcF41BFF655f082a7F5402AD0DFe0645d`](https://paxscan.paxeer.app/address/0xb451F66fcF41BFF655f082a7F5402AD0DFe0645d) |
| RevenueSplitter Proxy | [`0xb3811eADB9Da7FB1324d845BCF0858e0DD9aa3A5`](https://paxscan.paxeer.app/address/0xb3811eADB9Da7FB1324d845BCF0858e0DD9aa3A5) |
| VaultRegistry Proxy | [`0x7BE93B4D42a63cc0005362390ECFB567139c6250`](https://paxscan.paxeer.app/address/0x7BE93B4D42a63cc0005362390ECFB567139c6250) |
| CopyTradingVault Impl | [`0xC40A5CCE1229f1C947e5447AbD2cB8DE606973cA`](https://paxscan.paxeer.app/address/0xC40A5CCE1229f1C947e5447AbD2cB8DE606973cA) |
| **VaultFactory Proxy** | [**`0x7553a9DEbb00cC6F6023675e2ac66110f8a57fE6`**](https://paxscan.paxeer.app/address/0x7553a9DEbb00cC6F6023675e2ac66110f8a57fE6) |

### What is live:

- All 8 core ZibaXeer protocol contracts deployed and wired on HyperPaxeer mainnet.
- `SidioraVaultAdapter` with delegation rotation, safety checks, and event emissions.
- 8 Foundry tests for Sidiora adapter delegation and margin flows — all passing.
- **Indexer** deployed on Railway — Redis connected via private network, event polling using single-block `queryFilter` loops (HyperPaxeer `eth_getLogs` compatibility).
- **Backend API** deployed on Railway — Express on port 8080, PostgreSQL + Prisma synced, BullMQ workers live (`SidioraMirrorSignalQueue`, `VaultDeployedQueue`, `FollowerEventQueue`).
- Mirror bot EOA `0xDC4988e240ffc9d51E1e3aB853577102d6d20Fd6` prefunded with 76,000+ PAX for gas.
- Backend/indexer Sidiora queue pipeline, mirror worker with `traceId` idempotency, and audit persistence.
- Control-plane API endpoints for policy, status, freeze, and unfreeze.
- EVM compatibility patched for HyperPaxeer (London EVM — no Cancun opcodes).
- **Frontend Trader Marketplace** — vault listing with risk filters (SAFE / MODERATE / HIGH), live API data.
- **Subscribe to Copy Trade** — two-step on-chain flow (ERC-20 approve → `subscribe(amount)`) via modal, reads token symbol and decimals on-chain, shows PaxScan tx link on success.
- **Vault Detail Page** (`/vaults/[id]`) — on-chain TVL, vault name, leader address (PaxScan linked), 30-day ROI chart, user position display, partial unsubscribe flow.
- **Dashboard portfolio** — real on-chain `followers(user).deposited` across all vaults via `useUserPortfolio`; vault cards route to the detail page.
- **Leaderboard PaxScan links** — every leader address links directly to `paxscan.paxeer.app`.

### Pending (waiting on Paxeer team):

- `SidioraVaultAdapter.authorizeMirrorBot(0xDC4988e240ffc9d51E1e3aB853577102d6d20Fd6)` — authorizes our mirror bot on the Sidiora Diamond.
- First leader EOA address for `KNOWN_LEADER_ADDRESSES` — activates the Sidiora live listener in the indexer.
- Frontend deployment to Vercel/Railway with production domain.
- PaxScan contract verification.

---

## Overview

The DeFi copy-trading landscape suffers from three fundamental problems: opacity (followers cannot verify strategy execution), custody risk (platforms hold user funds), and misaligned incentives (managers profit regardless of performance).

ZibaXeer eliminates all three.

Every trade a vault leader executes is recorded on-chain. Followers retain full custody of their funded wallets. Revenue sharing only triggers on **realized profit** — aligning leader and follower incentives by design.

### Why Paxeer Network

| Property | Value |
|---|---|
| Consensus | CometBFT (Tendermint) |
| Framework | Cosmos SDK |
| EVM Compatibility | Full Web3 JSON-RPC |
| Chain ID (EVM) | `125` |
| Chain ID (Cosmos) | `hyperpax_125-1` |
| Block Time | ~2 seconds |
| Finality | Instant (single-slot) |
| Interoperability | IBC-ready |
| Native Token | `PAX` (`ahpx` / `hpx`) |

Paxeer's funded wallet model (starting at $50,000 USDL) provides immediate liquidity for both vault leaders and followers, removing the cold-start problem that plagues most copy-trading protocols.

---

## Architecture

### System Overview

```mermaid
graph TB
    subgraph Clients["Client Layer"]
        WEB[Web Dashboard - React 19 / Next.js]
        WC[ConnectKit + Wagmi - Wallet Connection]
    end

    subgraph Protocol["ZibaXeer Protocol Layer"]
        VF[Vault Factory - UUPS Proxy]
        VR[Vault Registry - UUPS Proxy]
        SE[Strategy Engine - CopyTradingVault Proxy]
        RM[Risk Manager - UUPS Proxy]
        RS[Revenue Splitter - UUPS Proxy]
        SA[SidioraVaultAdapter]
    end

    subgraph SpotExecution["Spot Execution"]
        PD[PaxDex SwapRouter02]
        LP[Liquidity Pools]
    end

    subgraph PerpsExecution["Perpetuals - Sidiora"]
        MB[Mirror Bot - BullMQ Worker]
        SID[Sidiora Off-chain Sequencer]
        TA[ITradingAccount - Per-user Margin]
    end

    subgraph Infrastructure["Paxeer Infrastructure"]
        AE[Argus Risk Engine]
        FW[Funded Wallets]
        HP[HyperPaxeer Chain - EVM Chain ID 125]
    end

    WEB --> WC
    WC --> VF
    WC --> VR
    VF --> SE
    SE --> RM
    RM --> AE
    SE --> PD
    PD --> LP
    SE --> SA
    SA --> TA
    SA --> MB
    MB --> SID
    RS --> FW
    VR --> HP
    VF --> HP
```

### Trade Mirroring Flow

```mermaid
sequenceDiagram
    participant Leader as Vault Leader
    participant Vault as ZibaXeer Vault
    participant Risk as Risk Manager
    participant Argus as Argus Engine
    participant PaxDex as PaxDex Router
    participant Follower as Follower Wallet

    Leader->>Vault: Execute trade (swap / limit order)
    Vault->>Risk: Validate against risk parameters
    Risk->>Argus: Query leader reputation score
    Argus-->>Risk: Score + signal data (500+ metrics)
    Risk-->>Vault: Approved / Rejected

    alt Trade Approved
        Vault->>PaxDex: Route leader order
        PaxDex-->>Vault: Execution confirmed

        loop For Each Follower
            Vault->>Risk: Check follower allocation limits
            Risk-->>Vault: Proportional size calculated
            Vault->>PaxDex: Mirror trade (proportional)
            PaxDex-->>Follower: Execution in follower wallet
        end
    end

    Note over Vault,Follower: Revenue split calculated on realized PnL only
```

### Revenue Distribution Model

```mermaid
flowchart LR
    TP[Total Realized Profit] --> PS{Profit Split}
    PS -->|70-90%| FP[Follower Share]
    PS -->|5-25%| LP[Leader Share]
    PS -->|2-5%| PP[Protocol Fee]
    PP --> ST[PAX Staking Rewards]
    PP --> TR[Treasury / DAO]

    style TP fill:#1a1a2e,stroke:#e94560,color:#fff
    style FP fill:#0f3460,stroke:#16213e,color:#fff
    style LP fill:#533483,stroke:#16213e,color:#fff
    style PP fill:#e94560,stroke:#16213e,color:#fff
```

---

## Core Features

### Trader Marketplace (Vaults)

- **Subscribe to Copy Trade** — Followers can discover top traders on the public marketplace and subscribe with capital allocations to copy their trades
- **Vault Creation** — Top-ranked Colosseum gladiators create strategy vaults with custom parameters
- **Multi-Strategy Support** — Spot trading, perpetuals, yield farming, and cross-protocol strategies
- **Tiered Access** — Vault leaders can set minimum follower requirements (wallet tier, $PAX stake)
- **Transparent History** — Every vault trade is on-chain, queryable, and verifiable via PaxScan

### Risk Management

- **Max Allocation Cap** — Followers configure maximum capital allocation per vault (e.g., 20% of funded balance)
- **Stop-Loss Triggers** — Automated position exits at configurable drawdown thresholds
- **Per-Trade Size Limits** — Vault leaders cannot exceed risk-weighted position sizes
- **Circuit Breakers** — Protocol-level halts if a vault's drawdown exceeds safety thresholds
- **Argus Integration** — Real-time behavioral scoring across 500+ on-chain signals via LLM decisioning

### Performance Analytics & Leaderboard

- **Public Leaderboard** — Transparent, global rankings of the best traders based on Argus score and performance metrics
- **Argus-Derived Metrics** — Win rate, Sharpe ratio, max drawdown, consistency score, risk-adjusted return
- **On-Chain Dashboards** — Real-time PnL tracking, trade history, and follower analytics
- **Historical Backtesting** — View simulated performance of strategies against historical PaxDex data

### Revenue Sharing

- **Performance-Only Fees** — Leaders earn a configurable percentage (5-25%) of follower **realized profits**
- **No Management Fees** — Zero recurring charges; incentives fully aligned with performance
- **Automated Settlement** — Profit splits calculated and distributed on-chain at configurable intervals
- **PAX Staking Bonus** — Followers who stake $PAX receive reduced protocol fees

---

## Protocol Mechanics

### Vault Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Pending: Leader submits vault creation tx

    Pending --> Active: Argus verification passed

    Active --> Paused: Leader pauses / circuit breaker

    Paused --> Active: Leader resumes / conditions cleared

    Active --> Closing: Leader initiates wind-down

    Closing --> Settled: All positions closed + PnL settled

    Settled --> [*]: Funds returned to followers

    Pending --> Rejected: Argus verification failed
    Rejected --> [*]
```

### Follower Subscription Flow

```mermaid
flowchart TD
    A[Connect Funded Wallet] --> B{Wallet Tier Check}
    B -->|Tier Met| C[Browse Vault Marketplace]
    B -->|Tier Not Met| D[Upgrade via Argus Performance]

    C --> E[Select Vault]
    E --> F[Configure Parameters]
    F --> F1[Set Allocation %]
    F --> F2[Set Stop-Loss]
    F --> F3[Set Max Per-Trade]

    F1 --> G[Approve Smart Contract]
    F2 --> G
    F3 --> G

    G --> H[Subscription Active]
    H --> I[Trades Mirrored Automatically]
    I --> J{Performance Review}
    J -->|Profitable| K[Revenue Split Distributed]
    J -->|Drawdown| L{Stop-Loss Hit?}
    L -->|Yes| M[Auto-Exit Position]
    L -->|No| I

    style A fill:#1a1a2e,stroke:#e94560,color:#fff
    style H fill:#0f3460,stroke:#533483,color:#fff
    style K fill:#533483,stroke:#e94560,color:#fff
```

---

## Smart Contract Architecture

### Contract Hierarchy

```mermaid
classDiagram
    class VaultFactory {
        +createVault(params) vault
        +getVaultCount() uint256
        +getVaultsByLeader(address) address[]
        -_validateLeader(address) bool
    }

    class CopyTradingVault {
        +leader address
        +followers mapping
        +riskParams RiskConfig
        +subscribe(allocation, stopLoss)
        +unsubscribe()
        +executeTrade(TradeParams)
        +settlePnL()
        -_mirrorTrade(follower, trade)
        -_checkRiskLimits(trade) bool
    }

    class RiskManager {
        +maxAllocation uint256
        +stopLossThreshold uint256
        +circuitBreakerLevel uint256
        +validateTrade(vault, trade) bool
        +checkDrawdown(vault) bool
        +triggerCircuitBreaker(vault)
    }

    class RevenueSplitter {
        +leaderShare uint256
        +protocolFee uint256
        +calculateSplit(profit) Split
        +distribute(vault)
        +claimRewards(follower)
    }

    class ArgusOracle {
        +getReputationScore(address) uint256
        +getPerformanceMetrics(address) Metrics
        +isEligible(address, tier) bool
        +getSignalCount() uint256
    }

    class PaxDexRouter {
        +swap(tokenIn, tokenOut, amount) uint256
        +addLiquidity(pair, amounts)
        +getPrice(pair) uint256
    }

    VaultFactory --> CopyTradingVault : deploys
    CopyTradingVault --> RiskManager : validates
    CopyTradingVault --> RevenueSplitter : distributes
    CopyTradingVault --> PaxDexRouter : executes
    RiskManager --> ArgusOracle : queries
    VaultFactory --> ArgusOracle : verifies
```

### Key Contracts

| Contract | Description | Upgradeable |
|---|---|---|
| `VaultFactory.sol` | Deploys and registers new copy-trading vaults | Yes (UUPS) |
| `CopyTradingVault.sol` | Core vault logic — trade execution, mirroring, PnL | Yes (UUPS) |
| `RiskManager.sol` | Risk parameter validation, circuit breakers, limits | Yes (UUPS) |
| `RevenueSplitter.sol` | Profit calculation and automated distribution | Yes (UUPS) |
| `ArgusOracle.sol` | Bridge to Argus Risk Engine for reputation data | Yes (UUPS) |
| `VaultRegistry.sol` | On-chain vault directory and metadata | Yes (UUPS) |
| `PaxDexAdapter.sol` | Interface adapter for PaxDex swap routing | No |
| `ZibaXeerToken.sol` | Protocol governance and utility token | No |

### Sidiora Perpetuals Integration (Phase 1)

ZibaXeer supports a delegation-based Sidiora integration path for off-chain order-book perpetuals.

What is implemented now:

- `SidioraVaultAdapter` for owner-gated margin deposit/withdraw.
- Mirror bot delegation with trade enabled and withdraw disabled.
- Delegate lifecycle controls: authorize, revoke, rotate, and mirror bot address update.
- Hardening checks for zero-address inputs, invalid amounts, invalid expiry, and safe ERC-20 transfers.
- Foundry tests validating delegation, deposit flow, withdraw flow, and owner-only controls.
- Backend/indexer queue contract for Sidiora mirroring (`SidioraMirrorSignalQueue`, result queue, risk alert queue).
- Mirror worker policy gate with `traceId` idempotency and duplicate handling.
- Control-plane API stubs for policy and freeze operations.
- PostgreSQL-backed `traceId` decision persistence for audit and incident response.

Critical trust assumption:

- Sidiora matching is off-chain, so mirror execution requires trusted off-chain services (indexer + mirror workers) with strict risk-policy enforcement.

---

## Tech Stack

### Smart Contracts

| Component | Technology |
|---|---|
| Language | Solidity `^0.8.20` |
| Framework | Foundry (`forge` testing) + Custom Node.js `solc` (`compile.js`) |
| Testing | Forge (Unit + Integration Tests against Mock Oracles) |
| Upgrades | OpenZeppelin UUPS Proxy (`ERC1967Proxy`) |
| Oracle | Custom Argus Oracle bridge |

### Backend

| Component | Technology |
|---|---|
| Runtime | Node.js 20 LTS |
| Framework | Express.js / Fastify |
| Indexer | Custom event indexer (ethers.js v6) |
| Database | PostgreSQL 16 + Redis |
| Queue | BullMQ (trade event processing) |
| WebSocket | Socket.io (real-time dashboards) |

### Frontend

| Component | Technology |
|---|---|
| Framework | Next.js 15 (App Router, React 19) |
| Styling | Tailwind CSS v4 + Radix UI + `next-themes` |
| Web3 | Wagmi v2 + viem + ConnectKit |
| State | Zustand / React Server Components |

### Infrastructure

| Component | Technology |
|---|---|
| Chain | HyperPaxeer (EVM Chain ID `125`) |
| RPC | `https://public-mainnet.rpcpaxeer.online/evm` |
| Explorer | [PaxScan](https://paxscan.paxeer.app) |
| CI/CD | GitHub Actions |
| Deployment | Vercel (frontend) + Railway (backend) |
| Monitoring | Grafana + Prometheus |

---

## Network Configuration

```
Network Name:       HyperPaxeer Mainnet
Chain ID (EVM):     125
Chain ID (Cosmos):  hyperpax_125-1
Currency Symbol:    PAX
Base Denom:         ahpx
Display Denom:      hpx
Bech32 Prefix:      pax
RPC URL:            https://public-mainnet.rpcpaxeer.online/evm
Block Explorer:     https://paxscan.paxeer.app
Block Time:         ~2 seconds
Consensus:          CometBFT
```

### Add to MetaMask

| Field | Value |
|---|---|
| Network Name | HyperPaxeer Mainnet |
| RPC URL | `https://public-mainnet.rpcpaxeer.online/evm` |
| Chain ID | `125` |
| Currency Symbol | `PAX` |
| Explorer URL | `https://paxscan.paxeer.app` |

---

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Foundry (forge, cast, anvil)
- Git
- A funded wallet on HyperPaxeer (register at [hyperpaxeer.com](https://hyperpaxeer.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/thetruesammyjay/ZibaXeer.git
cd ZibaXeer

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Configure your environment
# Edit .env with your RPC URL, private keys, and API endpoints
```

### Environment Variables

```bash
# Network
HYPERPAXEER_RPC_URL=https://public-mainnet.rpcpaxeer.online/evm
CHAIN_ID=125

# Deployer
DEPLOYER_PRIVATE_KEY=0x...
DEPLOYER_ADDRESS=0x...

# Argus Oracle
ARGUS_ORACLE_ENDPOINT=https://api.hyperpaxeer.com/argus/v1
ARGUS_API_KEY=your_api_key

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/zibaxeer
REDIS_URL=redis://localhost:6379

# Frontend
NEXT_PUBLIC_RPC_URL=https://public-mainnet.rpcpaxeer.online/evm
NEXT_PUBLIC_CHAIN_ID=125
NEXT_PUBLIC_EXPLORER_URL=https://paxscan.paxeer.app
```

---

## Development

### Compile Contracts

```bash
# Using custom Node compiler script (bypasses ESM issues)
cd contracts
node compile.js

# Note: This will export directly to `out/`
```

### Run Local Node

```bash
# Fork HyperPaxeer mainnet locally
anvil --fork-url https://public-mainnet.rpcpaxeer.online/evm --chain-id 125
```

### Start Backend

```bash
cd apps/backend
pnpm run dev
```

### Start Frontend

```bash
cd apps/frontend
pnpm run dev
```

### Start Indexer (Optional)

```bash
cd apps/indexer
pnpm run dev
```

### Build Backend and Indexer

```bash
pnpm --filter backend build
pnpm --filter indexer build
```

---

## Testing

### Smart Contract Tests

```bash
# Unit tests
forge test

# Fuzz tests
forge test --fuzz-runs 10000

# Invariant tests
forge test --match-contract Invariant

# Coverage report
forge coverage --report lcov
```

### Backend Tests

```bash
cd apps/backend
pnpm run build
```

### Indexer Validation

```bash
cd apps/indexer
pnpm run build
```

### Frontend Tests

```bash
cd apps/frontend
# No test script is configured in apps/frontend/package.json
pnpm run lint
```

---

## Deployment

### Deploy to HyperPaxeer Mainnet

> ✅ **Already deployed.** See [Current Status](#current-status) for live contract addresses.

To run a fresh deployment (e.g. for a fork or testnet):

```bash
# Full fresh deployment (EVM version locked to London for HyperPaxeer compatibility)
cd contracts
forge clean && forge build
forge script script/DeployFresh.s.sol \
  --rpc-url https://public-mainnet.rpcpaxeer.online/evm \
  --broadcast --slow --skip-simulation
```

# Verify on PaxScan
```bash
forge verify-contract <CONTRACT_ADDRESS> src/core/VaultFactory.sol:VaultFactory \
    --chain 125 \
  --etherscan-api-key $PAXSCAN_API_KEY
```

### Deploy Frontend

```bash
cd apps/frontend
vercel deploy --prod
```

### Deploy Backend

```bash
cd apps/backend
railway up
```

### Deploy Indexer

```bash
cd apps/indexer
railway up
```

<Note>
    For Railway monorepos, create two separate services from the same GitHub repository: one for backend and one for indexer. Set service-specific build/start commands and environment variables in each Railway service.
</Note>

---

## Security

### Audit Status

| Audit | Firm | Status |
|---|---|---|
| Smart Contract Audit | TBD | Planned |
| Economic Model Review | TBD | Planned |
| Penetration Testing | TBD | Planned |

### Security Measures

- **UUPS Proxy Pattern** — Contracts are upgradeable with time-locked governance
- **Owner-Gated Adapter Controls** — Sidiora delegate and margin functions are restricted to vault owner
- **Reentrancy Guards** — All state-changing functions protected
- **Circuit Breakers** — Automated vault freezing on anomalous activity
- **Multi-Sig Governance** — Protocol upgrades require DAO multi-sig approval
- **Rate Limiting** — Trade mirroring bounded by per-block execution limits
- **Mirror Delegate Restrictions** — Mirror bot delegation disallows withdrawal permissions
- **Idempotent Mirroring** — `traceId`-based duplicate suppression in mirror worker
- **Durable Audit Trail** — PostgreSQL persistence of mirror decisions for reconciliation and forensics

### Responsible Disclosure

If you discover a vulnerability, report it privately to **security@zibaxeer.io** before any public disclosure.

---

## Roadmap

```mermaid
gantt
    title ZibaXeer Development Roadmap
    dateFormat YYYY-MM-DD
    axisFormat %b %Y

    section Phase 1 - Foundation
    Core Contracts Development     :done, p1a, 2026-01-05, 90d
    Argus Oracle Integration       :done, p1b, 2026-01-15, 60d
    PaxDex Router Adapter          :active, p1c, 2026-02-01, 45d
    Testnet Deployment             :active, p1d, 2026-03-01, 30d

    section Phase 2 - Launch
    Security Audit                 : p2a, 2026-04-01, 45d
    Mainnet Deployment             : p2b, after p2a, 14d
    Web Dashboard v1               : p2c, 2026-04-01, 60d
    Colosseum Integration          : p2d, 2026-05-15, 30d

    section Phase 3 - Growth
    Multi-Strategy Vaults          : p3a, 2026-07-01, 60d
    IBC Cross-Chain Mirroring      : p3b, 2026-07-01, 90d
    Mobile App - React Native      : p3c, 2026-07-15, 75d
    Governance Token Launch        : p3d, 2026-09-01, 30d

    section Phase 4 - Scale
    Institutional Vault Tiers      : p4a, 2026-10-01, 60d
    Advanced Analytics Engine      : p4b, 2026-10-15, 45d
    DAO Governance v2              : p4c, 2026-11-01, 45d
    SDK and API Public Release     : p4d, 2026-11-15, 30d
```

---

## Contributing

We welcome contributions from the community. Please read the following before submitting:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/vault-analytics`)
3. **Commit** with conventional commits (`feat:`, `fix:`, `docs:`, `test:`)
4. **Test** thoroughly (`cd contracts && forge test`; frontend currently supports `pnpm run lint`)
5. **Submit** a Pull Request targeting `main`

### Code Standards

- Solidity: Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html) + NatSpec comments on all public functions
- TypeScript: ESLint + Prettier, strict mode enabled
- Commits: [Conventional Commits](https://www.conventionalcommits.org/)
- PRs: Must include tests and pass CI

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

---

## Links

| Resource | URL |
|---|---|
| Paxeer Network | [hyperpaxeer.com](https://hyperpaxeer.com) |
| Documentation (ZibaXeer) | [sammyjaysoftwaresolutionsandconsultancyltd.mintlify.app](https://sammyjaysoftwaresolutionsandconsultancyltd.mintlify.app/) |
| Documentation (Paxeer) | [docs.hyperpaxeer.com](https://docs.hyperpaxeer.com) |
| Block Explorer | [paxscan.paxeer.app](https://paxscan.paxeer.app) |
| Colosseum | [colosseum.hyperpaxeer.com/dashboard](https://colosseum.hyperpaxeer.com/dashboard) |
| Hackathon | [build.hyperpaxeer.com/hackathon](https://build.hyperpaxeer.com/hackathon) |
| GitHub (ZibaXeer) | [github.com/thetruesammyjay/ZibaXeer](https://github.com/thetruesammyjay/ZibaXeer) |
| GitHub (Paxeer) | [github.com/paxeer-network](https://github.com/paxeer-network) |
| X (Twitter) | [@paxeer_app](https://x.com/paxeer_app) |
