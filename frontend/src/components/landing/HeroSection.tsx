import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BoltIcon, ShieldIcon } from '@/components/icons';
import LogoIcon from '@/components/icons/LogoIcon';
import CryptoIcon from '@/components/shared/CryptoIcon';
import { useMarketStore } from '@/stores/marketStore';
import { useOracleStore } from '@/stores/oracleStore';
import { useTradeStore } from '@/stores/tradeStore';
import { PRECISION } from '@/constants';
import { calculatePrices } from '@/utils/fpmm';
import { formatAleo } from '@/utils/format';

export default function HeroSection() {
  const marketList = useMarketStore((store) => store.markets);
  const tradeLedger = useTradeStore((store) => store.trades);
  const oracleBoard = useOracleStore((store) => store.prices);

  const activeMarketCount = marketList.filter((entry) => entry.status === 'active').length;
  const grossVolume = marketList.reduce((sum, entry) => sum + (entry.totalVolume || 0), 0);
  const deployedLiquidity = marketList.reduce((sum, entry) => sum + (entry.totalLiquidity || 0), 0);

  const formatCompactAleo = (microcredits: number) => {
    const credits = microcredits / 1_000_000;
    return credits >= 1000 ? `${(credits / 1000).toFixed(1)}K` : credits.toFixed(1);
  };

  const featuredMarkets = marketList
    .filter((entry) => entry.status === 'active')
    .slice(0, 3)
    .map((entry) => {
      const priceBook = calculatePrices(entry.reserves);
      const impliedProbability = priceBook.length > 0 ? (priceBook[0] / PRECISION) * 100 : 50;
      const prompt = entry.question.toLowerCase();
      const symbol = prompt.includes('btc') || prompt.includes('bitcoin')
        ? 'BTC'
        : prompt.includes('eth') || prompt.includes('ethereum')
          ? 'ETH'
          : prompt.includes('aleo')
            ? 'ALEO'
            : null;

      return { entry, impliedProbability, symbol };
    });

  const watchlist = [
    { symbol: 'BTC' as const, label: 'BTC', price: oracleBoard.btc },
    { symbol: 'ETH' as const, label: 'ETH', price: oracleBoard.eth },
    { symbol: 'ALEO' as const, label: 'ALEO', price: oracleBoard.aleo },
  ];

  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <div className="hero-gradient-mesh" />
      <div className="grid-overlay" />
      <div className="noise-overlay" />

      <div className="relative z-10 mx-auto max-w-[1320px]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]"
        >
          <div className="glass-card relative overflow-hidden p-8 sm:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(227,166,93,0.16),transparent_26%),radial-gradient(circle_at_80%_20%,rgba(136,190,159,0.12),transparent_22%)]" />
            <div className="relative z-10">
              <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
                <LogoIcon className="h-5 w-5" />
                <span className="font-mono text-[10px] uppercase tracking-[0.26em] text-teal">
                  Obscura Protocol
                </span>
                <span className="hidden text-[11px] text-smoke/60 sm:inline">Private market surface</span>
              </div>

              <h1 className="max-w-3xl font-heading text-4xl font-semibold leading-[1.02] text-white sm:text-5xl lg:text-7xl">
                Quiet event books for traders who want less noise and more edge.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-smoke/76 sm:text-lg">
                Obscura keeps the prediction engine intact and changes the entire presentation layer:
                shielded positions, governed resolver flow, oracle-driven sessions, and a calmer interface for live markets.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/markets" className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm">
                  Open Signal Board
                </Link>
                <Link to="/rounds" className="btn-secondary inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm">
                  <BoltIcon className="h-4 w-4 text-teal" />
                  Enter Pulse Sessions
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {[
                  'Encrypted order flow',
                  'Three-program Leo stack',
                  'Wallet-routed settlement',
                ].map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-smoke/72">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="glass-card p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-teal">Signal Board</p>
                  <h2 className="mt-2 font-heading text-2xl text-white">Live books</h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-smoke/60">
                  Active flow
                </div>
              </div>

              <div className="space-y-3">
                {featuredMarkets.length === 0 ? (
                  <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-5 py-8 text-center text-smoke/56">
                    No live books are indexed yet.
                  </div>
                ) : (
                  featuredMarkets.map(({ entry, impliedProbability, symbol }) => (
                    <div key={entry.id} className="flex items-center justify-between rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-dark-200/70">
                          {symbol ? <CryptoIcon symbol={symbol} size={18} /> : <LogoIcon className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">{entry.question}</p>
                          <p className="mt-1 text-xs text-smoke/62">{entry.category} · {(entry.tokenType || 'ALEO').toUpperCase()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm text-white">{impliedProbability.toFixed(1)}%</p>
                        <p className="mt-1 text-xs text-smoke/62">{formatAleo(entry.totalVolume)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="glass-card p-5">
                <div className="mb-4 flex items-center gap-2">
                  <ShieldIcon className="h-4 w-4 text-accent-green" />
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-accent-green">Telemetry</p>
                </div>
                <p className="font-mono text-4xl font-bold text-white">{formatCompactAleo(grossVolume)}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-smoke/58">Total volume in ALEO</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-smoke/50">Open books</p>
                    <p className="mt-2 font-mono text-lg text-white">{activeMarketCount || marketList.length}</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-smoke/50">Trades</p>
                    <p className="mt-2 font-mono text-lg text-white">{tradeLedger.length}</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-teal">Oracle tape</p>
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-smoke/58">
                    Live
                  </span>
                </div>
                <div className="space-y-3">
                  {watchlist.map((asset) => (
                    <div key={asset.label} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                      <div className="flex items-center gap-2">
                        <CryptoIcon symbol={asset.symbol} size={16} />
                        <span className="text-sm text-white">{asset.label}</span>
                      </div>
                      <span className="font-mono text-sm text-white">
                        ${asset.price >= 1000 ? asset.price.toLocaleString(undefined, { maximumFractionDigits: 0 }) : asset.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Live books', value: String(activeMarketCount || marketList.length) },
            { label: 'Recorded trades', value: String(tradeLedger.length) },
            { label: 'Inventory depth', value: `${formatCompactAleo(deployedLiquidity)} ALEO` },
            { label: 'Pulse sessions', value: String(marketList.filter((entry) => entry.isEclipse).length) },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.08 }}
              className="glass-card p-5"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-smoke/55">{stat.label}</p>
              <p className="mt-3 font-mono text-2xl font-bold text-white">{stat.value}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

