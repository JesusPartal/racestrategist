import { Router, Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/register', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }
  if (username.length < 3) {
    res.status(400).json({ error: 'Username must be at least 3 characters' });
    return;
  }
  if (password.length < 4) {
    res.status(400).json({ error: 'Password must be at least 4 characters' });
    return;
  }

  const result = authService.register({ username, password });
  if (!result) {
    res.status(409).json({ error: 'Username already taken' });
    return;
  }

  res.status(201).json(result);
});

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const result = authService.login({ username, password });
  if (!result) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  res.json(result);
});

router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = authService.getUserById(req.userId!);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(user);
});

export default router;
