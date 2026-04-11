import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import { config } from '../config';

export const APP_STATE_KEYS = {
  dynamicMarkets: 'dynamic_markets',
  pendingMarketMeta: 'pending_market_meta',
  governanceProposals: 'governance_proposals',
  roundBotState: 'round_bot_state',
} as const;

const LEGACY_STATE_FILES: Array<{ key: string; path: string }> = [
  {
    key: APP_STATE_KEYS.dynamicMarkets,
    path: join(__dirname, '../../data/dynamic-markets.json'),
  },
  {
    key: APP_STATE_KEYS.governanceProposals,
    path: join(__dirname, '../../data/governance-registry.json'),
  },
  {
    key: APP_STATE_KEYS.roundBotState,
    path: join(__dirname, '../../data/round-bot-state.json'),
  },
];

let pool: Pool | null = null;
let initPromise: Promise<void> | null = null;

function getPool(): Pool {
  if (pool) return pool;
  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is required for PostgreSQL-backed persistence');
  }

  pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
    max: 10,
  });
  return pool;
}

async function migrateLegacyStateIfMissing(key: string, path: string): Promise<void> {
  const db = getPool();
  const existing = await db.query('SELECT 1 FROM app_state WHERE key = $1', [key]);
  if (existing.rowCount && existing.rowCount > 0) return;
  if (!existsSync(path)) return;

  try {
    const parsed = JSON.parse(readFileSync(path, 'utf-8'));
    await db.query(
      `
        INSERT INTO app_state (key, value, updated_at)
        VALUES ($1, $2::jsonb, NOW())
        ON CONFLICT (key) DO NOTHING
      `,
      [key, JSON.stringify(parsed)]
    );
    console.log(`[PostgresState] Migrated legacy state for '${key}'`);
  } catch (err) {
    console.error(`[PostgresState] Failed to migrate legacy state for '${key}':`, err);
  }
}

export async function initPostgresState(): Promise<void> {
  if (initPromise) {
    await initPromise;
    return;
  }

  initPromise = (async () => {
    const db = getPool();
    await db.query('SELECT 1');
    await db.query(`
      CREATE TABLE IF NOT EXISTS app_state (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    for (const legacy of LEGACY_STATE_FILES) {
      await migrateLegacyStateIfMissing(legacy.key, legacy.path);
    }
  })();

  await initPromise;
}

export async function loadAppState<T>(key: string): Promise<T | null> {
  await initPostgresState();
  const db = getPool();
  const result = await db.query<{ value: T }>(
    'SELECT value FROM app_state WHERE key = $1',
    [key]
  );
  if (!result.rowCount) return null;
  return result.rows[0].value;
}

export async function saveAppState(key: string, value: unknown): Promise<void> {
  await initPostgresState();
  const db = getPool();
  await db.query(
    `
      INSERT INTO app_state (key, value, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `,
    [key, JSON.stringify(value)]
  );
}
