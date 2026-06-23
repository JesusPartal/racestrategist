import db from '../db';
import { v4 as uuid } from 'uuid';
import crypto from 'crypto';
import { AgentToken } from '../models/types';

function rowToToken(row: any): AgentToken {
  return {
    id: row.id,
    teamId: row.team_id,
    driverId: row.driver_id,
    driverName: row.driver_name,
    token: row.token,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    lastUsedAt: row.last_used_at ?? null,
    createdBy: row.created_by,
  };
}

export function getAgentTokenTtlDays(): number {
  const val = parseInt(process.env.AGENT_TOKEN_TTL_DAYS || '', 10);
  return !isNaN(val) && val > 0 ? val : 90;
}

export function ensureTable(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS agent_tokens (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      driver_id TEXT NOT NULL,
      driver_name TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      last_used_at INTEGER,
      created_by TEXT NOT NULL
    );
  `);

  // Migrate: add expires_at if missing (v2 upgrade)
  try { db.exec('ALTER TABLE agent_tokens ADD COLUMN expires_at INTEGER NOT NULL DEFAULT 0'); } catch {}
  // Set default expiry for existing tokens that have no expiry
  const defaultTtl = getAgentTokenTtlDays();
  db.prepare(`UPDATE agent_tokens SET expires_at = ? WHERE expires_at = 0`).run(Date.now() + defaultTtl * 86400000);
}

export function getRelayUrl(): string {
  if (process.env.RELAY_URL) return process.env.RELAY_URL;
  const host = process.env.RAILWAY_PUBLIC_DOMAIN || `localhost:${process.env.PORT || 3000}`;
  const protocol = host.includes('localhost') ? 'ws' : 'wss';
  return `${protocol}://${host}/ws/telemetry/agent`;
}

export function createAgentToken(teamId: string, driverId: string, driverName: string, createdBy: string): AgentToken {
  const id = uuid().replace(/-/g, '').slice(0, 12);
  const token = `at_${crypto.randomBytes(24).toString('hex')}`;
  const ttlDays = getAgentTokenTtlDays();
  const expiresAt = Date.now() + ttlDays * 86400000;

  db.prepare(`INSERT INTO agent_tokens (id, team_id, driver_id, driver_name, token, created_at, expires_at, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(id, teamId, driverId, driverName, token, Date.now(), expiresAt, createdBy);

  return rowToToken(db.prepare('SELECT * FROM agent_tokens WHERE id = ?').get(id));
}

export function listAgentTokens(teamId: string): AgentToken[] {
  return (db.prepare('SELECT * FROM agent_tokens WHERE team_id = ? ORDER BY created_at DESC').all(teamId) as any[]).map(rowToToken);
}

export function revokeAgentToken(id: string, teamId: string): boolean {
  const existing = db.prepare('SELECT id FROM agent_tokens WHERE id = ? AND team_id = ?').get(id, teamId);
  if (!existing) return false;
  db.prepare('DELETE FROM agent_tokens WHERE id = ? AND team_id = ?').run(id, teamId);
  return true;
}

export function validateAgentToken(token: string): { driverId: string; teamId: string } | null {
  const row = db.prepare('SELECT driver_id, team_id, expires_at FROM agent_tokens WHERE token = ?').get(token) as any;
  if (!row) return null;
  // Check expiration
  if (row.expires_at && Date.now() > row.expires_at) {
    // Clean up expired token
    db.prepare('DELETE FROM agent_tokens WHERE token = ?').run(token);
    return null;
  }
  db.prepare('UPDATE agent_tokens SET last_used_at = ? WHERE token = ?').run(Date.now(), token);
  return { driverId: row.driver_id, teamId: row.team_id };
}

export function cleanupExpiredTokens(): number {
  const now = Date.now();
  const result = db.prepare('DELETE FROM agent_tokens WHERE expires_at > 0 AND expires_at <= ?').run(now);
  return result.changes;
}
