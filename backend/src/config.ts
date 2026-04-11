const parseCorsOrigin = (origin?: string): string | string[] => {
  if (!origin) return 'http://localhost:5173';
  if (origin.includes(',')) return origin.split(',').map(o => o.trim());
  return origin;
};

const normalizeProgramId = (
  value: string | undefined,
  fallback: string,
  legacy: string
): string => {
  const normalized = (value || '').trim();
  if (!normalized || normalized === legacy) return fallback;
  return normalized;
};

const programId = normalizeProgramId(
  process.env.ALEO_PROGRAM_ID,
  'obscura_v2_0.aleo',
  'obscura_protocol_v7.aleo'
);
const programIdCx = normalizeProgramId(
  process.env.ALEO_PROGRAM_ID_CX,
  'obscura_v2_0_cx.aleo',
  'obscura_protocol_v7_cx.aleo'
);
const programIdSd = normalizeProgramId(
  process.env.ALEO_PROGRAM_ID_SD,
  'obscura_v2_0_sd.aleo',
  'obscura_protocol_v7_sd.aleo'
);

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  aleoEndpoint: process.env.ALEO_ENDPOINT || 'https://api.explorer.provable.com/v1',
  databaseUrl: process.env.DATABASE_URL || '',
  databaseSsl: (process.env.DATABASE_SSL_MODE || 'disable').toLowerCase() === 'require',
  programId,
  programIdCx,
  programIdSd,
  allProgramIds: [programId, programIdCx, programIdSd] as const,
  deployTxId: process.env.ALEO_DEPLOY_TXID || '',
  deployTxIdCx: process.env.ALEO_DEPLOY_TXID_CX || '',
  deployTxIdSd: process.env.ALEO_DEPLOY_TXID_SD || '',
  coingeckoUrl: 'https://api.coingecko.com/api/v3',
  oracleIntervalMinutes: 1,
  resolverIntervalMinutes: 5,
  corsOrigin: parseCorsOrigin(process.env.CORS_ORIGIN),
  // Provable delegated proving
  provableApiKey: process.env.PROVABLE_API_KEY || '',
  provableConsumerId: process.env.PROVABLE_CONSUMER_ID || '',
  // Round bot
  roundDurationMinutes: parseInt(process.env.ROUND_DURATION_MINUTES || '15', 10),
  roundBotEnabled: process.env.ROUND_BOT_ENABLED !== 'false',
  roundInitialLiquidity: parseInt(process.env.ROUND_INITIAL_LIQUIDITY || '1000000', 10), // 1 token in microcredits
};
