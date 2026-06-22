import bcrypt from 'bcryptjs';
import db from '../db';
import { LoginRequest, LoginResponse } from '../models/types';
import { generateToken } from '../middleware/auth';

export function login(req: LoginRequest): LoginResponse | null {
  fs.writeFileSync('C:\\Users\\jesus\\AppData\\Local\\Temp\\opencode\\auth_debug.log',
    `username: ${req.username}\npassword: ${req.password}\ndb prepared\n`, { flag: 'w' });

  const row = db.prepare('SELECT * FROM users WHERE username = ?').get(req.username) as any;
  if (!row) {
    fs.appendFileSync('C:\\Users\\jesus\\AppData\\Local\\Temp\\opencode\\auth_debug.log', 'row is null\n');
    return null;
  }

  fs.appendFileSync('C:\\Users\\jesus\\AppData\\Local\\Temp\\opencode\\auth_debug.log',
    `row keys: ${Object.keys(row)}\npassword_hash: ${row.password_hash}\n`);

  const valid = bcrypt.compareSync(req.password, row.password_hash);
  if (!valid) return null;

  const token = generateToken(row.id, row.username);
  return { token, displayName: row.displayName, licenseClass: row.licenseClass, iRating: row.iRating, userId: row.id };
}

export function getUserById(userId: string): Omit<User, 'passwordHash'> | null {
  const row = db.prepare('SELECT id, username, display_name, license_class, i_rating FROM users WHERE id = ?').get(userId) as any;
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    licenseClass: row.license_class,
    iRating: row.i_rating,
  } as any;
}
