import credits.aleo;

program private_sports_market.aleo {
    const HOUSE_ADDRESS: address = aleo19za49scmhufst9q8lhwka5hmkvzx5ersrue3gjwcs705542daursptmx0r;

    const HOUSE_FEE_BPS: u64 = 300u64;
    const BPS_DENOM: u64 = 10_000u64;
    const CANCEL_FEE_BPS: u64 = 50u64;
    const MIN_STAKE: u64 = 1_000_000u64;
    const MAX_STAKE: u64 = 10_000_000_000u64;
    const MIN_RESERVE_AMOUNT: u64 = 10_000_000u64;
    const MAX_U64: u128 = 18_446_744_073_709_551_615u128;

    const OUTCOME_A: u8 = 0u8;
    const OUTCOME_B: u8 = 1u8;
    const STATUS_OPEN: u8 = 0u8;
    const STATUS_RESOLVED_A: u8 = 1u8;
    const STATUS_RESOLVED_B: u8 = 2u8;
    const STATUS_CANCELLED: u8 = 3u8;

    record MarketOdds {
        owner: address,
        market_id: field,
        prob_a: u64,
        prob_b: u64,
        house_edge_bps: u64,
        created_at_block: u32,
    }

    record BetTicket {
        owner: address,
        market_id: field,
        outcome: u8,
        stake: u64,
        locked_prob: u64,
        bet_id: field,
    }

    record PayoutClaim {
        owner: address,
        beneficiary: address,
        market_id: field,
        payout_amount: u64,
        original_stake: u64,
    }

    record RefundVoucher {
        owner: address,
        beneficiary: address,
        market_id: field,
        refund_amount: u64,
        original_stake: u64,
    }

    record LiquidityReceipt {
        owner: address,
        market_id: field,
        reserve_amount: u64,
        is_consumed: bool,
    }

    mapping market_status: field => u8;
    mapping pool_a: field => u64;
    mapping pool_b: field => u64;
    mapping reserve: field => u64;
    mapping market_admin: field => address;
    mapping min_side_threshold: field => u64;
    mapping deadline_block: field => u32;
    mapping used_bet_ids: field => bool;

    @noupgrade
    constructor() {}

    fn create_market(
        private prob_a: u64,
        private prob_b: u64,
        private house_edge_bps: u64,
        private market_id: field,
        private min_threshold: u64,
        private created_at_block: u32,
        private deadline: u32,
        private reserve_credit: credits.aleo::credits,
        private reserve_amount: u64,
    ) -> (MarketOdds, LiquidityReceipt, credits.aleo::credits, credits.aleo::credits, Final) {
        assert(prob_a + prob_b == BPS_DENOM);
        assert(house_edge_bps <= 1_000u64);
        assert(reserve_amount >= MIN_RESERVE_AMOUNT);
        assert(reserve_credit.owner == self.signer);
        assert(reserve_credit.microcredits >= reserve_amount);
        assert(deadline > created_at_block);

        let (house_reserve, change): (credits.aleo::credits, credits.aleo::credits) =
            credits.aleo::transfer_private(reserve_credit, HOUSE_ADDRESS, reserve_amount);

        let odds: MarketOdds = MarketOdds {
            owner: self.signer,
            market_id: market_id,
            prob_a: prob_a,
            prob_b: prob_b,
            house_edge_bps: house_edge_bps,
            created_at_block: created_at_block,
        };

        let receipt: LiquidityReceipt = LiquidityReceipt {
            owner: self.signer,
            market_id: market_id,
            reserve_amount: reserve_amount,
            is_consumed: false,
        };

        let admin: address = self.signer;
        return (odds, receipt, house_reserve, change, final {
            let exists: bool = market_status.contains(market_id);
            assert(!exists);
            let live_block: u32 = block.height;
            assert(deadline > live_block);

            market_status.set(market_id, STATUS_OPEN);
            pool_a.set(market_id, 0u64);
            pool_b.set(market_id, 0u64);
            reserve.set(market_id, reserve_amount);
            market_admin.set(market_id, admin);
            min_side_threshold.set(market_id, min_threshold);
            deadline_block.set(market_id, deadline);
        });
    }

    fn place_bet(
        private market_id: field,
        private outcome: u8,
        private locked_prob: u64,
        private bet_id: field,
        private payment: credits.aleo::credits,
        private stake: u64,
    ) -> (BetTicket, credits.aleo::credits, credits.aleo::credits, Final) {
        assert(stake >= MIN_STAKE);
        assert(stake <= MAX_STAKE);
        assert(outcome == OUTCOME_A || outcome == OUTCOME_B);
        assert(locked_prob >= 100u64);
        assert(locked_prob <= 9_900u64);
        assert(payment.owner == self.signer);
        assert(payment.microcredits >= stake);

        let aligned: u64 = (stake / 1_000_000u64) * 1_000_000u64;
        assert(aligned == stake);

        let (house_payment, change): (credits.aleo::credits, credits.aleo::credits) =
            credits.aleo::transfer_private(payment, HOUSE_ADDRESS, stake);

        let ticket: BetTicket = BetTicket {
            owner: self.signer,
            market_id: market_id,
            outcome: outcome,
            stake: stake,
            locked_prob: locked_prob,
            bet_id: bet_id,
        };

        return (ticket, house_payment, change, final {
            let status: u8 = market_status.get(market_id);
            assert(status == STATUS_OPEN);

            let deadline: u32 = deadline_block.get(market_id);
            let live_block: u32 = block.height;
            assert(live_block <= deadline);

            let already_used: bool = used_bet_ids.get_or_use(bet_id, false);
            assert(!already_used);
            used_bet_ids.set(bet_id, true);

            if (outcome == OUTCOME_A) {
                let current_a: u64 = pool_a.get_or_use(market_id, 0u64);
                assert((current_a as u128) + (stake as u128) <= MAX_U64);
                pool_a.set(market_id, current_a + stake);
            } else {
                let current_b: u64 = pool_b.get_or_use(market_id, 0u64);
                assert((current_b as u128) + (stake as u128) <= MAX_U64);
                pool_b.set(market_id, current_b + stake);
            }
        });
    }

    fn resolve_market(public market_id: field, public winning_outcome: u8) -> Final {
        assert(winning_outcome == STATUS_RESOLVED_A || winning_outcome == STATUS_RESOLVED_B);
        let caller: address = self.signer;
        return final {
            let admin: address = market_admin.get(market_id);
            assert(caller == admin);

            let status: u8 = market_status.get(market_id);
            assert(status == STATUS_OPEN);

            market_status.set(market_id, winning_outcome);
        };
    }

    fn claim_payout(
        private ticket: BetTicket,
        public winning_outcome: u8,
        private requested_payout: u64,
    ) -> (PayoutClaim, Final) {
        assert(ticket.owner == self.signer);
        assert(ticket.stake >= MIN_STAKE);
        assert(ticket.stake <= MAX_STAKE);
        assert(winning_outcome == STATUS_RESOLVED_A || winning_outcome == STATUS_RESOLVED_B);

        let expected_outcome: u8 = winning_outcome - 1u8;
        assert(ticket.outcome == expected_outcome);

        let claim: PayoutClaim = PayoutClaim {
            owner: HOUSE_ADDRESS,
            beneficiary: self.signer,
            market_id: ticket.market_id,
            payout_amount: requested_payout,
            original_stake: ticket.stake,
        };

        let market_id: field = ticket.market_id;
        let ticket_outcome: u8 = ticket.outcome;
        let ticket_stake: u64 = ticket.stake;
        return (claim, final {
            let live_status: u8 = market_status.get(market_id);
            assert(live_status == winning_outcome);

            let pa: u64 = pool_a.get_or_use(market_id, 0u64);
            let pb: u64 = pool_b.get_or_use(market_id, 0u64);
            let live_reserve: u64 = reserve.get_or_use(market_id, 0u64);
            let winning_pool: u64 = ticket_outcome == OUTCOME_A ? pa : pb;
            let losing_pool: u64 = ticket_outcome == OUTCOME_A ? pb : pa;
            assert(winning_pool > 0u64);
            assert(ticket_stake <= winning_pool);

            let net_losing_u128: u128 = losing_pool == 0u64
                ? 0u128
                : ((losing_pool as u128) * ((BPS_DENOM - HOUSE_FEE_BPS) as u128)) / (BPS_DENOM as u128);
            let effective_prize_u128: u128 = losing_pool == 0u64
                ? (winning_pool as u128) + (live_reserve as u128)
                : (winning_pool as u128) + net_losing_u128;
            assert(effective_prize_u128 <= MAX_U64);

            let payout_u128: u128 =
                ((ticket_stake as u128) * effective_prize_u128) / (winning_pool as u128);
            assert(payout_u128 <= MAX_U64);
            let payout_amount: u64 = payout_u128 as u64;
            assert(payout_amount >= ticket_stake);
            assert(requested_payout == payout_amount);

            let reserve_consumed: u64 = losing_pool == 0u64
                ? ((((ticket_stake as u128) * (live_reserve as u128)) / (winning_pool as u128)) as u64)
                : 0u64;
            assert(live_reserve >= reserve_consumed);

            if (losing_pool == 0u64) {
                reserve.set(market_id, live_reserve - reserve_consumed);
            }
        });
    }

    fn execute_payout(
        private claim: PayoutClaim,
        private house_funds: credits.aleo::credits,
        private actual_payout: u64,
    ) -> (credits.aleo::credits, credits.aleo::credits) {
        assert(claim.owner == self.signer);
        assert(house_funds.owner == self.signer);
        assert(actual_payout == claim.payout_amount);
        assert(actual_payout >= claim.original_stake);
        assert(house_funds.microcredits >= actual_payout);

        return credits.aleo::transfer_private(house_funds, claim.beneficiary, actual_payout);
    }

    fn cancel_market(public market_id: field) -> Final {
        let caller: address = self.signer;
        return final {
            let admin: address = market_admin.get(market_id);
            assert(caller == admin);

            let status: u8 = market_status.get(market_id);
            assert(status == STATUS_OPEN);

            market_status.set(market_id, STATUS_CANCELLED);
        };
    }

    fn force_cancel(public market_id: field, public current_block: u32) -> Final {
        return final {
            let status: u8 = market_status.get(market_id);
            assert(status == STATUS_OPEN);

            let live_block: u32 = block.height;
            assert(current_block == live_block);

            let deadline: u32 = deadline_block.get(market_id);
            assert(live_block > deadline);

            market_status.set(market_id, STATUS_CANCELLED);
        };
    }

    fn claim_refund(private ticket: BetTicket) -> (RefundVoucher, Final) {
        assert(ticket.owner == self.signer);
        assert(ticket.stake >= MIN_STAKE);

        let fee: u64 = (((ticket.stake as u128) * (CANCEL_FEE_BPS as u128)) / (BPS_DENOM as u128)) as u64;
        let refund_amount: u64 = ticket.stake - fee;
        assert(refund_amount > 0u64);

        let voucher: RefundVoucher = RefundVoucher {
            owner: HOUSE_ADDRESS,
            beneficiary: self.signer,
            market_id: ticket.market_id,
            refund_amount: refund_amount,
            original_stake: ticket.stake,
        };

        let market_id: field = ticket.market_id;
        return (voucher, final {
            let status: u8 = market_status.get(market_id);
            assert(status == STATUS_CANCELLED);
        });
    }

    fn execute_refund(
        private voucher: RefundVoucher,
        private house_funds: credits.aleo::credits,
    ) -> (credits.aleo::credits, credits.aleo::credits) {
        assert(voucher.owner == self.signer);
        assert(house_funds.owner == self.signer);
        assert(house_funds.microcredits >= voucher.refund_amount);

        return credits.aleo::transfer_private(house_funds, voucher.beneficiary, voucher.refund_amount);
    }
}
