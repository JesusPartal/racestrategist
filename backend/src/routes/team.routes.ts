import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import * as teamService from '../services/team.service';

const router = Router();
router.use(authMiddleware);

router.get('/settings', (req: AuthRequest, res: Response) => {
  res.json(teamService.getSettings(req.teamId!));
});

router.put('/settings', (req: AuthRequest, res: Response) => {
  const { teamName } = req.body;
  if (!teamService.updateSettings(req.teamId!, { teamName })) {
    res.status(500).json({ error: 'Failed to update settings' });
    return;
  }
  res.json(teamService.getSettings(req.teamId!));
});

router.get('/drivers', (req: AuthRequest, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  res.json(teamService.getAllDrivers(req.teamId!, page, limit));
});

router.post('/drivers', (req: AuthRequest, res: Response) => {
  const { name, accentColor, avgLapTimeMs, fuelPerLapL, errorFactor, licenseClass, iRating, nationality, role } = req.body;
  if (!name) { res.status(400).json({ error: 'name is required' }); return; }
  const driver = teamService.addDriver(req.teamId!, { name, accentColor: accentColor || '#FFB000', avgLapTimeMs: avgLapTimeMs || 0, fuelPerLapL, errorFactor: errorFactor || 0, licenseClass, iRating, nationality, role });
  res.status(201).json(driver);
});

router.put('/drivers/:id', (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const updated = teamService.updateDriver(req.teamId!, id, req.body);
  if (!updated) { res.status(404).json({ error: 'Driver not found' }); return; }
  res.json(teamService.getAllDrivers(req.teamId!).find(d => d.id === id));
});

router.delete('/drivers/:id', (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const deleted = teamService.deleteDriver(req.teamId!, id);
  if (!deleted) { res.status(404).json({ error: 'Driver not found' }); return; }
  res.status(204).send();
});

export default router;
