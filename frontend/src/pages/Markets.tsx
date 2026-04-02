import { useEffect, useRef } from 'react';
import { useMarketStore } from '@/stores/marketStore';
import { useMarkets } from '@/hooks/useMarkets';
import { MarketCard, MarketFilters } from '@/components/market';
import PageHeader from '@/components/layout/PageHeader';
import Loading from '@/components/shared/Loading';
import EmptyState from '@/components/shared/EmptyState';
import { ChartIcon } from '@/components/icons';

const POLL_INTERVAL = 30_000; // Refresh markets every 30 seconds

export default function Markets() {
  const { loading, fetchMarkets } = useMarketStore();
  const {
    markets,
    selectedCategory,
    sortBy,
    searchQuery,
    selectedToken,
    setCategory,
    setSortBy,
    setSearchQuery,
    setSelectedToken,
  } = useMarkets();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchMarkets();
    intervalRef.current = setInterval(() => fetchMarkets(), POLL_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchMarkets]);

  return (
    <div>
      <PageHeader
        title="Signal Board"
        subtitle="Scan live books, filter by asset, and open private positions without changing the engine underneath."
        action={{ label: 'Open Studio', href: '/create' }}
      />

      <MarketFilters
        selectedCategory={selectedCategory}
        sortBy={sortBy}
        searchQuery={searchQuery}
        selectedToken={selectedToken}
        onCategoryChange={setCategory}
        onSortChange={setSortBy}
        onSearchChange={setSearchQuery}
        onTokenChange={setSelectedToken}
      />

      {loading ? (
        <Loading />
      ) : markets.length === 0 ? (
        <EmptyState
          icon={<ChartIcon className="w-10 h-10 text-gray-600" />}
          title="No live books on the board"
          description="Try widening the filters or launch a new book from the studio."
          actionLabel="Open Studio"
          actionHref="/create"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {markets.map((market, i) => (
            <MarketCard key={market.id} market={market} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
