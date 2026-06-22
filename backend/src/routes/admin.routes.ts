import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth';
import db from '../db';
import { v4 as uuid } from 'uuid';

const router = Router();
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/users', (req: AuthRequest, res: Response) => {
  const rows = db.prepare('SELECT id, username, display_name, license_class, i_rating, team_id, is_admin FROM users ORDER BY username').all() as any[];
  res.json(rows.map(r => ({
    id: r.id,
    username: r.username,
    displayName: r.display_name,
    licenseClass: r.license_class,
    iRating: r.i_rating,
    teamId: r.team_id,
    isAdmin: !!(r.is_admin),
  })));
});

router.post('/users', (req: AuthRequest, res: Response) => {
  const { username, password, displayName, licenseClass, iRating, teamId } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'username and password are required' });
    return;
  }
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as any;
  if (existing) {
    res.status(409).json({ error: 'Username already taken' });
    return;
  }
  const id = `user_${Date.now()}`;
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (id, username, password_hash, display_name, license_class, i_rating, team_id, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?, 0)').run(
    id, username, hash, displayName || username, licenseClass || 'Rookie', iRating || 1350, teamId || 'default');
  res.status(201).json({ id, username, displayName: displayName || username, licenseClass: licenseClass || 'Rookie', iRating: iRating || 1350, teamId: teamId || 'default' });
});

router.put('/users/:id', (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(id) as any;
  if (!existing) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const { displayName, licenseClass, iRating, teamId, password } = req.body;

  if (displayName !== undefined) {
    db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(displayName, id);
  }
  if (licenseClass !== undefined) {
    db.prepare('UPDATE users SET license_class = ? WHERE id = ?').run(licenseClass, id);
  }
  if (iRating !== undefined) {
    db.prepare('UPDATE users SET i_rating = ? WHERE id = ?').run(iRating, id);
  }
  if (teamId !== undefined) {
    db.prepare('UPDATE users SET team_id = ? WHERE id = ?').run(teamId, id);
  }
  if (password !== undefined && password !== '') {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, id);
  }

  const updated = db.prepare('SELECT id, username, display_name, license_class, i_rating, team_id, is_admin FROM users WHERE id = ?').get(id) as any;
  res.json({
    id: updated.id,
    username: updated.username,
    displayName: updated.display_name,
    licenseClass: updated.license_class,
    iRating: updated.i_rating,
    teamId: updated.team_id,
    isAdmin: !!(updated.is_admin),
  });
});

router.delete('/users/:id', (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  if (id === req.userId) {
    res.status(400).json({ error: 'Cannot delete yourself' });
    return;
  }
  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(id) as any;
  if (!existing) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.status(204).send();
});

export default router;
