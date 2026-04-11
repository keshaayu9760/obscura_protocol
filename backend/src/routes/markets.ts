import { Router } from 'express';
import { getCachedMarkets, fetchMarketsFromChain, setCachedMarkets, registerMarket, updateMarketMeta, persistRegistry } from '../services/indexer';
import { savePendingMeta, scanForNewMarkets } from '../services/scanner';

const router = Router();

router.get('/', (_req, res) => {
  const markets = getCachedMarkets();
  res.json({ markets });
});

router.get('/:id', (req, res) => {
  const market = getCachedMarkets().find((m) => m.id === req.params.id);
  if (!market) {
    res.status(404).json({ error: 'Market not found' });
    return;
  }
  res.json({ market });
});

router.post('/refresh', async (_req, res) => {
  const markets = await fetchMarketsFromChain();
  setCachedMarkets(markets);
  res.json({ markets, refreshed: true });
});

router.post('/discover', async (req, res) => {
  try {
    const requestedBlocks = Number(req.body?.blocks);
    const blocks = Number.isFinite(requestedBlocks)
      ? Math.min(Math.max(Math.floor(requestedBlocks), 25), 1000)
      : 300;

    const found = await scanForNewMarkets(blocks);
    const markets = await fetchMarketsFromChain();
    setCachedMarkets(markets);
    res.json({ success: true, found, marketCount: markets.length, markets });
  } catch (err) {
    console.error('[MarketsRoute] Discovery failed:', err);
    res.status(500).json({ error: 'Market discovery failed' });
  }
});

router.post('/register', async (req, res) => {
  const { marketId, question, outcomes, isEclipse, tokenType, programId, imageUrl } = req.body;
  if (!marketId || !question || !Array.isArray(outcomes) || outcomes.length < 2) {
    res.status(400).json({ error: 'marketId, question, and outcomes (array) required' });
    return;
  }
  const registered = registerMarket(marketId, {
    questionHash: '',
    question,
    outcomes,
    isEclipse: isEclipse || false,
    tokenType: tokenType || undefined,
    programId: typeof programId === 'string' ? programId : undefined,
    imageUrl: imageUrl || undefined,
  });
  if (!registered) {
    // Market was already registered (e.g. by scanner) — update with real metadata
    updateMarketMeta(marketId, {
      question,
      outcomes,
      isEclipse: isEclipse || false,
      tokenType: tokenType || undefined,
      programId: typeof programId === 'string' ? programId : undefined,
      imageUrl: imageUrl || undefined,
    });
  }
  await persistRegistry();
  const markets = await fetchMarketsFromChain();
  setCachedMarkets(markets);
  res.json({ success: true, marketCount: markets.length });
});

// Save pending market metadata before tx confirms.
// Frontend sends question text + hash so the scanner can populate the
// market's metadata when it discovers the market_id on-chain.
router.post('/pending', async (req, res) => {
  const { questionHash, question, outcomes, isEclipse } = req.body;
  if (!questionHash || !question) {
    res.status(400).json({ error: 'questionHash and question required' });
    return;
  }
  await savePendingMeta(questionHash, {
    question,
    outcomes: Array.isArray(outcomes) ? outcomes : ['Yes', 'No'],
    isEclipse: isEclipse || false,
    createdAt: Date.now(),
  });
  res.json({ success: true });
});

export default router;

