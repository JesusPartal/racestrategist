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
  const tokens = telemetryService.listAgentTokens(req.teamId!);
  res.json(tokens);
});

router.post('/agent-tokens', (req: AuthRequest, res: Response) => {
  const { driverId, driverName } = req.body;
  if (!driverId || !driverName) {
    res.status(400).json({ error: 'driverId and driverName are required' });
    return;
  }
  const token = telemetryService.createAgentToken(req.teamId!, driverId, driverName, req.username!);
  res.status(201).json(token);
});

router.delete('/agent-tokens/:id', (req: AuthRequest, res: Response) => {
  const deleted = telemetryService.revokeAgentToken(req.params.id as string, req.teamId!);
  if (!deleted) {
    res.status(404).json({ error: 'Token not found' });
    return;
  }
  res.status(204).send();
});

export default router;
