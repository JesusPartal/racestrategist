import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import db from '../db';
import { v4 as uuid } from 'uuid';

const router = Router();
router.use(authMiddleware);

router.get('/', (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const teams = db.prepare('SELECT id, name, created_at FROM teams WHERE user_id = ? ORDER BY created_at DESC').all(userId) as any[];
  const teamsWithCount = teams.map(t => {
    const driverCount = db.prepare('SELECT COUNT(*) as c FROM team_drivers WHERE team_id = ?').get(t.id) as any;
    return { ...t, driverCount: driverCount?.c || 0 };
  });
  res.json(teamsWithCount);
});

router.post('/', (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { name } = req.body as { name?: string };
  if (!name?.trim()) { res.status(400).json({ error: 'Team name is required' }); return; }
  const id = 'team_' + uuid().slice(0, 8);
  const createdAt = Date.now();
  db.prepare('INSERT INTO teams (id, user_id, name, created_at) VALUES (?, ?, ?, ?)').run(id, userId, name.trim(), createdAt);
  res.json({ id, user_id: userId, name: name.trim(), created_at: createdAt, driverCount: 0 });
});

router.get('/:id', (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const team = db.prepare('SELECT * FROM teams WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
  if (!team) { res.status(404).json({ error: 'Team not found' }); return; }
  const drivers = db.prepare('SELECT * FROM team_drivers WHERE team_id = ?').all(team.id) as any[];
  res.json({ ...team, drivers });
});

router.put('/:id', (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const team = db.prepare('SELECT * FROM teams WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
  if (!team) { res.status(404).json({ error: 'Team not found' }); return; }
  const { name } = req.body as { name?: string };
  if (!name?.trim()) { res.status(400).json({ error: 'Team name is required' }); return; }
  db.prepare('UPDATE teams SET name = ? WHERE id = ?').run(name.trim(), team.id);
  res.json({ ...team, name: name.trim() });
});

router.delete('/:id', (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const team = db.prepare('SELECT * FROM teams WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
  if (!team) { res.status(404).json({ error: 'Team not found' }); return; }
  db.prepare('DELETE FROM team_drivers WHERE team_id = ?').run(team.id);
  db.prepare('DELETE FROM teams WHERE id = ?').run(team.id);
  res.json({ success: true });
});

// Driver routes
router.post('/:id/drivers', (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const team = db.prepare('SELECT * FROM teams WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
  if (!team) { res.status(404).json({ error: 'Team not found' }); return; }
  const { name, accentColor, avgLapTimeMs, fuelPerLapL, errorFactor, licenseClass, iRating, nationality, role } = req.body as any;
  if (!name?.trim()) { res.status(400).json({ error: 'Driver name is required' }); return; }
  const id = 'td_' + uuid().slice(0, 8);
  db.prepare(`INSERT INTO team_drivers (id, team_id, name, accent_color, avg_lap_time_ms, fuel_per_lap_l, error_factor, license_class, i_rating, nationality, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id, team.id, name.trim(), accentColor || '#FFB000', avgLapTimeMs || 0, fuelPerLapL || 0, errorFactor ?? 0.02, licenseClass || null, iRating || null, nationality || null, role || 'Primary');
  res.json({ id, team_id: team.id, name: name.trim(), accent_color: accentColor || '#FFB000', avg_lap_time_ms: avgLapTimeMs || 0, fuel_per_lap_l: fuelPerLapL || 0, error_factor: errorFactor ?? 0.02, license_class: licenseClass, i_rating: iRating, nationality, role: role || 'Primary' });
});

router.put('/:id/drivers/:driverId', (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const team = db.prepare('SELECT * FROM teams WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
  if (!team) { res.status(404).json({ error: 'Team not found' }); return; }
  const driver = db.prepare('SELECT * FROM team_drivers WHERE id = ? AND team_id = ?').get(req.params.driverId, team.id) as any;
  if (!driver) { res.status(404).json({ error: 'Driver not found' }); return; }
  const { name, accentColor, avgLapTimeMs, fuelPerLapL, errorFactor, licenseClass, iRating, nationality, role } = req.body as any;
  if (name !== undefined && !name?.trim()) { res.status(400).json({ error: 'Driver name cannot be empty' }); return; }
  db.prepare(`UPDATE team_drivers SET name = COALESCE(?, name), accent_color = COALESCE(?, accent_color), avg_lap_time_ms = COALESCE(?, avg_lap_time_ms),
    fuel_per_lap_l = COALESCE(?, fuel_per_lap_l), error_factor = COALESCE(?, error_factor), license_class = COALESCE(?, license_class),
    i_rating = COALESCE(?, i_rating), nationality = COALESCE(?, nationality), role = COALESCE(?, role) WHERE id = ?`).run(
    name?.trim() || null, accentColor || null, avgLapTimeMs ?? null, fuelPerLapL ?? null, errorFactor ?? null,
    licenseClass ?? null, iRating ?? null, nationality ?? null, role ?? null, driver.id);
  const updated = db.prepare('SELECT * FROM team_drivers WHERE id = ?').get(driver.id) as any;
  res.json(updated);
});

router.delete('/:id/drivers/:driverId', (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const team = db.prepare('SELECT * FROM teams WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
  if (!team) { res.status(404).json({ error: 'Team not found' }); return; }
  const driver = db.prepare('SELECT * FROM team_drivers WHERE id = ? AND team_id = ?').get(req.params.driverId, team.id) as any;
  if (!driver) { res.status(404).json({ error: 'Driver not found' }); return; }
  db.prepare('DELETE FROM team_drivers WHERE id = ?').run(driver.id);
  res.json({ success: true });
});

export default router;