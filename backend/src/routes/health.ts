import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    version: '6.0.0',
    program: 'obscura_protocol_v7.aleo',
    programs: {
      main: 'obscura_protocol_v7.aleo',
      usdcx: 'obscura_protocol_v7_cx.aleo',
      usad: 'obscura_protocol_v7_sd.aleo',
    },
  });
});

export default router;
