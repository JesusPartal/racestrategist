import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import * as telemetryService from '../services/telemetry.service';

const router = Router();

// Public relay config (no auth needed for agent auto-discovery)
router.get('/config', (_req, res: Response) => {
  res.json({ relayUrl: telemetryService.getRelayUrl() });
});

// Authenticated endpoints for token management
router.use(authMiddleware);

router.get('/agent-tokens', (req: AuthRequest, res: Response) => {
  try {
    telemetryService.ensureTable();
    const tokens = telemetryService.listAgentTokens(req.teamId!);
    res.json(tokens);
  } catch (err: any) {
    console.error('[agent-tokens GET error]', err?.message || err);
    res.status(500).json({ error: err?.message || 'Unknown error', teamId: req.teamId });
  }
});

router.post('/agent-tokens', (req: AuthRequest, res: Response) => {
  try {
    const { driverId, driverName } = req.body;
    if (!driverId || !driverName) {
      res.status(400).json({ error: 'driverId and driverName are required' });
      return;
    }
    telemetryService.ensureTable();
    const token = telemetryService.createAgentToken(req.teamId!, driverId, driverName, req.username!);
    res.status(201).json(token);
  } catch (err: any) {
    console.error('[agent-tokens POST error]', err?.message || err);
    res.status(500).json({ error: err?.message || 'Unknown error' });
  }
});

router.delete('/agent-tokens/:id', (req: AuthRequest, res: Response) => {
  try {
    telemetryService.ensureTable();
    const deleted = telemetryService.revokeAgentToken(req.params.id as string, req.teamId!);
    if (!deleted) {
      res.status(404).json({ error: 'Token not found' });
      return;
    }
    res.status(204).send();
  } catch (err: any) {
    console.error('[agent-tokens DELETE error]', err?.message || err);
    res.status(500).json({ error: err?.message || 'Unknown error' });
  }
});

export default router;
