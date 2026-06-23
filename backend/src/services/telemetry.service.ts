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
    lastUsedAt: row.last_used_at ?? null,
    createdBy: row.created_by,
  };
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
      last_used_at INTEGER,
      created_by TEXT NOT NULL
    );
  `);
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

  db.prepare(`INSERT INTO agent_tokens (id, team_id, driver_id, driver_name, token, created_at, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(id, teamId, driverId, driverName, token, Date.now(), createdBy);

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
  const row = db.prepare('SELECT driver_id, team_id FROM agent_tokens WHERE token = ?').get(token) as any;
  if (!row) return null;
  db.prepare('UPDATE agent_tokens SET last_used_at = ? WHERE token = ?').run(Date.now(), token);
  return { driverId: row.driver_id, teamId: row.team_id };
}
