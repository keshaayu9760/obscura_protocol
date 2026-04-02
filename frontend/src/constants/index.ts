// ============================================================================
// Obscura Protocol — Application constants
// ============================================================================

export const PROGRAM_ID = 'obscura_v2.0.aleo';
export const PROGRAM_ID_CX = 'obscura_v2.0_cx.aleo';
export const PROGRAM_ID_SD = 'obscura_v2.0_sd.aleo';

export const ALEO_TESTNET_API = 'https://api.explorer.provable.com/v1/testnet';

export const DEPLOYER = 'aleo19za49scmhufst9q8lhwka5hmkvzx5ersrue3gjwcs705542daursptmx0r';

export type TokenType = 'ALEO' | 'USDCX' | 'USAD';

export function getProgramIdForToken(tokenType: TokenType = 'ALEO'): string {
  switch (tokenType) {
    case 'USDCX': return PROGRAM_ID_CX;
    case 'USAD': return PROGRAM_ID_SD;
    default: return PROGRAM_ID;
  }
}

export const ALL_PROGRAM_IDS = [PROGRAM_ID, PROGRAM_ID_CX, PROGRAM_ID_SD] as const;

export const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

export const PRECISION = 1_000_000;

export const FEES = {
  PROTOCOL: 0.005,   // 0.5%
  CREATOR: 0.005,    // 0.5%
  LP: 0.01,          // 1.0%
  TOTAL: 0.02,       // 2.0%
} as const;

export const MIN_LIQUIDITY = 1_000_000; // 1 ALEO in microcredits
export const MIN_TRADE = 10_000;        // 0.01 ALEO

export const STATUS_MAP: Record<number, string> = {
  1: 'active',
  2: 'closed',
  3: 'resolved',
  4: 'cancelled',
  5: 'pending_resolution',
};

export const CATEGORY_MAP: Record<number, string> = {
  1: 'Crypto',
  2: 'Crypto',
  3: 'Sports',
  4: 'Politics',
  5: 'Science',
  6: 'Entertainment',
  7: 'Other',
};

export const TOKEN_TYPES: Record<number, string> = {
  0: 'ALEO',
  1: 'USDCX',
  2: 'USAD',
};

export const ECLIPSE_SESSION_OPTIONS = [
  { label: '24 Hours', seconds: 86400, blocks: 5760 },
  { label: '2 Days', seconds: 172800, blocks: 11520 },
  { label: '7 Days', seconds: 604800, blocks: 40320 },
  { label: '30 Days', seconds: 2592000, blocks: 172800 },
] as const;

export const CATEGORIES: string[] = [
  'All',
  'Crypto',
  'Sports',
  'Politics',
  'Science',
  'Entertainment',
  'Other',
];

export const CHART_COLORS = {
  teal: '#34C9E1',
  green: '#7DDF96',
  red: '#F66E7A',
  gray: '#90A0B2',
  darkBg: '#05080D',
  cardBg: '#111823',
  borderColor: '#223042',
} as const;

export const TRANSITIONS = {
  CREATE_MARKET: 'open_market',
  BUY_SHARES: 'acquire_shares',
  SELL_SHARES: 'dispose_shares',
  ADD_LIQUIDITY: 'fund_pool',
  CLOSE_MARKET: 'lock_market',
  RESOLVE_MARKET: 'render_verdict',
  FINALIZE_RESOLUTION: 'ratify_verdict',
  CANCEL_MARKET: 'void_market',
  DISPUTE: 'contest_verdict',
  CLAIM_DISPUTE_BOND: 'recover_bond',
  REDEEM: 'harvest_winnings',
  CLAIM_REFUND: 'harvest_refund',
  WITHDRAW_LP: 'withdraw_pool',
  WITHDRAW_CREATOR_FEES: 'harvest_fees',
  SETTLE_ROUND: 'flash_settle',
  SUBMIT_PROPOSAL: 'submit_proposal',
  CAST_VOTE: 'cast_vote',
  // v2.0 new transitions
  WITHDRAW_PROTOCOL_FEES: 'withdraw_protocol_fees',
  EXECUTE_PROPOSAL: 'execute_proposal',
  ORACLE_SETTLE: 'oracle_settle',
  REGISTER_EVENT_ORACLE: 'register_event_oracle',
} as const;
