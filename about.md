# ⚔️ OBSCURA PROTOCOL — Privacy-First Prediction Markets on Aleo

> **Wave 4 Submission · Aleo Developer Program**
> 🌐 Live: https://obscura-protocol.netlify.app · ⚡ API: https://obscura-protocol-api.onrender.com/api/health

---

## 🧠 The Problem

Every major prediction market — Polymarket, Augur, Azuro — leaks everything on-chain: your wallet, position, bet size, payout, strategy. This enables front-running, whale-watching, and identity correlation. **Financial privacy is a fundamental right.**

---

## 💡 The Solution — Obscura Protocol

Obscura Protocol is a **zero-knowledge prediction market protocol** on **Aleo**. Every trade, every position, and every payout is protected by ZK proofs. No one — not even the protocol — can see what you bet, how much you hold, or what you won.

**What makes it different:**
- 🔒 Positions stored as **encrypted on-chain records** — only the holder can decrypt
- 📊 **FPMM AMM** — no order books, no front-running possible
- ⚡ **Eclipse Rounds** — 15-minute auto-resolved price prediction rounds (UP/DOWN on BTC, ETH, ALEO)
- 🏩 **On-chain Governance** — propose, vote, and execute protocol changes
- 🎯 **Multi-outcome markets** — 2, 3, or 4 outcomes per market
- 💰 **Triple token support** — ALEO, USDCx, USAD
- ⚖️ **Automated resolution** — Round Bot uses delegated proving to auto-resolve rounds via oracle prices

---

## 📜 Smart Contracts (Wave 4)

**3 Leo programs deployed on Aleo Testnet** — split to overcome Aleo's 2.1M variable limit:

| Program | Token | TX |
|---------|-------|----|
| `obscura_protocol_v7.aleo` | ALEO + Governance (17 transitions) | `at1459u3ehmatrnk8huk5wj4dtfw668fml6kga62rkw0m4wpnfrxvqs79ey84` |
| `obscura_protocol_v7_cx.aleo` | USDCx (15 transitions) | `at1g4py5xd8htpnalkm07axnahp5gyxj57jgm5cj9dqfxeeqckdzs8qpguzw9` |
| `obscura_protocol_v7_sd.aleo` | USAD (15 transitions) | `at1yupukl8wynnu748u95scnqztqk33nwema3lxy7dfw7jm694cucyshswksx` |

**Total: 47 transitions · 3,110,926 variables · 2,856 statements**

**Key transitions:** `open_market` (create) · `acquire_shares` (private buy) · `dispose_shares` (private sell) · `fund_pool` (LP) · `flash_settle` (instant Strike resolution) · `render_verdict` / `ratify_verdict` (event resolution) · `contest_verdict` (dispute with 5 ALEO bond) · `harvest_winnings` (private payout) · `submit_proposal` + `cast_vote` (governance)

---

## 🔒 Privacy Architecture

```
Buy:   private credits → transfer_private_to_public → encrypted OutcomeShare record
Sell:  OutcomeShare record → AMM → transfer_public_to_private → private credits
Claim: OutcomeShare (winning) → harvest_winnings → private credits
```

| Layer | Privacy |
|-------|---------|
| Trader identity | 🟢 Fully private (ZK-encrypted) |
| Position sizes | 🟢 Encrypted record — invisible on-chain |
| LP + Dispute bonds | 🟢 Encrypted LPToken / DisputeBondReceipt records |
| All payouts | 🟢 Private credits via ZK transfer |
| Market state / outcome | 🔴 Public (required for fair AMM) |

---

## 🏗️ Full-Stack Architecture

```
Frontend  →  React 18 + Vite + TypeScript + Tailwind + Zustand + Shield Wallet
Backend   →  Express + Node.js
               ├── 7-source oracle fallback (CoinGecko → OKX → Binance → CoinCap → ...)
               ├── Auto-indexer + chain scanner (new market detection every 60s)
               ├── Delegated prover (Provable API, ~30s per tx)
               ├── Round Bot (automated 15-min Eclipse Rounds: 3 slots, all settled on-chain)
               └── ECLIPSE Manager (tracks rounds, admin manual override)
Contracts →  3 Leo programs on Aleo Testnet (47 transitions)
```

---

## 🖥️ All Working Pages (14 total)

`/` Landing · `/markets` Browse · `/markets/:id` Trade · `/rounds` Eclipse Rounds · `/portfolio` Positions · `/create` Create Market · `/governance` Proposals+Voting · `/leaderboard` · `/pools` LP · `/stats` Analytics · `/admin` Resolver · `/docs` · `/faq` · `/privacy`

---

## ⚡ Eclipse Rounds — Full Flow (Automated)

1. **Round Bot** creates 3 concurrent markets via delegated proving (~30s each): BTC/ALEO, ETH/ALEO, ALEO/ALEO.
2. User bets UP or DOWN → private `OutcomeShare` record on-chain.
   - 40-second cooldown between bets prevents UTXO reuse errors across markets.
3. Round timer expires (15 minutes). UI shows "Settling..." with progress info.
4. Bot compares oracle start vs end price → `flash_settle` via delegated proving for ALL markets (including empty ones — ensures clean on-chain state).
5. Bot creates the next round automatically (new nonce, fresh start price).
6. Winner calls `harvest_winnings` → receives private credits 1:1.
7. **Smart Recovery**: On restart, the bot adopts existing active rounds instead of creating duplicates. Expired/transient slots reset to idle. Max 3 settle retries before skipping.

> Admin can still override any round manually via `/admin` + wallet `flash_settle`.

---

## 🏛️ Governance (Live, Evolving)

On-chain via `submit_proposal` + `cast_vote`. Supported: approve resolvers, treasury withdrawals, fee updates, market overrides. Governance receipts are encrypted on-chain. Quorum, timelock, and stronger execution guards planned for future waves.

---

## 🚀 Wave 4 New Features

- 🆕 3-program v6 architecture (v5 was single-program, hit variable limit at 2.1M)
- 🆕 USAD stablecoin — 3rd token with own program
- 🆕 On-chain governance (`submit_proposal` + `cast_vote` with `GovernanceReceipt`)
- 🆕 Eclipse Rounds redesigned: 15-minute auto-resolved cycles with 3 concurrent slots (BTC, ETH, ALEO)
- 🆕 All rounds settled on-chain via `flash_settle` (no virtual reset)
- 🆕 Smart recovery: bot adopts existing active rounds on restart, prevents duplicates
- 🆕 Bet cooldown (40s) — prevents UTXO reuse errors when betting across multiple markets
- 🆕 Settling UX — clear "Settling..." status with time estimate when rounds expire
- 🆕 Portfolio win/loss states — proper Won/Lost/Claimable display for resolved markets
- 🆕 Friendly error messages for common wallet issues (spent records, insufficient balance)
- 🆕 Admin panel: oracle startPrice vs endPrice comparison, resolve via wallet with `flash_settle`
- 🆕 7-source oracle fallback chain (CoinGecko → OKX → Binance → CoinCap → ...)
- 🆕 Portfolio PnL visualization + history
- 🆕 Full UI/UX redesign (glassmorphism, 3D cards, animated landing)

---

> 🔮 **Roadmap:** Stronger USDCx/USAD deposit privacy · Governance quorum + timelock · Mainnet deployment

---

*Aleo Developer Program — Wave 4 · All tokens are testnet tokens with no real-world value.*

