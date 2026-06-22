import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export interface AuthRequest extends Request {
  userId?: string;
  username?: string;
  teamId?: string;
  isAdmin?: boolean;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string; teamId: string; isAdmin?: boolean };
    req.userId = decoded.userId;
    req.username = decoded.username;
    req.teamId = decoded.teamId;
    req.isAdmin = decoded.isAdmin || false;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function generateToken(userId: string, username: string, teamId?: string, isAdmin?: boolean): string {
  return jwt.sign({ userId, username, teamId: teamId || 'default', isAdmin: isAdmin || false }, JWT_SECRET, { expiresIn: '7d' });
}

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.isAdmin) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}
