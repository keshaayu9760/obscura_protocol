import { useEffect, useState, useCallback } from 'react';
import { useOracleStore } from '@/stores/oracleStore';
import { useMarketStore } from '@/stores/marketStore';
import { useEclipseBetStore } from '@/stores/eclipseBetStore';
import { ActiveRounds, EclipseHistory, OraclePriceFeed } from '@/components/eclipse';
import PageHeader from '@/components/layout/PageHeader';
import { API_BASE } from '@/constants';

interface EclipseRound {
  id: string;
  asset: 'BTC' | 'ETH' | 'ALEO';
  tokenType?: string;
  startTime: number;
  endTime: number;
  startPrice: number;
  endPrice: number | null;
  status: 'open' | 'locked' | 'resolved';
  result: 'up' | 'down' | null;
}

export default function Rounds() {
  const { fetchPrices } = useOracleStore();
  const { fetchMarkets, markets } = useMarketStore();
  const resolveBets = useEclipseBetStore((s) => s.resolveBets);
  const expireStaleBets = useEclipseBetStore((s) => s.expireStaleBets);
  const bets = useEclipseBetStore((s) => s.bets);
  const [allRounds, setAllRounds] = useState<EclipseRound[]>([]);

  const fetchAllRounds = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/eclipse`);
      if (res.ok) {
        const data = await res.json();
        setAllRounds(data.rounds || []);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchPrices();
    fetchAllRounds();
    if (markets.length === 0) fetchMarkets();
    const priceInterval = setInterval(fetchPrices, 30_000);
    const marketInterval = setInterval(fetchMarkets, 30_000);
    const roundInterval = setInterval(fetchAllRounds, 30_000);
    return () => {
      clearInterval(priceInterval);
      clearInterval(marketInterval);
      clearInterval(roundInterval);
    };
  }, [fetchPrices, fetchMarkets, fetchAllRounds, markets.length]);

  // Expire stale PENDING bets on mount only (not on every render)
  useEffect(() => {
    expireStaleBets(30 * 60 * 1000);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-resolve bets when markets resolve
  useEffect(() => {
    const pendingBets = bets.filter((b) => !b.result);
    if (pendingBets.length === 0) return;

    // Resolve bets from on-chain market data (more reliable than oracle rounds)
    for (const bet of pendingBets) {
      const market = markets.find((m) => m.id === bet.roundId || m.id === bet.marketId);
      if (market && market.status === 'resolved' && market.resolvedOutcome !== undefined) {
        const result = market.resolvedOutcome === 0 ? 'up' : 'down';
        const endPrice = bet.startPrice; // Use start price as fallback
        resolveBets(bet.roundId, result as 'up' | 'down', endPrice);
      }
    }

    for (const round of allRounds) {
      if (round.status === 'resolved' && round.result && round.endPrice) {
        const hasPending = pendingBets.some((b) => b.roundId === round.id);
        if (hasPending) {
          resolveBets(round.id, round.result, round.endPrice);
        }
      }
    }
  }, [allRounds, bets, markets, resolveBets]);

  return (
    <div>
      <PageHeader
        title="Pulse Sessions"
        subtitle="Short-cycle directional books sourced from the live oracle feed."
        action={{ label: 'Open Studio', href: '/create' }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        <div className="lg:col-span-3 space-y-6">
          <ActiveRounds markets={[]} />
          <EclipseHistory markets={[]} />
        </div>
        <div>
          <OraclePriceFeed />
        </div>
      </div>
    </div>
  );
}

