# Architecture

## System Overview

Obscura Protocol is a three-tier application:

```
┌─────────────────────────────────────────────────────────┐
│                    User (Browser)                        │
│             Shield Wallet Extension                      │
└────────────┬────────────────────────────┬───────────────┘
             │                            │
             ▼                            ▼
┌────────────────────────┐  ┌─────────────────────────────┐
│    Frontend (Vite)     │  │    Backend (Express)         │
│    React + TypeScript   │  │    Oracle + Resolver +       │
│    Zustand + Tailwind   │  │    Indexer Services          │
│    Port 5173           │  │    Port 3001                 │
└────────────┬───────────┘  └──────────┬──────────────────┘
             │                         │
             ▼                         ▼
┌─────────────────────────────────────────────────────────┐
│              Aleo Blockchain (Testnet)                   │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │            obscura_protocol_v7.aleo                       ││
│  │                                                     ││
│  │  Transitions (24)  │  Records (4)  │  Mappings (9)  ││
│  │                                                     ││
│  │  FPMM Engine  │  Oracle  │  Pools  │  Streaks       ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ┌─────────────────┐                                   │
│  │  credits.aleo    │  ← Private credit transfers      │
│  └─────────────────┘                                   │
└─────────────────────────────────────────────────────────┘
```

## Data Flow

### Buy Shares Flow

1. User selects outcome and enters amount in the frontend
2. Frontend pre-computes expected shares using the FPMM formula
3. Shield Wallet constructs the transaction with `privateFee: false`
4. Delegated prover generates ZK proof (~14 seconds)
5. Transaction broadcasts to the Aleo network
6. `buy_shares_private` transition creates a private `SharePosition` record
7. `finalize` updates on-chain mappings (reserves, volume, trade count)
8. User receives the `SharePosition` record in their wallet

### Oracle Flow

1. Backend cron job fetches prices from CoinGecko every minute
2. Admin calls `update_oracle_prices(btc, eth, aleo)` transition
3. Finalize function validates admin and writes to `oracle_prices` mapping
4. Eclipse markets reference oracle prices for auto-resolution

### Privacy Guarantees

- **Transition Layer**: Only the user's private records are inputs; no addresses leak
- **Finalize Layer**: Updates global state without linking to user addresses
- **Credits Flow**: `transfer_private_to_public` for deposits, `transfer_public_to_private` for payouts
- **Market Creation**: Market ID = BHP256::hash_to_field(nonce) — no creator address included

## Component Architecture (Frontend)

```
App
├── WalletProvider (Shield Wallet)
├── Landing (/)
│   ├── HeroSection
│   ├── LiveMarketsSection
│   ├── FeaturesSection
│   ├── EclipseSection
│   ├── HowItWorksSection
│   ├── PrivacySection
│   ├── ArchitectureSection
│   ├── ComparisonSection
│   ├── TechStackSection
│   └── CTASection
├── MainLayout
│   ├── Navbar + WalletButton
│   ├── <Outlet> (page content)
│   ├── Footer
│   └── ToastContainer
├── Markets (/markets)
│   ├── MarketFilters
│   └── MarketCard[]
├── MarketDetail (/markets/:id)
│   ├── MarketHeader
│   ├── MarketChart
│   ├── OrderBook
│   ├── TradeHistory
│   ├── TradePanel
│   └── MarketStats
├── ECLIPSE (/ECLIPSE)
│   ├── ActiveRounds → EclipseCard[]
│   ├── EclipseHistory
│   └── OraclePriceFeed
├── Pools (/pools)
│   ├── PoolStats
│   ├── PoolList → PoolCard[]
│   └── CreatePoolPanel (modal)
├── Portfolio (/portfolio)
│   ├── PnLSummary
│   ├── PositionList → PositionCard[]
│   ├── TradeHistoryTable
│   └── LPPositions
├── Leaderboard (/leaderboard)
│   ├── LeaderboardTable
│   └── StreakDisplay
├── CreateMarket (/create)
│   ├── CreateEventForm
│   └── CreateEclipseForm
├── Stats (/stats)
│   └── StatsOverview
└── Docs (/docs)
```

## State Management

Zustand stores with minimal boilerplate:

- **walletStore**: Connection state, address, balance
- **marketStore**: Markets list, filters, search, sort
- **oracleStore**: Real-time price feeds (BTC/ETH/ALEO)
- **portfolioStore**: User positions, LP receipts, trade history
- **notificationStore**: Toast notifications

