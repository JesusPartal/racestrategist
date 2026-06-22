import fs from 'fs';
import bcrypt from 'bcryptjs';
import db from '../db';
import { LoginRequest, LoginResponse, User } from '../models/types';
import { generateToken } from '../middleware/auth';

export function login(req: LoginRequest): LoginResponse | null {
  fs.writeFileSync('/tmp/opencode/auth_debug.log',
    `username: ${req.username}\npassword: ${req.password}\ndb prepared\n`, { flag: 'w' });

  const row = db.prepare('SELECT * FROM users WHERE username = ?').get(req.username) as any;
  if (!row) {
    fs.appendFileSync('/tmp/opencode/auth_debug.log', 'row is null\n');
    return null;
  }

  fs.appendFileSync('/tmp/opencode/auth_debug.log',
    `row keys: ${Object.keys(row)}\npassword_hash: ${row.password_hash}\n`);

  const valid = bcrypt.compareSync(req.password, row.password_hash);
  if (!valid) return null;

  const token = generateToken(row.id, row.username, row.team_id);
  return { token, displayName: row.displayName, licenseClass: row.licenseClass, iRating: row.iRating, userId: row.id, teamId: row.team_id };
}

export function register(req: LoginRequest): LoginResponse | null {
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(req.username) as any;
  if (existing) return null;

  const id = `user_${Date.now()}`;
  const hash = bcrypt.hashSync(req.password, 10);
  db.prepare('INSERT INTO users (id, username, password_hash, display_name, license_class, i_rating, team_id) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    id, req.username, hash, req.username, 'Rookie', 1350, 'default');

  const token = generateToken(id, req.username, 'default');
  return { token, displayName: req.username, licenseClass: 'Rookie', iRating: 1350, userId: id, teamId: 'default' };
}

export function getUserById(userId: string): Omit<User, 'passwordHash'> | null {
  const row = db.prepare('SELECT id, username, display_name, license_class, i_rating, team_id FROM users WHERE id = ?').get(userId) as any;
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    licenseClass: row.license_class,
    iRating: row.i_rating,
    teamId: row.team_id,
  } as any;
}
