import type { Market } from '@/types';
import { API_BASE } from '@/constants';

type RawMarket = Record<string, unknown>;

function mapMarket(m: RawMarket): Market {
  return {
    id: m.id as string,
    question: m.question as string,
    category: m.category as string,
    outcomes: m.outcomes as string[],
    reserves: m.reserves as number[],
    totalLiquidity: m.totalLiquidity as number,
    totalVolume: m.totalVolume as number,
    tradeCount: m.tradeCount as number,
    status: m.status as Market['status'],
    endTime: m.endTime as number,
    createdAt: m.createdAt as number,
    isEclipse: m.isEclipse as boolean,
    resolvedOutcome: m.resolvedOutcome as number | undefined,
    tokenType: (m.tokenType as string) || 'ALEO',
    imageUrl: (m.imageUrl as string) || undefined,
  };
}

async function requestMarkets(path: string, init?: RequestInit): Promise<RawMarket[]> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) throw new Error('Market relay unavailable');
  const data = await res.json();
  return Array.isArray(data.markets) ? (data.markets as RawMarket[]) : [];
}

/**
 * Fetch real markets from backend (which reads chain state).
 */
export async function fetchRealMarkets(): Promise<Market[]> {
  let markets = await requestMarkets('/markets');

  if (markets.length === 0) {
    try {
      markets = await requestMarkets('/markets/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks: 300 }),
      });
    } catch {
      markets = await requestMarkets('/markets/refresh', { method: 'POST' });
    }
  }

  return markets.map(mapMarket);
}

