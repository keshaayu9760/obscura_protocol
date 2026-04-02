/**
 * Obscura Protocol Migration Script (legacy markets → v7 family)
 *
 * This script updates the backend registry after moving to the v7 program family.
 * Legacy on-chain markets live on earlier program generations and cannot be moved —
 * new markets must be created fresh on the new programs.
 *
 * What this does:
 * 1. Backs up the current dynamic-markets.json
 * 2. Clears the dynamic registry (legacy markets won't resolve on v7 programs)
 * 3. Logs migration status
 *
 * New v7 markets are created via the frontend Create Market page or
 * POST /api/markets/register. The scanner will pick them up automatically.
 *
 * Usage: npx tsx scripts/migrate-v6.ts
 */

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, '..', 'data');
const DYNAMIC_FILE = path.join(DATA_DIR, 'dynamic-markets.json');
const BACKUP_FILE = path.join(DATA_DIR, 'dynamic-markets-v5-backup.json');
const GOV_FILE = path.join(DATA_DIR, 'governance-registry.json');

console.log('=== Obscura Protocol migration to v7 ===\n');

// 1. Backup existing dynamic registry
if (fs.existsSync(DYNAMIC_FILE)) {
  const data = fs.readFileSync(DYNAMIC_FILE, 'utf-8');
  const parsed = JSON.parse(data);
  const count = Object.keys(parsed).length;
  fs.writeFileSync(BACKUP_FILE, data);
  console.log(`[Backup] Saved ${count} dynamic market(s) to ${BACKUP_FILE}`);
} else {
  console.log('[Backup] No dynamic-markets.json found, skipping backup');
}

// 2. Clear dynamic registry for v7 fresh start
fs.writeFileSync(DYNAMIC_FILE, JSON.stringify({}, null, 2));
console.log('[Migrate] Cleared dynamic-markets.json for v7');

// 3. Initialize governance registry
if (!fs.existsSync(GOV_FILE)) {
  fs.writeFileSync(GOV_FILE, JSON.stringify([], null, 2));
  console.log('[Migrate] Created empty governance-registry.json');
} else {
  console.log('[Migrate] governance-registry.json already exists');
}

// 4. Print program info
console.log('\n=== v7 Program Deployment ===');
console.log('Main (ALEO):  obscura_protocol_v7.aleo');
console.log('CX (USDCx):   obscura_protocol_v7_cx.aleo');
console.log('SD (USAD):    obscura_protocol_v7_sd.aleo');

console.log('\n=== Legacy Seed Markets (read-only, for reference) ===');
const legacySeeds = [
  { q: 'Will Bitcoin reach $100K by end of 2026?', type: 'ALEO', ECLIPSE: false },
  { q: 'Will SpaceX land humans on Mars by 2027?', type: 'ALEO', ECLIPSE: false },
  { q: 'Will US adopt a national CBDC by 2027?', type: 'ALEO', ECLIPSE: false },
  { q: 'Best Streaming Platform 2026', type: 'ALEO', ECLIPSE: false },
  { q: 'BTC Eclipse Round', type: 'ALEO', ECLIPSE: true },
  { q: 'ETH Eclipse Round', type: 'ALEO', ECLIPSE: true },
  { q: 'ALEO Eclipse Round', type: 'ALEO', ECLIPSE: true },
  { q: 'BTC Eclipse Round (USDCx)', type: 'USDCX', ECLIPSE: true },
  { q: 'ETH Eclipse Round (USDCx)', type: 'USDCX', ECLIPSE: true },
  { q: 'ALEO Eclipse Round (USDCx)', type: 'USDCX', ECLIPSE: true },
];
legacySeeds.forEach((s, i) => console.log(`  ${i + 1}. [${s.type}] ${s.q}${s.ECLIPSE ? ' (Eclipse)' : ''}`));

console.log('\n=== Next Steps ===');
console.log('1. Start the backend: npm run dev');
console.log('2. Create v7 markets via the frontend Create page or POST /api/markets/register');
console.log('3. Eclipse markets: Use the Create Eclipse form');
console.log('4. The scanner will auto-discover new v7 markets from on-chain');
console.log('5. Governance proposals can be created from the /governance page');

console.log('\n✓ Migration complete');

