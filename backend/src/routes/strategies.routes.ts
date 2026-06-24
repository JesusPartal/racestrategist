import { Router, Response, Request } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import * as strategyService from '../services/strategy.service';

const INVITE_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  return secret || 'dev-secret-change-in-production';
})();

const router = Router();

// Public invite resolve — no user auth needed, token-based auth only
router.get('/invite/:token', (req: Request, res: Response) => {
  try {
    const payload = jwt.verify(req.params.token as string, INVITE_SECRET);
    const decoded = payload as unknown as { strategyId: string };
    const strategy = strategyService.getStrategyById(decoded.strategyId);
    if (!strategy) { res.status(404).json({ error: 'Strategy not found' }); return; }
    res.json({ strategyId: decoded.strategyId, strategy });
  } catch {
    res.status(400).json({ error: 'Invalid or expired invite token' });
  }
});

// All routes below require authentication
router.use(authMiddleware);

router.get('/', (req: AuthRequest, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  res.json(strategyService.getAllStrategies(page, limit, req.teamId));
});

router.get('/:id', (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const strategy = strategyService.getStrategyById(id, req.teamId);
  if (!strategy) { res.status(404).json({ error: 'Strategy not found' }); return; }
  res.json(strategy);
});

router.post('/', (req: AuthRequest, res: Response) => {
  const { name, eventId, vehicleId, vehicleName, avgLapTimeMs, fuelPerLap, eventStartTime, eventDurationMinutes } = req.body;
  if (!name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  const strategy = strategyService.createStrategy({ name, eventId, vehicleId, vehicleName, avgLapTimeMs: avgLapTimeMs || 0, fuelPerLap: fuelPerLap || 0, eventStartTime, eventDurationMinutes }, req.teamId, req.userId);
  res.status(201).json(strategy);
});

router.put('/:id', (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const updated = strategyService.updateStrategy(id, req.body, req.teamId);
  if (!updated) { res.status(404).json({ error: 'Strategy not found' }); return; }
  res.json(strategyService.getStrategyById(id));
});

router.delete('/:id', (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const deleted = strategyService.deleteStrategy(id, req.userId, req.isAdmin, req.teamId);
  if (!deleted) { res.status(403).json({ error: 'Only the creator can delete this strategy' }); return; }
  res.status(204).send();
});

router.put('/:id/stints', (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { stints } = req.body;
  if (!Array.isArray(stints)) { res.status(400).json({ error: 'stints array is required' }); return; }
  const updated = strategyService.updateStints(id, stints, req.teamId);
  if (!updated) { res.status(404).json({ error: 'Strategy not found' }); return; }
  res.json(strategyService.getStrategyById(id));
});

router.put('/:id/drivers', (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { drivers } = req.body;
  if (!Array.isArray(drivers)) { res.status(400).json({ error: 'drivers array is required' }); return; }
  const updated = strategyService.updateDrivers(id, drivers, req.teamId);
  if (!updated) { res.status(404).json({ error: 'Strategy not found' }); return; }
  res.json(strategyService.getStrategyById(id));
});

router.post('/:id/invite', (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const strategy = strategyService.getStrategyById(id);
  if (!strategy) { res.status(404).json({ error: 'Strategy not found' }); return; }

  const token = jwt.sign({ strategyId: id }, INVITE_SECRET, { expiresIn: '7d' });
  res.json({ token, url: `/join?token=${token}` });
});

router.post('/invite/:token/accept', (req: AuthRequest, res: Response) => {
  try {
    const payload = jwt.verify(req.params.token as string, INVITE_SECRET);
    const decoded = payload as unknown as { strategyId: string };
    const cloned = strategyService.cloneStrategy(decoded.strategyId, req.teamId!, req.userId);
    if (!cloned) { res.status(400).json({ error: 'Could not clone strategy' }); return; }
    res.json(cloned);
  } catch {
    res.status(400).json({ error: 'Invalid or expired invite token' });
  }
});

export default router;
