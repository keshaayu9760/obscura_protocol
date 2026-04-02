# Obscura Ledger v8 Surface Spec

## Goal

Create a new Leo contract family that looks materially different on the outside while preserving the existing engine semantics:

- same AMM math
- same fee math
- same dispute and settlement flow
- same status/token numeric values
- same transition input ordering and return tuple shapes
- same record and struct field ordering

The new program family is:

- `obscura_ledger_v8.aleo`
- `obscura_ledger_v8_cx.aleo`
- `obscura_ledger_v8_sd.aleo`

## Safety Model

### Safe to rename

- program IDs
- comments and section banners
- exported transition names
- exported record names
- exported struct names
- mapping names
- non-semantic constant identifiers
- local variable names

### Must remain behavior-identical

- all arithmetic and branch conditions
- fee basis-point values
- status numeric values
- token numeric values
- transition input types and ordering
- transition return tuple arity and ordering
- record field types and ordering
- struct field types and ordering

### Keep unchanged because hash-sensitive

These helper structs stay in place to avoid changing hash preimage composition without Leo equivalence testing:

- `MarketSeed`
- `ShareClaimKey`
- `LPClaimKey`
- `DisputeClaimKey`
- `ProposalSeed`
- `VoteKey`

Their field names, ordering, and value composition stay unchanged.

## Public Rename Map

### Main + stablecoin shared renames

- `OutcomeShare` -> `PositionNote`
- `LPToken` -> `LiquidityNote`
- `DisputeBondReceipt` -> `AppealBondNote`
- `RefundClaim` -> `VoidClaimNote`
- `GovernanceReceipt` -> `BallotReceipt` (main only)
- `Market` -> `Book`
- `AMMPool` -> `LiquidityCurve`
- `MarketResolution` -> `VerdictLedger`
- `MarketFees` -> `FeeLedger`
- `markets` -> `books`
- `amm_pools` -> `liquidity_curves`
- `market_resolutions` -> `verdicts`
- `market_fees` -> `fee_ledgers`
- `share_redeemed` -> `position_claimed`
- `creator_fees_claimed` -> `curator_fee_claimed`
- `program_credits` -> `treasury_balances`
- `market_credits` -> `book_balances`
- `lp_positions` -> `liquidity_claimed`
- `protocol_paused` -> `circuit_breaker`
- `market_dossiers` -> `brief_registry`

### Main-only governance renames

- `Proposal` -> `Motion`
- `proposals` -> `motions`
- `vote_cast` -> `ballots_cast`
- `approved_resolvers` -> `resolver_registry`

### Transition renames

- `open_market` -> `open_book`
- `acquire_shares` -> `enter_position`
- `dispose_shares` -> `exit_position`
- `fund_pool` -> `seed_liquidity`
- `lock_market` -> `lock_book`
- `render_verdict` -> `stage_verdict`
- `ratify_verdict` -> `seal_verdict`
- `void_market` -> `void_book`
- `flash_settle` -> `instant_settle`
- `contest_verdict` -> `appeal_verdict`
- `recover_bond` -> `reclaim_bond`
- `harvest_winnings` -> `redeem_position`
- `harvest_refund` -> `redeem_void`
- `withdraw_pool` -> `release_liquidity`
- `harvest_fees` -> `claim_curator_fees`
- `submit_proposal` -> `file_motion` (main only)
- `cast_vote` -> `cast_ballot` (main only)
- `authorize_resolver` -> `register_resolver` (main only)
- `set_protocol_pause` -> `set_circuit_breaker`
- `pin_market_dossier` -> `attach_brief`

Matching finalize functions follow the same rename pattern.

## Constant Identifier Renames

- `DEPLOYER` -> `STEWARD`
- `PROTOCOL_FEE_BPS` -> `HOUSE_FEE_BPS`
- `CREATOR_FEE_BPS` -> `CURATOR_FEE_BPS`
- `LP_FEE_BPS` -> `VAULT_FEE_BPS`
- `FEE_DENOMINATOR` -> `BPS_SCALE`
- `STATUS_ACTIVE` -> `PHASE_OPEN`
- `STATUS_CLOSED` -> `PHASE_LOCKED`
- `STATUS_RESOLVED` -> `PHASE_SETTLED`
- `STATUS_CANCELLED` -> `PHASE_VOID`
- `STATUS_PENDING_RESOLUTION` -> `PHASE_UNDER_REVIEW`
- `TOKEN_ALEO` -> `ASSET_ALEO`
- `TOKEN_USDCX` -> `ASSET_USDCX`
- `TOKEN_USAD` -> `ASSET_USAD`
- `CHALLENGE_WINDOW` -> `APPEAL_WINDOW`
- `MIN_TRADE_AMOUNT` -> `MIN_ORDER_SIZE`
- `MIN_LIQUIDITY` -> `MIN_BOOK_DEPTH`
- `MIN_DISPUTE_BOND` -> `MIN_APPEAL_BOND`
- `GOVERNANCE_QUORUM` -> `MOTION_QUORUM`
- `PAUSE_KEY` -> `BREAKER_SLOT`

## Integration Updates Required

- frontend program IDs and transition constants
- frontend transaction builders
- wallet provider program registration
- frontend record-name parsing for `PositionNote` and `BallotReceipt`
- backend config program IDs
- backend automated function dispatch names
- backend mapping queries for `books`, `liquidity_curves`, `verdicts`, `motions`
- docs and health endpoints that expose live program IDs

## Explicit Non-Goals

- no economic changes
- no governance rule changes
- no new transition inputs
- no reordered return tuples
- no rewritten hashing scheme
- no migration logic changes in this patch
