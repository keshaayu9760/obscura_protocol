import { Router } from 'express';
import { config } from '../config';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    version: '7.0.0',
    storage: config.databaseUrl ? 'postgresql' : 'unconfigured',
    program: config.programId,
    programs: {
      main: config.programId,
      usdcx: config.programIdCx,
      usad: config.programIdSd,
    },
    deployTxIds: {
      main: config.deployTxId,
      usdcx: config.deployTxIdCx,
      usad: config.deployTxIdSd,
    },
  });
});

export default router;
