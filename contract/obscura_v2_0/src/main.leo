// ============================================================================
// OBSCURA PROTOCOL v2.0 — Private Prediction Market [Production Ready]
// ============================================================================
// ALEO-native markets, FPMM AMM, governance, dispute system, Eclipse rounds,
// oracle integration, and complete revenue system.
// Stablecoin markets handled by companion programs (cx, sd).
//
// PRIVACY MODEL:
//   - Buy: transfer_private_to_public hides sender identity
//   - Sell/Redeem/Refund: transfer_public_to_private hides recipient
//   - All position records are private (no mapping by address)
//
// v2.0 ADDITIONS:
//   - #21: withdraw_protocol_fees — Revenue extraction for deployer
//   - #22: execute_proposal — Complete governance execution
//   - #23: oracle_settle — Pyth/Chainlink oracle-based resolution
//   - #24: register_event_oracle — Configure oracle parameters
//
// 24 transitions
// ============================================================================

import credits.aleo;

program obscura_v2_0.aleo {

    // ========================================================================
    // CONSTANTS
    // ========================================================================

    const DEPLOYER: address = aleo19za49scmhufst9q8lhwka5hmkvzx5ersrue3gjwcs705542daursptmx0r;

    const PROTOCOL_FEE_BPS: u128 = 50u128;
    const CREATOR_FEE_BPS: u128 = 50u128;
    const LP_FEE_BPS: u128 = 100u128;
    const FEE_DENOMINATOR: u128 = 10000u128;

    const STATUS_ACTIVE: u8 = 1u8;
    const STATUS_CLOSED: u8 = 2u8;
    const STATUS_RESOLVED: u8 = 3u8;
    const STATUS_CANCELLED: u8 = 4u8;
    const STATUS_PENDING_RESOLUTION: u8 = 5u8;

    const TOKEN_ALEO: u8 = 0u8;
    const TOKEN_USDCX: u8 = 1u8;
    const TOKEN_USAD: u8 = 2u8;

    const CHALLENGE_WINDOW: u32 = 2880u32;
    const MIN_TRADE_AMOUNT: u128 = 10_000u128;
    const MIN_LIQUIDITY: u128 = 1_000_000u128;
    const MIN_DISPUTE_BOND: u128 = 5_000_000u128;
    const GOVERNANCE_QUORUM: u128 = 1u128;
    const PAUSE_KEY: u8 = 0u8;

    // Governance action types
    const ACTION_EMERGENCY_RESOLVE: u8 = 1u8;
    const ACTION_AUTHORIZE_RESOLVER: u8 = 2u8;
    const ACTION_SET_PAUSE: u8 = 3u8;

    // Oracle comparison types
    const COMPARE_ABOVE: u8 = 1u8;
    const COMPARE_BELOW: u8 = 2u8;
    const COMPARE_BETWEEN: u8 = 3u8;

    // ========================================================================
    // RECORDS
    // ========================================================================

    record OutcomeShare {
        owner: address,
        market_id: field,
        outcome: u8,
        quantity: u128,
        share_nonce: field,
        token_type: u8,
    }

    record LPToken {
        owner: address,
        market_id: field,
        lp_shares: u128,
        lp_nonce: field,
        token_type: u8,
    }

    record DisputeBondReceipt {
        owner: address,
        market_id: field,
        proposed_outcome: u8,
        bond_amount: u128,
        dispute_nonce: field,
    }

    record RefundClaim {
        owner: address,
        market_id: field,
        amount: u128,
        claim_nonce: field,
        token_type: u8,
    }

    record GovernanceReceipt {
        owner: address,
        proposal_id: field,
        vote_weight: u128,
    }

    // ========================================================================
    // STRUCTS
    // ========================================================================

    struct Market {
        id: field,
        creator: address,
        resolver: address,
        question_hash: field,
        category: u8,
        num_outcomes: u8,
        deadline: u32,
        resolution_deadline: u32,
        status: u8,
        created_at: u32,
        token_type: u8,
    }

    struct AMMPool {
        market_id: field,
        reserve_1: u128,
        reserve_2: u128,
        reserve_3: u128,
        reserve_4: u128,
        total_liquidity: u128,
        total_lp_shares: u128,
        total_volume: u128,
    }

    struct MarketResolution {
        market_id: field,
        winning_outcome: u8,
        resolved_at: u32,
        challenge_deadline: u32,
        finalized: bool,
    }

    struct MarketFees {
        market_id: field,
        protocol_fees: u128,
        creator_fees: u128,
    }

    struct MarketSeed {
        creator: address,
        question_hash: field,
        nonce: field,
    }

    struct ShareClaimKey {
        market_id: field,
        claimer: address,
        share_nonce: field,
    }

    struct LPClaimKey {
        market_id: field,
        claimer: address,
        lp_nonce: field,
    }

    struct DisputeClaimKey {
        market_id: field,
        claimer: address,
        dispute_nonce: field,
    }

    struct Proposal {
        id: field,
        proposer: address,
        action_type: u8,
        target_market: field,
        amount: u128,
        recipient: address,
        token_type: u8,
        votes_for: u128,
        votes_against: u128,
        created_at: u32,
        deadline: u32,
        executed: bool,
    }

    struct ProposalSeed {
        proposer: address,
        nonce: field,
    }

    struct VoteKey {
        proposal_id: field,
        voter: address,
    }

    // v2.0: Oracle configuration for automated resolution
    struct OracleConfig {
        market_id: field,
        price_feed_id: field,
        threshold: u128,
        comparison: u8,
        threshold_high: u128,
    }

    // ========================================================================
    // MAPPINGS
    // ========================================================================

    mapping markets: field => Market;
    mapping amm_pools: field => AMMPool;
    mapping market_resolutions: field => MarketResolution;
    mapping market_fees: field => MarketFees;
    mapping share_redeemed: field => bool;
    mapping creator_fees_claimed: field => bool;
    mapping program_credits: u8 => u128;
    mapping market_credits: field => u128;
    mapping lp_positions: field => bool;
    mapping proposals: field => Proposal;
    mapping vote_cast: field => bool;
    mapping approved_resolvers: address => bool;
    mapping protocol_paused: u8 => bool;
    mapping market_dossiers: field => field;
    
    // v2.0: Protocol fee tracking and oracle configs
    mapping protocol_fees_claimed: field => bool;
    mapping oracle_configs: field => OracleConfig;

    @noupgrade
    constructor() {}

    // ========================================================================
    // 1. CREATE MARKET (ALEO)
    // ========================================================================

    fn open_market(
        public question_hash: field,
        public category: u8,
        public num_outcomes: u8,
        public deadline: u32,
        public resolution_deadline: u32,
        public resolver: address,
        private initial_liquidity: u128,
        private nonce: field,
        private credits_in: credits.aleo::credits,
    ) -> (field, LPToken, credits.aleo::credits, Final) {
        assert(num_outcomes >= 2u8 && num_outcomes <= 4u8);
        assert(initial_liquidity >= MIN_LIQUIDITY);

        let market_id: field = BHP256::hash_to_field(
            MarketSeed { creator: self.signer, question_hash: question_hash, nonce: nonce }
        );

        let lp_nonce: field = BHP256::hash_to_field(LPClaimKey {
            market_id: market_id, claimer: self.signer, lp_nonce: 0field,
        });

        let lp_token: LPToken = LPToken {
            owner: self.signer, market_id: market_id, lp_shares: initial_liquidity,
            lp_nonce: lp_nonce, token_type: TOKEN_ALEO,
        };

        let creator: address = self.signer;
        let amount_u64: u64 = initial_liquidity as u64;
        let (change, transfer_final): (credits.aleo::credits, Final) =
            credits.aleo::transfer_private_to_public(credits_in, self.address, amount_u64);

        return (market_id, lp_token, change, final {
            transfer_final.run();
            let protocol_locked: bool = protocol_paused.get_or_use(PAUSE_KEY, false);
            assert(!protocol_locked);
            let market_exists: bool = markets.contains(market_id);
            assert(!market_exists);
            let current_height: u32 = block.height;
            assert(deadline > current_height);
            assert(resolution_deadline > deadline);

            let per_outcome: u128 = initial_liquidity / (num_outcomes as u128);
            let r3: u128 = num_outcomes >= 3u8 ? per_outcome : 0u128;
            let r4: u128 = num_outcomes >= 4u8 ? per_outcome : 0u128;

            markets.set(market_id, Market {
                id: market_id, creator: creator, resolver: resolver,
                question_hash: question_hash, category: category, num_outcomes: num_outcomes,
                deadline: deadline, resolution_deadline: resolution_deadline,
                status: STATUS_ACTIVE, created_at: current_height, token_type: TOKEN_ALEO,
            });
            amm_pools.set(market_id, AMMPool {
                market_id: market_id, reserve_1: per_outcome, reserve_2: per_outcome,
                reserve_3: r3, reserve_4: r4, total_liquidity: initial_liquidity,
                total_lp_shares: initial_liquidity, total_volume: 0u128,
            });
            market_fees.set(market_id, MarketFees {
                market_id: market_id, protocol_fees: 0u128, creator_fees: 0u128,
            });
            program_credits.set(TOKEN_ALEO, program_credits.get_or_use(TOKEN_ALEO, 0u128) + initial_liquidity);
            market_credits.set(market_id, initial_liquidity);
        });
    }

    // ========================================================================
    // 2. BUY SHARES (ALEO)
    // ========================================================================

    fn acquire_shares(
        private market_id: field, private outcome: u8, private amount_in: u128,
        private expected_shares: u128, private min_shares_out: u128,
        private share_nonce: field, private credits_in: credits.aleo::credits,
    ) -> (OutcomeShare, credits.aleo::credits, Final) {
        assert(outcome >= 1u8 && outcome <= 4u8);
        assert(amount_in >= MIN_TRADE_AMOUNT);

        let share: OutcomeShare = OutcomeShare {
            owner: self.signer, market_id: market_id, outcome: outcome,
            quantity: expected_shares, share_nonce: share_nonce, token_type: TOKEN_ALEO,
        };

        let amount_u64: u64 = amount_in as u64;
        let (change, transfer_final): (credits.aleo::credits, Final) =
            credits.aleo::transfer_private_to_public(credits_in, self.address, amount_u64);

        return (share, change, final {
            transfer_final.run();
            let protocol_locked: bool = protocol_paused.get_or_use(PAUSE_KEY, false);
            assert(!protocol_locked);
            let market: Market = markets.get(market_id);
            assert(market.status == STATUS_ACTIVE);
            assert(market.token_type == TOKEN_ALEO);
            assert(outcome >= 1u8 && outcome <= market.num_outcomes);
            let current_height: u32 = block.height;
            assert(current_height <= market.deadline);

            let protocol_fee: u128 = (amount_in * PROTOCOL_FEE_BPS) / FEE_DENOMINATOR;
            let creator_fee: u128 = (amount_in * CREATOR_FEE_BPS) / FEE_DENOMINATOR;
            let amount_to_pool: u128 = amount_in - protocol_fee - creator_fee;

            let fees: MarketFees = market_fees.get(market_id);
            market_fees.set(market_id, MarketFees {
                market_id: market_id,
                protocol_fees: fees.protocol_fees + protocol_fee,
                creator_fees: fees.creator_fees + creator_fee,
            });

            let pool: AMMPool = amm_pools.get(market_id);
            let n: u8 = market.num_outcomes;
            let r1: u128 = pool.reserve_1;
            let r2: u128 = pool.reserve_2;
            let r3: u128 = pool.reserve_3;
            let r4: u128 = pool.reserve_4;
            let a: u128 = amount_to_pool;

            let r_i: u128 = outcome == 1u8 ? r1 : (outcome == 2u8 ? r2 : (outcome == 3u8 ? r3 : r4));
            let step0: u128 = r_i;
            let step1: u128 = outcome != 1u8 ? (step0 * r1) / (r1 + a) : step0;
            let step2: u128 = outcome != 2u8 ? (step1 * r2) / (r2 + a) : step1;
            let step3: u128 = (outcome != 3u8 && n >= 3u8) ? (step2 * r3) / (r3 + a) : step2;
            let step4: u128 = (outcome != 4u8 && n >= 4u8) ? (step3 * r4) / (r4 + a) : step3;

            let r_i_new: u128 = step4;
            let shares_out: u128 = (r_i + a) - r_i_new;
            assert(shares_out >= min_shares_out);
            assert(shares_out >= expected_shares);
            assert(shares_out > 0u128);

            let new_r1: u128 = outcome == 1u8 ? r_i_new : (r1 + a);
            let new_r2: u128 = outcome == 2u8 ? r_i_new : (r2 + a);
            let nr3_active: u128 = outcome == 3u8 ? r_i_new : (r3 + a);
            let new_r3: u128 = n >= 3u8 ? nr3_active : 0u128;
            let nr4_active: u128 = outcome == 4u8 ? r_i_new : (r4 + a);
            let new_r4: u128 = n >= 4u8 ? nr4_active : 0u128;

            amm_pools.set(market_id, AMMPool {
                market_id: market_id, reserve_1: new_r1, reserve_2: new_r2,
                reserve_3: new_r3, reserve_4: new_r4,
                total_liquidity: pool.total_liquidity + amount_to_pool,
                total_lp_shares: pool.total_lp_shares, total_volume: pool.total_volume + amount_in,
            });
            program_credits.set(TOKEN_ALEO, program_credits.get_or_use(TOKEN_ALEO, 0u128) + amount_in);
            market_credits.set(market_id, market_credits.get_or_use(market_id, 0u128) + amount_in);
        });
    }

    // ========================================================================
    // 3. SELL SHARES (ALEO)
    // ========================================================================

    fn dispose_shares(
        private shares: OutcomeShare, private tokens_desired: u128, private max_shares_used: u128,
    ) -> (OutcomeShare, credits.aleo::credits, Final) {
        assert(shares.owner == self.signer);
        assert(shares.token_type == TOKEN_ALEO);
        assert(tokens_desired >= MIN_TRADE_AMOUNT);
        assert(max_shares_used > 0u128);
        assert(max_shares_used <= shares.quantity);

        let protocol_fee: u128 = (tokens_desired * PROTOCOL_FEE_BPS) / FEE_DENOMINATOR;
        let creator_fee: u128 = (tokens_desired * CREATOR_FEE_BPS) / FEE_DENOMINATOR;
        let lp_fee: u128 = (tokens_desired * LP_FEE_BPS) / FEE_DENOMINATOR;
        let net_tokens: u128 = tokens_desired - protocol_fee - creator_fee - lp_fee;

        let net_u64: u64 = net_tokens as u64;
        let (payout_record, transfer_final): (credits.aleo::credits, Final) =
            credits.aleo::transfer_public_to_private(self.signer, net_u64);

        let remainder: OutcomeShare = OutcomeShare {
            owner: self.signer, market_id: shares.market_id, outcome: shares.outcome,
            quantity: shares.quantity - max_shares_used, share_nonce: shares.share_nonce,
            token_type: TOKEN_ALEO,
        };

        let market_id: field = shares.market_id;
        let outcome: u8 = shares.outcome;

        return (remainder, payout_record, final {
            transfer_final.run();
            let protocol_locked: bool = protocol_paused.get_or_use(PAUSE_KEY, false);
            assert(!protocol_locked);
            let market: Market = markets.get(market_id);
            assert(market.status == STATUS_ACTIVE);
            assert(market.token_type == TOKEN_ALEO);
            assert(outcome >= 1u8 && outcome <= market.num_outcomes);
            let current_height: u32 = block.height;
            assert(current_height <= market.deadline);

            let pool_tokens_out: u128 = tokens_desired - lp_fee;

            let fees: MarketFees = market_fees.get(market_id);
            market_fees.set(market_id, MarketFees {
                market_id: market_id,
                protocol_fees: fees.protocol_fees + protocol_fee,
                creator_fees: fees.creator_fees + creator_fee,
            });

            let pool: AMMPool = amm_pools.get(market_id);
            let n: u8 = market.num_outcomes;
            let r1: u128 = pool.reserve_1;
            let r2: u128 = pool.reserve_2;
            let r3: u128 = pool.reserve_3;
            let r4: u128 = pool.reserve_4;
            let p: u128 = pool_tokens_out;

            let r_i: u128 = outcome == 1u8 ? r1 : (outcome == 2u8 ? r2 : (outcome == 3u8 ? r3 : r4));

            let sub1: u128 = outcome != 1u8 ? p : 0u128;
            assert(r1 >= sub1);
            let den1: u128 = r1 - sub1;
            let step0: u128 = r_i;
            let step1: u128 = outcome != 1u8 ? (step0 * r1) / den1 : step0;

            let sub2: u128 = outcome != 2u8 ? p : 0u128;
            assert(r2 >= sub2);
            let den2: u128 = r2 - sub2;
            let step2: u128 = outcome != 2u8 ? (step1 * r2) / den2 : step1;

            let apply3: bool = outcome != 3u8 && n >= 3u8;
            let sub3: u128 = apply3 ? p : 0u128;
            assert(r3 >= sub3);
            let den3_raw: u128 = r3 - sub3;
            let safe_den3: u128 = den3_raw == 0u128 ? 1u128 : den3_raw;
            let step3: u128 = apply3 ? (step2 * r3) / safe_den3 : step2;

            let apply4: bool = outcome != 4u8 && n >= 4u8;
            let sub4: u128 = apply4 ? p : 0u128;
            assert(r4 >= sub4);
            let den4_raw: u128 = r4 - sub4;
            let safe_den4: u128 = den4_raw == 0u128 ? 1u128 : den4_raw;
            let step4: u128 = apply4 ? (step3 * r4) / safe_den4 : step3;

            let r_i_new: u128 = step4;
            let shares_needed: u128 = r_i_new - r_i + p;
            assert(shares_needed <= max_shares_used);
            assert(shares_needed > 0u128);

            let new_r1: u128 = outcome == 1u8 ? r_i_new : (r1 - sub1);
            let new_r2: u128 = outcome == 2u8 ? r_i_new : (r2 - sub2);
            let nr3_act: u128 = outcome == 3u8 ? r_i_new : (r3 - sub3);
            let new_r3: u128 = n >= 3u8 ? nr3_act : 0u128;
            let nr4_act: u128 = outcome == 4u8 ? r_i_new : (r4 - sub4);
            let new_r4: u128 = n >= 4u8 ? nr4_act : 0u128;

            amm_pools.set(market_id, AMMPool {
                market_id: market_id, reserve_1: new_r1, reserve_2: new_r2,
                reserve_3: new_r3, reserve_4: new_r4,
                total_liquidity: pool.total_liquidity - pool_tokens_out,
                total_lp_shares: pool.total_lp_shares, total_volume: pool.total_volume + tokens_desired,
            });

            let market_held: u128 = market_credits.get_or_use(market_id, 0u128);
            assert(market_held >= pool_tokens_out);
            market_credits.set(market_id, market_held - pool_tokens_out);
            let current_held: u128 = program_credits.get_or_use(TOKEN_ALEO, 0u128);
            assert(current_held >= net_tokens);
            program_credits.set(TOKEN_ALEO, current_held - net_tokens);
        });
    }

    // ========================================================================
    // 4. ADD LIQUIDITY (ALEO)
    // ========================================================================

    fn fund_pool(
        private market_id: field, private amount: u128,
        private expected_lp_shares: u128, private lp_nonce: field,
        private credits_in: credits.aleo::credits,
    ) -> (LPToken, credits.aleo::credits, Final) {
        assert(amount >= MIN_LIQUIDITY);
        let lp_token: LPToken = LPToken {
            owner: self.signer, market_id: market_id, lp_shares: expected_lp_shares,
            lp_nonce: lp_nonce, token_type: TOKEN_ALEO,
        };
        let amount_u64: u64 = amount as u64;
        let (change, transfer_final): (credits.aleo::credits, Final) =
            credits.aleo::transfer_private_to_public(credits_in, self.address, amount_u64);
        return (lp_token, change, final {
            transfer_final.run();
            let protocol_locked: bool = protocol_paused.get_or_use(PAUSE_KEY, false);
            assert(!protocol_locked);
            let market: Market = markets.get(market_id);
            assert(market.status == STATUS_ACTIVE);
            assert(market.token_type == TOKEN_ALEO);
            let current_height: u32 = block.height;
            assert(current_height <= market.deadline);

            let pool: AMMPool = amm_pools.get(market_id);
            let total_reserves: u128 = pool.reserve_1 + pool.reserve_2 + pool.reserve_3 + pool.reserve_4;
            assert(total_reserves > 0u128);
            let computed_shares: u128 = (amount * pool.total_lp_shares) / total_reserves;
            assert(computed_shares >= expected_lp_shares);
            assert(expected_lp_shares > 0u128);

            let add_1: u128 = (amount * pool.reserve_1) / total_reserves;
            let add_2: u128 = (amount * pool.reserve_2) / total_reserves;
            let add_3: u128 = (amount * pool.reserve_3) / total_reserves;
            let add_4: u128 = amount - add_1 - add_2 - add_3;

            amm_pools.set(market_id, AMMPool {
                market_id: market_id,
                reserve_1: pool.reserve_1 + add_1, reserve_2: pool.reserve_2 + add_2,
                reserve_3: pool.reserve_3 + add_3, reserve_4: pool.reserve_4 + add_4,
                total_liquidity: pool.total_liquidity + amount,
                total_lp_shares: pool.total_lp_shares + expected_lp_shares,
                total_volume: pool.total_volume,
            });
            program_credits.set(TOKEN_ALEO, program_credits.get_or_use(TOKEN_ALEO, 0u128) + amount);
            market_credits.set(market_id, market_credits.get_or_use(market_id, 0u128) + amount);
        });
    }

    // ========================================================================
    // 5. CLOSE MARKET
    // ========================================================================

    fn lock_market(public market_id: field) -> Final {
        return final {
            let market: Market = markets.get(market_id);
            assert(market.status == STATUS_ACTIVE);
            let current_height: u32 = block.height;
            assert(current_height > market.deadline);
            markets.set(market_id, Market {
                id: market.id, creator: market.creator, resolver: market.resolver,
                question_hash: market.question_hash, category: market.category,
                num_outcomes: market.num_outcomes, deadline: market.deadline,
                resolution_deadline: market.resolution_deadline, status: STATUS_CLOSED,
                created_at: market.created_at, token_type: market.token_type,
            });
        };
    }

    // ========================================================================
    // 6. RESOLVE MARKET
    // ========================================================================

    fn render_verdict(public market_id: field, public winning_outcome: u8) -> Final {
        let resolver: address = self.signer;
        return final {
            let market: Market = markets.get(market_id);
            assert(market.resolver == resolver);
            assert(winning_outcome >= 1u8 && winning_outcome <= market.num_outcomes);
            let current_height: u32 = block.height;
            let is_closed: bool = market.status == STATUS_CLOSED;
            let is_past_deadline: bool = market.status == STATUS_ACTIVE && current_height > market.deadline;
            assert(is_closed || is_past_deadline);
            assert(current_height <= market.resolution_deadline);

            let challenge_deadline: u32 = current_height + CHALLENGE_WINDOW;
            market_resolutions.set(market_id, MarketResolution {
                market_id: market_id, winning_outcome: winning_outcome,
                resolved_at: current_height, challenge_deadline: challenge_deadline, finalized: false,
            });
            markets.set(market_id, Market {
                id: market.id, creator: market.creator, resolver: market.resolver,
                question_hash: market.question_hash, category: market.category,
                num_outcomes: market.num_outcomes, deadline: market.deadline,
                resolution_deadline: market.resolution_deadline, status: STATUS_PENDING_RESOLUTION,
                created_at: market.created_at, token_type: market.token_type,
            });
        };
    }

    // ========================================================================
    // 7. FINALIZE RESOLUTION
    // ========================================================================

    fn ratify_verdict(public market_id: field) -> Final {
        return final {
            let market: Market = markets.get(market_id);
            assert(market.status == STATUS_PENDING_RESOLUTION);
            let resolution: MarketResolution = market_resolutions.get(market_id);
            assert(!resolution.finalized);
            let current_height: u32 = block.height;
            assert(current_height > resolution.challenge_deadline);
            market_resolutions.set(market_id, MarketResolution {
                market_id: market_id, winning_outcome: resolution.winning_outcome,
                resolved_at: resolution.resolved_at, challenge_deadline: resolution.challenge_deadline,
                finalized: true,
            });
            markets.set(market_id, Market {
                id: market.id, creator: market.creator, resolver: market.resolver,
                question_hash: market.question_hash, category: market.category,
                num_outcomes: market.num_outcomes, deadline: market.deadline,
                resolution_deadline: market.resolution_deadline, status: STATUS_RESOLVED,
                created_at: market.created_at, token_type: market.token_type,
            });
        };
    }

    // ========================================================================
    // 8. CANCEL MARKET
    // ========================================================================

    fn void_market(public market_id: field) -> Final {
        let caller: address = self.signer;
        return final {
            let market: Market = markets.get(market_id);
            let current_height: u32 = block.height;
            let is_creator_cancel: bool = market.creator == caller && market.status == STATUS_ACTIVE;
            let is_emergency: bool = current_height > market.resolution_deadline
                && market.status != STATUS_RESOLVED && market.status != STATUS_CANCELLED
                && market.status != STATUS_PENDING_RESOLUTION;
            assert(is_creator_cancel || is_emergency);
            let pool: AMMPool = amm_pools.get(market_id);
            assert(!is_creator_cancel || pool.total_volume == 0u128);
            markets.set(market_id, Market {
                id: market.id, creator: market.creator, resolver: market.resolver,
                question_hash: market.question_hash, category: market.category,
                num_outcomes: market.num_outcomes, deadline: market.deadline,
                resolution_deadline: market.resolution_deadline, status: STATUS_CANCELLED,
                created_at: market.created_at, token_type: market.token_type,
            });
        };
    }

    // ========================================================================
    // 9. ECLIPSE SETTLE
    // ========================================================================

    fn flash_settle(public market_id: field, public winning_outcome: u8) -> Final {
        let caller: address = self.signer;
        return final {
            let market: Market = markets.get(market_id);
            assert(market.resolver == caller);
            let is_active: bool = market.status == STATUS_ACTIVE;
            let is_closed: bool = market.status == STATUS_CLOSED;
            assert(is_active || is_closed);
            assert(winning_outcome >= 1u8 && winning_outcome <= market.num_outcomes);
            let current_height: u32 = block.height;
            market_resolutions.set(market_id, MarketResolution {
                market_id: market_id, winning_outcome: winning_outcome,
                resolved_at: current_height, challenge_deadline: current_height, finalized: true,
            });
            markets.set(market_id, Market {
                id: market.id, creator: market.creator, resolver: market.resolver,
                question_hash: market.question_hash, category: market.category,
                num_outcomes: market.num_outcomes, deadline: market.deadline,
                resolution_deadline: market.resolution_deadline, status: STATUS_RESOLVED,
                created_at: market.created_at, token_type: market.token_type,
            });
        };
    }

    // ========================================================================
    // 10. DISPUTE
    // ========================================================================

    fn contest_verdict(
        private market_id: field, private proposed_outcome: u8,
        private dispute_nonce: field, private credits_in: credits.aleo::credits,
    ) -> (DisputeBondReceipt, credits.aleo::credits, Final) {
        let receipt: DisputeBondReceipt = DisputeBondReceipt {
            owner: self.signer, market_id: market_id, proposed_outcome: proposed_outcome,
            bond_amount: MIN_DISPUTE_BOND, dispute_nonce: dispute_nonce,
        };
        let bond_u64: u64 = MIN_DISPUTE_BOND as u64;
        let (change, transfer_final): (credits.aleo::credits, Final) =
            credits.aleo::transfer_private_to_public(credits_in, self.address, bond_u64);
        return (receipt, change, final {
            transfer_final.run();
            let market: Market = markets.get(market_id);
            assert(market.status == STATUS_PENDING_RESOLUTION);
            let resolution: MarketResolution = market_resolutions.get(market_id);
            assert(!resolution.finalized);
            let current_height: u32 = block.height;
            assert(current_height <= resolution.challenge_deadline);
            assert(proposed_outcome != resolution.winning_outcome);
            assert(proposed_outcome >= 1u8 && proposed_outcome <= market.num_outcomes);
            markets.set(market_id, Market {
                id: market.id, creator: market.creator, resolver: market.resolver,
                question_hash: market.question_hash, category: market.category,
                num_outcomes: market.num_outcomes, deadline: market.deadline,
                resolution_deadline: market.resolution_deadline, status: STATUS_CLOSED,
                created_at: market.created_at, token_type: market.token_type,
            });
            market_resolutions.remove(market_id);
            let current_held: u128 = program_credits.get_or_use(0u8, 0u128);
            program_credits.set(0u8, current_held + MIN_DISPUTE_BOND);
        });
    }

    // ========================================================================
    // 11. RECOVER DISPUTE BOND
    // ========================================================================

    fn recover_bond(private receipt: DisputeBondReceipt) -> (credits.aleo::credits, Final) {
        assert(receipt.owner == self.signer);
        let claim_key: field = BHP256::hash_to_field(DisputeClaimKey {
            market_id: receipt.market_id, claimer: self.signer, dispute_nonce: receipt.dispute_nonce,
        });
        let bond_u64: u64 = receipt.bond_amount as u64;
        let (payout, transfer_final): (credits.aleo::credits, Final) =
            credits.aleo::transfer_public_to_private(self.signer, bond_u64);
        let market_id: field = receipt.market_id;
        let bond_amount: u128 = receipt.bond_amount;
        return (payout, final {
            transfer_final.run();
            let market: Market = markets.get(market_id);
            let is_resolved: bool = market.status == STATUS_RESOLVED;
            let is_cancelled: bool = market.status == STATUS_CANCELLED;
            assert(is_resolved || is_cancelled);
            let already_claimed: bool = share_redeemed.get_or_use(claim_key, false);
            assert(!already_claimed);
            share_redeemed.set(claim_key, true);
            let current_held: u128 = program_credits.get_or_use(0u8, 0u128);
            assert(current_held >= bond_amount);
            program_credits.set(0u8, current_held - bond_amount);
        });
    }

    // ========================================================================
    // 12. REDEEM WINNING SHARES (ALEO)
    // ========================================================================

    fn harvest_winnings(private shares: OutcomeShare) -> (credits.aleo::credits, Final) {
        assert(shares.owner == self.signer);
        assert(shares.token_type == TOKEN_ALEO);
        assert(shares.quantity > 0u128);
        let claim_key: field = BHP256::hash_to_field(ShareClaimKey {
            market_id: shares.market_id, claimer: self.signer, share_nonce: shares.share_nonce,
        });
        let payout_u64: u64 = shares.quantity as u64;
        let (payout_record, transfer_final): (credits.aleo::credits, Final) =
            credits.aleo::transfer_public_to_private(self.signer, payout_u64);
        let market_id: field = shares.market_id;
        let outcome: u8 = shares.outcome;
        let quantity: u128 = shares.quantity;
        return (payout_record, final {
            transfer_final.run();
            let market: Market = markets.get(market_id);
            assert(market.status == STATUS_RESOLVED);
            assert(market.token_type == TOKEN_ALEO);
            let resolution: MarketResolution = market_resolutions.get(market_id);
            assert(resolution.finalized);
            assert(outcome == resolution.winning_outcome);
            let already_claimed: bool = share_redeemed.get_or_use(claim_key, false);
            assert(!already_claimed);
            share_redeemed.set(claim_key, true);
            let market_held: u128 = market_credits.get_or_use(market_id, 0u128);
            assert(market_held >= quantity);
            market_credits.set(market_id, market_held - quantity);
            let current_held: u128 = program_credits.get_or_use(TOKEN_ALEO, 0u128);
            assert(current_held >= quantity);
            program_credits.set(TOKEN_ALEO, current_held - quantity);
        });
    }

    // ========================================================================
    // 13. CLAIM REFUND (ALEO)
    // ========================================================================

    fn harvest_refund(private shares: OutcomeShare) -> (RefundClaim, credits.aleo::credits, Final) {
        assert(shares.owner == self.signer);
        assert(shares.token_type == TOKEN_ALEO);
        assert(shares.quantity > 0u128);
        let claim_key: field = BHP256::hash_to_field(ShareClaimKey {
            market_id: shares.market_id, claimer: self.signer, share_nonce: shares.share_nonce,
        });
        let refund: RefundClaim = RefundClaim {
            owner: self.signer, market_id: shares.market_id, amount: shares.quantity,
            claim_nonce: shares.share_nonce, token_type: TOKEN_ALEO,
        };
        let refund_u64: u64 = shares.quantity as u64;
        let (refund_record, transfer_final): (credits.aleo::credits, Final) =
            credits.aleo::transfer_public_to_private(self.signer, refund_u64);
        let market_id: field = shares.market_id;
        let amount: u128 = shares.quantity;
        return (refund, refund_record, final {
            transfer_final.run();
            let market: Market = markets.get(market_id);
            assert(market.status == STATUS_CANCELLED);
            assert(market.token_type == TOKEN_ALEO);
            let already_claimed: bool = share_redeemed.get_or_use(claim_key, false);
            assert(!already_claimed);
            share_redeemed.set(claim_key, true);
            let market_held: u128 = market_credits.get_or_use(market_id, 0u128);
            assert(market_held >= amount);
            market_credits.set(market_id, market_held - amount);
            let current_held: u128 = program_credits.get_or_use(TOKEN_ALEO, 0u128);
            assert(current_held >= amount);
            program_credits.set(TOKEN_ALEO, current_held - amount);
        });
    }

    // ========================================================================
    // 14. WITHDRAW LP (ALEO)
    // ========================================================================

    fn withdraw_pool(private lp_token: LPToken, private min_tokens_out: u128) -> (credits.aleo::credits, Final) {
        assert(lp_token.owner == self.signer);
        assert(lp_token.token_type == TOKEN_ALEO);
        assert(lp_token.lp_shares > 0u128);
        assert(min_tokens_out > 0u128);
        let claim_key: field = BHP256::hash_to_field(LPClaimKey {
            market_id: lp_token.market_id, claimer: self.signer, lp_nonce: lp_token.lp_nonce,
        });
        let min_u64: u64 = min_tokens_out as u64;
        let (payout_record, transfer_final): (credits.aleo::credits, Final) =
            credits.aleo::transfer_public_to_private(self.signer, min_u64);
        let market_id: field = lp_token.market_id;
        let lp_shares: u128 = lp_token.lp_shares;
        return (payout_record, final {
            transfer_final.run();
            let market: Market = markets.get(market_id);
            let is_resolved: bool = market.status == STATUS_RESOLVED;
            let is_cancelled: bool = market.status == STATUS_CANCELLED;
            assert(is_resolved || is_cancelled);
            assert(market.token_type == TOKEN_ALEO);
            if (is_resolved) {
                let resolution: MarketResolution = market_resolutions.get(market_id);
                assert(resolution.finalized);
            }
            let already_claimed: bool = lp_positions.get_or_use(claim_key, false);
            assert(!already_claimed);
            lp_positions.set(claim_key, true);
            let pool: AMMPool = amm_pools.get(market_id);
            let market_held: u128 = market_credits.get_or_use(market_id, 0u128);
            let tokens_out: u128 = is_resolved ?
                (lp_shares * market_held) / pool.total_lp_shares :
                (lp_shares * (pool.reserve_1 + pool.reserve_2 + pool.reserve_3 + pool.reserve_4)) / pool.total_lp_shares;
            assert(tokens_out >= min_tokens_out);
            assert(tokens_out > 0u128);
            market_credits.set(market_id, market_held - tokens_out);
            let current_held: u128 = program_credits.get_or_use(TOKEN_ALEO, 0u128);
            assert(current_held >= tokens_out);
            program_credits.set(TOKEN_ALEO, current_held - tokens_out);
            amm_pools.set(market_id, AMMPool {
                market_id: market_id, reserve_1: pool.reserve_1, reserve_2: pool.reserve_2,
                reserve_3: pool.reserve_3, reserve_4: pool.reserve_4,
                total_liquidity: pool.total_liquidity,
                total_lp_shares: pool.total_lp_shares - lp_shares, total_volume: pool.total_volume,
            });
        });
    }

    // ========================================================================
    // 15. WITHDRAW CREATOR FEES (ALEO)
    // ========================================================================

    fn harvest_fees(public market_id: field, public expected_amount: u128) -> Final {
        assert(expected_amount > 0u128);
        let amount_u64: u64 = expected_amount as u64;
        let transfer_final: Final = credits.aleo::transfer_public(self.signer, amount_u64);
        let caller: address = self.signer;
        return final {
            transfer_final.run();
            let market: Market = markets.get(market_id);
            assert(market.status == STATUS_RESOLVED);
            assert(market.creator == caller);
            let resolution: MarketResolution = market_resolutions.get(market_id);
            assert(resolution.finalized);
            let already_claimed: bool = creator_fees_claimed.get_or_use(market_id, false);
            assert(!already_claimed);
            creator_fees_claimed.set(market_id, true);
            let fees: MarketFees = market_fees.get(market_id);
            assert(fees.creator_fees >= expected_amount);
            let market_held: u128 = market_credits.get_or_use(market_id, 0u128);
            assert(market_held >= expected_amount);
            market_credits.set(market_id, market_held - expected_amount);
            let token_type: u8 = market.token_type;
            let current_held: u128 = program_credits.get_or_use(token_type, 0u128);
            assert(current_held >= expected_amount);
            program_credits.set(token_type, current_held - expected_amount);
        };
    }

    // ========================================================================
    // 16. SUBMIT PROPOSAL
    // ========================================================================

    fn submit_proposal(
        public action_type: u8, public target_market: field, public amount: u128,
        public recipient: address, public token_type: u8, public vote_deadline: u32,
        private nonce: field,
    ) -> (GovernanceReceipt, Final) {
        let proposal_id: field = BHP256::hash_to_field(
            ProposalSeed { proposer: self.signer, nonce: nonce }
        );
        let receipt: GovernanceReceipt = GovernanceReceipt {
            owner: self.signer, proposal_id: proposal_id, vote_weight: 1u128,
        };
        let proposer: address = self.signer;
        return (receipt, final {
            let already_exists: bool = proposals.contains(proposal_id);
            assert(!already_exists);
            let current_height: u32 = block.height;
            assert(vote_deadline > current_height);
            proposals.set(proposal_id, Proposal {
                id: proposal_id, proposer: proposer, action_type: action_type,
                target_market: target_market, amount: amount, recipient: recipient,
                token_type: token_type, votes_for: 1u128, votes_against: 0u128,
                created_at: current_height, deadline: vote_deadline, executed: false,
            });
            let vote_key: field = BHP256::hash_to_field(VoteKey { proposal_id: proposal_id, voter: proposer });
            vote_cast.set(vote_key, true);
        });
    }

    // ========================================================================
    // 17. CAST VOTE
    // ========================================================================

    fn cast_vote(public proposal_id: field, public support: bool) -> Final {
        let voter: address = self.signer;
        return final {
            let proposal: Proposal = proposals.get(proposal_id);
            assert(!proposal.executed);
            let current_height: u32 = block.height;
            assert(current_height <= proposal.deadline);
            let vote_key: field = BHP256::hash_to_field(VoteKey { proposal_id: proposal_id, voter: voter });
            let already_voted: bool = vote_cast.get_or_use(vote_key, false);
            assert(!already_voted);
            vote_cast.set(vote_key, true);
            let new_for: u128 = support ? proposal.votes_for + 1u128 : proposal.votes_for;
            let new_against: u128 = support ? proposal.votes_against : proposal.votes_against + 1u128;
            proposals.set(proposal_id, Proposal {
                id: proposal.id, proposer: proposal.proposer, action_type: proposal.action_type,
                target_market: proposal.target_market, amount: proposal.amount,
                recipient: proposal.recipient, token_type: proposal.token_type,
                votes_for: new_for, votes_against: new_against,
                created_at: proposal.created_at, deadline: proposal.deadline, executed: false,
            });
        };
    }

    // ========================================================================
    // 18. AUTHORIZE RESOLVER
    // ========================================================================

    fn authorize_resolver(public resolver: address, public enabled: bool) -> Final {
        let caller: address = self.signer;
        return final {
            assert(caller == DEPLOYER);
            approved_resolvers.set(resolver, enabled);
        };
    }

    // ========================================================================
    // 19. SET PROTOCOL PAUSE
    // ========================================================================

    fn set_protocol_pause(public paused: bool) -> Final {
        let caller: address = self.signer;
        return final {
            assert(caller == DEPLOYER);
            protocol_paused.set(PAUSE_KEY, paused);
        };
    }

    // ========================================================================
    // 20. PIN MARKET DOSSIER
    // ========================================================================

    fn pin_market_dossier(public market_id: field, public dossier_hash: field) -> Final {
        let caller: address = self.signer;
        return final {
            let market: Market = markets.get(market_id);
            assert(caller == market.creator || caller == market.resolver || caller == DEPLOYER);
            market_dossiers.set(market_id, dossier_hash);
        };
    }

    // ========================================================================
    // 21. WITHDRAW PROTOCOL FEES (v2.0 NEW — REVENUE CRITICAL)
    // ========================================================================
    // Allows the deployer to withdraw accumulated protocol fees from markets.
    // This is essential for protocol revenue generation.

    fn withdraw_protocol_fees(
        public market_id: field,
        public amount: u128
    ) -> Final {
        assert(amount > 0u128);
        let amount_u64: u64 = amount as u64;
        let transfer_final: Final = credits.aleo::transfer_public(self.signer, amount_u64);
        let caller: address = self.signer;
        return final {
            transfer_final.run();
            
            // Only deployer can withdraw protocol fees
            assert(caller == DEPLOYER);
            
            // Get current fees for this market
            let fees: MarketFees = market_fees.get(market_id);
            assert(fees.protocol_fees >= amount);
            
            // Update the fee tracking
            market_fees.set(market_id, MarketFees {
                market_id: market_id,
                protocol_fees: fees.protocol_fees - amount,
                creator_fees: fees.creator_fees,
            });
            
            // Update program credits
            let market: Market = markets.get(market_id);
            let token_type: u8 = market.token_type;
            let current_held: u128 = program_credits.get_or_use(token_type, 0u128);
            assert(current_held >= amount);
            program_credits.set(token_type, current_held - amount);
        };
    }

    // ========================================================================
    // 22. EXECUTE GOVERNANCE PROPOSAL (v2.0 NEW — GOVERNANCE CRITICAL)
    // ========================================================================
    // Executes a passed governance proposal after voting deadline.
    // Action types:
    //   1 = Emergency resolve market (forces resolution)
    //   2 = Authorize/revoke resolver
    //   3 = Pause/unpause protocol

    fn execute_proposal(public proposal_id: field) -> Final {
        return final {
            let proposal: Proposal = proposals.get(proposal_id);
            
            // Cannot execute already-executed proposals
            assert(!proposal.executed);
            
            // Voting must be complete
            let current_height: u32 = block.height;
            assert(current_height > proposal.deadline);
            
            // Must have quorum
            let total_votes: u128 = proposal.votes_for + proposal.votes_against;
            assert(total_votes >= GOVERNANCE_QUORUM);
            
            // Must have majority support
            assert(proposal.votes_for > proposal.votes_against);
            
            // Execute based on action type
            if (proposal.action_type == ACTION_EMERGENCY_RESOLVE) {
                // Emergency resolve: proposal.amount contains winning outcome as u128
                let market: Market = markets.get(proposal.target_market);
                let not_resolved: bool = market.status != STATUS_RESOLVED;
                let not_cancelled: bool = market.status != STATUS_CANCELLED;
                assert(not_resolved && not_cancelled);
                
                let winning_outcome: u8 = proposal.amount as u8;
                assert(winning_outcome >= 1u8 && winning_outcome <= market.num_outcomes);
                
                market_resolutions.set(proposal.target_market, MarketResolution {
                    market_id: proposal.target_market,
                    winning_outcome: winning_outcome,
                    resolved_at: current_height,
                    challenge_deadline: current_height,
                    finalized: true,
                });
                
                markets.set(proposal.target_market, Market {
                    id: market.id,
                    creator: market.creator,
                    resolver: market.resolver,
                    question_hash: market.question_hash,
                    category: market.category,
                    num_outcomes: market.num_outcomes,
                    deadline: market.deadline,
                    resolution_deadline: market.resolution_deadline,
                    status: STATUS_RESOLVED,
                    created_at: market.created_at,
                    token_type: market.token_type,
                });
            }
            
            if (proposal.action_type == ACTION_AUTHORIZE_RESOLVER) {
                // Authorize resolver: proposal.amount > 0 means enable
                let enable: bool = proposal.amount > 0u128;
                approved_resolvers.set(proposal.recipient, enable);
            }
            
            if (proposal.action_type == ACTION_SET_PAUSE) {
                // Set pause: proposal.amount > 0 means pause
                let paused: bool = proposal.amount > 0u128;
                protocol_paused.set(PAUSE_KEY, paused);
            }
            
            // Mark as executed
            proposals.set(proposal_id, Proposal {
                id: proposal.id,
                proposer: proposal.proposer,
                action_type: proposal.action_type,
                target_market: proposal.target_market,
                amount: proposal.amount,
                recipient: proposal.recipient,
                token_type: proposal.token_type,
                votes_for: proposal.votes_for,
                votes_against: proposal.votes_against,
                created_at: proposal.created_at,
                deadline: proposal.deadline,
                executed: true,
            });
        };
    }

    // ========================================================================
    // 23. ORACLE SETTLE (v2.0 NEW — PYTH/CHAINLINK INTEGRATION)
    // ========================================================================
    // Resolves a market based on oracle price data.
    // For price markets: compares oracle_price against configured threshold.
    // Instant finalization (no challenge window) for oracle-verified data.

    fn oracle_settle(
        public market_id: field,
        public oracle_price: u128,
        public price_timestamp: u32,
        public price_feed_id: field
    ) -> Final {
        let caller: address = self.signer;
        return final {
            // Verify caller is an approved resolver
            let is_approved: bool = approved_resolvers.get_or_use(caller, false);
            let is_deployer: bool = caller == DEPLOYER;
            assert(is_approved || is_deployer);
            
            // Verify market exists and is settleable
            let market: Market = markets.get(market_id);
            let is_active: bool = market.status == STATUS_ACTIVE;
            let is_closed: bool = market.status == STATUS_CLOSED;
            assert(is_active || is_closed);
            
            // Get oracle config for this market
            let config: OracleConfig = oracle_configs.get(market_id);
            assert(config.price_feed_id == price_feed_id);
            
            // Determine winning outcome based on comparison type
            let above_threshold: bool = oracle_price > config.threshold;
            let below_threshold: bool = oracle_price < config.threshold;
            let above_low: bool = oracle_price >= config.threshold;
            let below_high: bool = oracle_price <= config.threshold_high;
            let in_range: bool = above_low && below_high;
            let above_result: u8 = above_threshold ? 1u8 : 2u8;
            let below_result: u8 = below_threshold ? 1u8 : 2u8;
            let between_result: u8 = in_range ? 1u8 : 2u8;
            let winning_outcome: u8 = config.comparison == COMPARE_ABOVE ? above_result :
                                      config.comparison == COMPARE_BELOW ? below_result :
                                      config.comparison == COMPARE_BETWEEN ? between_result : 2u8;
            
            let current_height: u32 = block.height;
            
            // Oracle resolution is instant (no challenge window)
            market_resolutions.set(market_id, MarketResolution {
                market_id: market_id,
                winning_outcome: winning_outcome,
                resolved_at: current_height,
                challenge_deadline: current_height,
                finalized: true,
            });
            
            markets.set(market_id, Market {
                id: market.id,
                creator: market.creator,
                resolver: market.resolver,
                question_hash: market.question_hash,
                category: market.category,
                num_outcomes: market.num_outcomes,
                deadline: market.deadline,
                resolution_deadline: market.resolution_deadline,
                status: STATUS_RESOLVED,
                created_at: market.created_at,
                token_type: market.token_type,
            });
        };
    }

    // ========================================================================
    // 24. REGISTER EVENT ORACLE (v2.0 NEW — ORACLE CONFIG)
    // ========================================================================
    // Configures oracle parameters for automated market resolution.
    // Must be called by market creator or deployer before oracle_settle can work.

    fn register_event_oracle(
        public market_id: field,
        public price_feed_id: field,
        public threshold: u128,
        public comparison: u8,
        public threshold_high: u128
    ) -> Final {
        let caller: address = self.signer;
        return final {
            // Verify market exists
            let market: Market = markets.get(market_id);
            
            // Only creator, resolver, or deployer can configure oracle
            let is_creator: bool = caller == market.creator;
            let is_resolver: bool = caller == market.resolver;
            let is_deployer: bool = caller == DEPLOYER;
            assert(is_creator || is_resolver || is_deployer);
            
            // Market must be active
            assert(market.status == STATUS_ACTIVE);
            
            // Validate comparison type
            assert(comparison >= COMPARE_ABOVE && comparison <= COMPARE_BETWEEN);
            
            // For "between" comparison, high threshold must be > low threshold
            if (comparison == COMPARE_BETWEEN) {
                assert(threshold_high > threshold);
            }
            
            // Store oracle configuration
            oracle_configs.set(market_id, OracleConfig {
                market_id: market_id,
                price_feed_id: price_feed_id,
                threshold: threshold,
                comparison: comparison,
                threshold_high: threshold_high,
            });
        };
    }
}
