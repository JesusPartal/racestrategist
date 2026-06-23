import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import * as telemetryService from '../services/telemetry.service';
import { TelemetryRelayService } from '../services/telemetry-relay.service';

const router = Router();

// Public relay config (no auth needed for agent auto-discovery)
router.get('/config', (_req, res: Response) => {
  res.json({ relayUrl: telemetryService.getRelayUrl() });
});

// Agent telemetry ingestion (authenticated by agent token in query param)
router.post('/ingest', (req: any, res: Response) => {
  try {
    const token = req.query.token as string;
    const driverId = req.query.driverId as string;
    if (!token || !driverId) {
      res.status(400).json({ error: 'Missing token or driverId' });
      return;
    }
    const auth = telemetryService.validateAgentToken(token);
    if (!auth) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    const packet = req.body;
    if (!packet || !packet.car) {
      res.status(400).json({ error: 'Invalid telemetry packet' });
      return;
    }
    const relay: TelemetryRelayService | null = req.app.get('telemetryRelay');
    if (relay) {
      relay.ingestTelemetry(driverId, packet);
    }
    res.json({ ok: true });
  } catch (err: any) {
    console.error('[ingest error]', err?.message || err);
    res.status(500).json({ error: err?.message || 'Unknown error' });
  }
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
