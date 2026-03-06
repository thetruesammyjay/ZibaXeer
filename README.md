# ZibaXeer

**On-Chain Copy-Trading Vault — Social Trading Protocol on Paxeer Network**

ZibaXeer is a decentralized copy-trading vault protocol deployed on **HyperPaxeer** (EVM Chain ID `125`). It enables top-performing Colosseum traders to create strategy vaults that other funded wallets can mirror — transparently, non-custodially, and with configurable risk parameters.

> Built natively on PaxDex. Powered by the Argus Risk Engine. Designed for the capital layer of Web3.

---

## Table of Contents

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
        WEB[Web Dashboard]
        SDK[ZibaXeer SDK]
        API[REST / WebSocket API]
    end

    subgraph Protocol["ZibaXeer Protocol Layer"]
        VF[Vault Factory]
        VR[Vault Registry]
        SE[Strategy Engine]
        RM[Risk Manager]
        RS[Revenue Splitter]
    end

    subgraph Execution["Execution Layer"]
        PD[PaxDex Router]
        OB[Order Book]
        LP[Liquidity Pools]
    end

    subgraph Infrastructure["Paxeer Infrastructure"]
        AE[Argus Risk Engine]
        FW[Funded Wallets]
        HP[HyperPaxeer Chain<br/>EVM Chain ID 125]
    end

    WEB --> API
    SDK --> API
    API --> VF
    API --> VR
    VF --> SE
    SE --> RM
    RM --> AE
    SE --> PD
    PD --> OB
    PD --> LP
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

    Note over Vault,Follower: Revenue split calculated<br/>on realized PnL only
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

### Vault System

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

### Performance Analytics

- **Argus-Derived Metrics** — Win rate, Sharpe ratio, max drawdown, consistency score, risk-adjusted return
- **On-Chain Dashboards** — Real-time PnL tracking, trade history, and follower analytics
- **Leaderboard Rankings** — Vault leaders ranked by performance, with Colosseum season integration
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
    [*] --> Pending: Leader submits<br/>vault creation tx

    Pending --> Active: Argus verification<br/>passed

    Active --> Paused: Leader pauses /<br/>circuit breaker

    Paused --> Active: Leader resumes /<br/>conditions cleared

    Active --> Closing: Leader initiates<br/>wind-down

    Closing --> Settled: All positions<br/>closed + PnL settled

    Settled --> [*]: Funds returned<br/>to followers

    Pending --> Rejected: Argus verification<br/>failed
    Rejected --> [*]
```

### Follower Subscription Flow

```mermaid
flowchart TD
    A[Connect Funded Wallet] --> B{Wallet Tier Check}
    B -->|Tier Met| C[Browse Vault Marketplace]
    B -->|Tier Not Met| D[Upgrade via Argus<br/>Performance]

    C --> E[Select Vault]
    E --> F[Configure Parameters]
    F --> F1[Set Allocation %]
    F --> F2[Set Stop-Loss]
    F --> F3[Set Max Per-Trade]

    F1 --> G[Approve Smart Contract]
    F2 --> G
    F3 --> G

    G --> H[Subscription Active]
    H --> I[Trades Mirrored<br/>Automatically]
    I --> J{Performance Review}
    J -->|Profitable| K[Revenue Split<br/>Distributed]
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

---

## Tech Stack

### Smart Contracts

| Component | Technology |
|---|---|
| Language | Solidity `^0.8.20` |
| Framework | Hardhat / Foundry |
| Testing | Forge (fuzz + invariant tests) |
| Upgrades | OpenZeppelin UUPS Proxy |
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
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + Radix UI |
| Web3 | wagmi v2 + viem |
| Charts | Lightweight Charts (TradingView) |
| State | Zustand |

### Infrastructure

| Component | Technology |
|---|---|
| Chain | HyperPaxeer (EVM Chain ID `125`) |
| RPC | `https://mainnet-beta.rpc.hyperpaxeer.com/rpc` |
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
RPC URL:            https://mainnet-beta.rpc.hyperpaxeer.com/rpc
Block Explorer:     https://paxscan.paxeer.app
Block Time:         ~2 seconds
Consensus:          CometBFT
```

### Add to MetaMask

| Field | Value |
|---|---|
| Network Name | HyperPaxeer Mainnet |
| RPC URL | `https://mainnet-beta.rpc.hyperpaxeer.com/rpc` |
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
HYPERPAXEER_RPC_URL=https://mainnet-beta.rpc.hyperpaxeer.com/rpc
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
NEXT_PUBLIC_RPC_URL=https://mainnet-beta.rpc.hyperpaxeer.com/rpc
NEXT_PUBLIC_CHAIN_ID=125
NEXT_PUBLIC_EXPLORER_URL=https://paxscan.paxeer.app
```

---

## Development

### Compile Contracts

```bash
# Using Foundry
forge build

# Using Hardhat
npx hardhat compile
```

### Run Local Node

```bash
# Fork HyperPaxeer mainnet locally
anvil --fork-url https://mainnet-beta.rpc.hyperpaxeer.com/rpc --chain-id 125
```

### Start Backend

```bash
cd apps/backend
pnpm dev
```

### Start Frontend

```bash
cd apps/frontend
pnpm dev
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
pnpm test
pnpm test:e2e
```

### Frontend Tests

```bash
cd apps/frontend
pnpm test
pnpm test:e2e
```

---

## Deployment

### Deploy to HyperPaxeer Mainnet

```bash
# Deploy core contracts
forge script script/Deploy.s.sol \
  --rpc-url https://mainnet-beta.rpc.hyperpaxeer.com/rpc \
  --broadcast \
  --verify

# Verify on PaxScan
forge verify-contract <CONTRACT_ADDRESS> src/VaultFactory.sol:VaultFactory \
  --chain-id 125 \
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
- **Role-Based Access Control** — OpenZeppelin AccessControl for admin functions
- **Reentrancy Guards** — All state-changing functions protected
- **Circuit Breakers** — Automated vault freezing on anomalous activity
- **Multi-Sig Governance** — Protocol upgrades require DAO multi-sig approval
- **Rate Limiting** — Trade mirroring bounded by per-block execution limits

### Responsible Disclosure

If you discover a vulnerability, report it privately to **security@zibaxeer.io** before any public disclosure.

---

## Roadmap

```mermaid
gantt
    title ZibaXeer Development Roadmap
    dateFormat YYYY-Q
    axisFormat %Y Q%q

    section Phase 1 - Foundation
    Core Contracts Development     :done, p1a, 2026-Q1, 90d
    Argus Oracle Integration       :done, p1b, 2026-Q1, 60d
    PaxDex Router Adapter          :active, p1c, 2026-Q1, 45d
    Testnet Deployment             :active, p1d, 2026-Q1, 30d

    section Phase 2 - Launch
    Security Audit                 : p2a, 2026-Q2, 45d
    Mainnet Deployment             : p2b, after p2a, 14d
    Web Dashboard v1               : p2c, 2026-Q2, 60d
    Colosseum Integration          : p2d, 2026-Q2, 30d

    section Phase 3 - Growth
    Multi-Strategy Vaults          : p3a, 2026-Q3, 60d
    IBC Cross-Chain Mirroring      : p3b, 2026-Q3, 90d
    Mobile App (React Native)      : p3c, 2026-Q3, 75d
    Governance Token Launch        : p3d, 2026-Q3, 30d

    section Phase 4 - Scale
    Institutional Vault Tiers      : p4a, 2026-Q4, 60d
    Advanced Analytics Engine      : p4b, 2026-Q4, 45d
    DAO Governance v2              : p4c, 2026-Q4, 45d
    SDK and API Public Release     : p4d, 2026-Q4, 30d
```

---

## Contributing

We welcome contributions from the community. Please read the following before submitting:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/vault-analytics`)
3. **Commit** with conventional commits (`feat:`, `fix:`, `docs:`, `test:`)
4. **Test** thoroughly (`forge test && pnpm test`)
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
| Documentation | [docs.hyperpaxeer.com](https://docs.hyperpaxeer.com) |
| Block Explorer | [paxscan.paxeer.app](https://paxscan.paxeer.app) |
| Colosseum | [colosseum.hyperpaxeer.com/dashboard](https://colosseum.hyperpaxeer.com/dashboard) |
| Hackathon | [build.hyperpaxeer.com/hackathon](https://build.hyperpaxeer.com/hackathon) |
| GitHub (ZibaXeer) | [github.com/thetruesammyjay/ZibaXeer](https://github.com/thetruesammyjay/ZibaXeer) |
| GitHub (Paxeer) | [github.com/paxeer-network](https://github.com/paxeer-network) |
| X (Twitter) | [@paxeer_app](https://x.com/paxeer_app) |
