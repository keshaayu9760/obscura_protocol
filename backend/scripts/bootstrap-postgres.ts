import 'dotenv/config';
import { Pool } from 'pg';
import { initPostgresState } from '../src/services/postgres-state';

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function quoteIdentifier(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function databaseNameFromUrl(connectionString: string): string {
  const url = new URL(connectionString);
  const dbName = decodeURIComponent(url.pathname.replace(/^\//, ''));
  if (!dbName) {
    throw new Error('DATABASE_URL must include a database name');
  }
  return dbName;
}

function userFromUrl(connectionString: string): { username: string; password: string } {
  const url = new URL(connectionString);
  const username = decodeURIComponent(url.username);
  const password = decodeURIComponent(url.password);
  if (!username) {
    throw new Error('DATABASE_URL must include a username');
  }
  return { username, password };
}

function deriveAdminUrl(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  url.pathname = '/postgres';
  return url.toString();
}

async function ensureRole(pool: Pool, username: string, password: string): Promise<void> {
  const existing = await pool.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [username]);
  if (existing.rowCount && existing.rowCount > 0) {
    console.log(`[DB Bootstrap] Role '${username}' already exists`);
    return;
  }

  if (!password) {
    throw new Error(`Role '${username}' does not exist and DATABASE_URL has no password to create it`);
  }

  await pool.query(
    `CREATE ROLE ${quoteIdentifier(username)} WITH LOGIN PASSWORD $1`,
    [password]
  );
  console.log(`[DB Bootstrap] Created role '${username}'`);
}

async function ensureDatabase(pool: Pool, dbName: string, owner: string): Promise<void> {
  const existing = await pool.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (existing.rowCount && existing.rowCount > 0) {
    console.log(`[DB Bootstrap] Database '${dbName}' already exists`);
    return;
  }

  await pool.query(
    `CREATE DATABASE ${quoteIdentifier(dbName)} OWNER ${quoteIdentifier(owner)}`
  );
  console.log(`[DB Bootstrap] Created database '${dbName}' owned by '${owner}'`);
}

async function canConnect(connectionString: string): Promise<boolean> {
  const pool = new Pool({
    connectionString,
    ssl: (process.env.DATABASE_SSL_MODE || 'disable').toLowerCase() === 'require'
      ? { rejectUnauthorized: false }
      : undefined,
  });

  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  } finally {
    await pool.end();
  }
}

async function main(): Promise<void> {
  const databaseUrl = requireEnv('DATABASE_URL');
  const targetDb = databaseNameFromUrl(databaseUrl);
  const { username, password } = userFromUrl(databaseUrl);

  if (await canConnect(databaseUrl)) {
    console.log(`[DB Bootstrap] Connected to '${targetDb}' via DATABASE_URL`);
    await initPostgresState();
    console.log('[DB Bootstrap] PostgreSQL app_state table is ready');
    return;
  }

  const adminUrl = process.env.DATABASE_ADMIN_URL?.trim() || deriveAdminUrl(databaseUrl);

  const adminPool = new Pool({
    connectionString: adminUrl,
    ssl: (process.env.DATABASE_SSL_MODE || 'disable').toLowerCase() === 'require'
      ? { rejectUnauthorized: false }
      : undefined,
  });

  try {
    await adminPool.query('SELECT 1');
    await ensureRole(adminPool, username, password);
    await ensureDatabase(adminPool, targetDb, username);
  } finally {
    await adminPool.end();
  }

  await initPostgresState();
  console.log('[DB Bootstrap] PostgreSQL app_state table is ready');
}

main().catch((err) => {
  console.error('[DB Bootstrap] Failed:', err);
  process.exit(1);
});
