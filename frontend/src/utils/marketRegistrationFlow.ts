import { ALEO_TESTNET_API, API_BASE, ALL_PROGRAM_IDS } from '@/constants';
import { extractFinalizeArgs, resolveShieldTxId } from '@/utils/marketRegistration';

const DISCOVERY_BLOCKS = 300;
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

interface BackendMarket {
  id: string;
  question: string;
  outcomes: string[];
  tokenType?: string;
}

function normalizeToken(tokenType?: string): string {
  return (tokenType || 'ALEO').trim().toUpperCase();
}

function sameOutcomes(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function matchesMarket(
  market: BackendMarket,
  questionText: string,
  outcomeLabels: string[],
  tokenType?: string,
  marketId?: string | null,
): boolean {
  if (marketId && market.id === marketId) return true;
  return market.question.trim() === questionText.trim()
    && sameOutcomes(market.outcomes || [], outcomeLabels)
    && normalizeToken(market.tokenType) === normalizeToken(tokenType);
}

async function requestBackendMarkets(path: string, init?: RequestInit): Promise<BackendMarket[]> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) throw new Error(`Backend market request failed: ${path}`);
  const data = await res.json();
  return Array.isArray(data.markets) ? (data.markets as BackendMarket[]) : [];
}

async function waitForVisibleMarket(
  questionText: string,
  outcomeLabels: string[],
  tokenType?: string,
  marketId?: string | null,
  maxAttempts: number = 12,
  delayMs: number = 10_000,
): Promise<string | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const markets = attempt === 0
        ? await requestBackendMarkets('/markets')
        : attempt % 3 === 0
          ? await requestBackendMarkets('/markets/discover', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ blocks: DISCOVERY_BLOCKS }),
          })
          : await requestBackendMarkets('/markets/refresh', { method: 'POST' });

      const match = markets.find((market) =>
        matchesMarket(market, questionText, outcomeLabels, tokenType, marketId)
      );

      if (match) return match.id;
    } catch {
      // Keep retrying until the backend scanner/indexer catches up.
    }

    if (attempt < maxAttempts - 1) {
      await sleep(delayMs);
    }
  }

  return null;
}

export interface MarketRegistrationParams {
  txId: string;
  questionText: string;
  questionHash: string;
  outcomeLabels: string[];
  isEclipse: boolean;
  tokenType?: string;
  imageUrl?: string;
  onRegistered?: () => void | Promise<void>;
}

/**
 * Reliable market registration for create flows.
 * Saves pending metadata, tries direct registration from the tx receipt,
 * then falls back to on-demand backend discovery until the market is visible.
 */
export async function registerMarketFromTx(params: MarketRegistrationParams): Promise<void> {
  const { txId, questionText, questionHash, outcomeLabels, isEclipse, tokenType, imageUrl, onRegistered } = params;

  try {
    await fetch(`${API_BASE}/markets/pending`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionHash, question: questionText, outcomes: outcomeLabels, isEclipse }),
    });
    console.log(`[MarketReg] Saved pending metadata for hash ${questionHash.slice(0, 20)}...`);
  } catch {
    // Non-critical: direct registration may still succeed.
  }

  let realTxId = txId;
  if (!txId.startsWith('at1')) {
    console.log(`[MarketReg] Resolving Shield wallet ID: ${txId.slice(0, 30)}...`);
    const resolved = await resolveShieldTxId(txId);
    if (!resolved) {
      console.warn('[MarketReg] Could not resolve Shield tx ID, falling back to backend discovery.');
      const discoveredId = await waitForVisibleMarket(questionText, outcomeLabels, tokenType);
      if (discoveredId) {
        console.log(`[MarketReg] Backend discovered market ${discoveredId.slice(0, 20)}...`);
        await onRegistered?.();
      }
      return;
    }
    realTxId = resolved;
  }

  const maxRetries = 12;
  for (let i = 0; i < maxRetries; i++) {
    try {
      await sleep(10_000);
      const res = await fetch(`${ALEO_TESTNET_API}/transaction/${realTxId}`);
      if (!res.ok) continue;

      const txData = await res.json();
      const transitions = (txData?.execution?.transitions || []) as Array<{
        program?: string;
        function?: string;
        outputs?: Array<{ type?: string; value?: string }>;
      }>;

      const transition = transitions.find((t) =>
        typeof t.program === 'string'
        && ALL_PROGRAM_IDS.includes(t.program as typeof ALL_PROGRAM_IDS[number])
        && t.function === 'open_market'
      ) || transitions.find((t) => t.function === 'open_market');

      if (!transition) continue;
      const programId = typeof transition.program === 'string' ? transition.program : undefined;

      let marketId: string | null = null;
      for (const output of (transition.outputs || [])) {
        if (output.type === 'future') {
          const args = extractFinalizeArgs(output.value || '');
          if (args.length > 0 && args[0].endsWith('field')) {
            marketId = args[0];
            break;
          }
        }
      }

      if (!marketId && transition.outputs?.[0]?.value) {
        const val = transition.outputs[0].value as string;
        const match = val.match(/(\d+field)/);
        if (match) marketId = match[1];
      }

      if (!marketId) continue;

      console.log(`[MarketReg] Extracted market_id: ${marketId}`);

      await fetch(`${API_BASE}/markets/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId,
          question: questionText,
          outcomes: outcomeLabels,
          isEclipse,
          tokenType: tokenType || undefined,
          programId,
          imageUrl: imageUrl || undefined,
        }),
      });

      console.log(`[MarketReg] Registered market ${marketId.slice(0, 20)}... with backend`);

      const visibleId = await waitForVisibleMarket(questionText, outcomeLabels, tokenType, marketId, 10, 5_000);
      if (visibleId) {
        await onRegistered?.();
      }
      return;
    } catch (err) {
      console.warn(`[MarketReg] Retry ${i + 1}/${maxRetries} failed:`, err);
    }
  }

  console.warn('[MarketReg] Direct registration timed out, forcing backend discovery.');
  const discoveredId = await waitForVisibleMarket(questionText, outcomeLabels, tokenType);
  if (discoveredId) {
    console.log(`[MarketReg] Backend discovered market ${discoveredId.slice(0, 20)}... after timeout`);
    await onRegistered?.();
  }
}
