import db from '../db';
import { v4 as uuid } from 'uuid';
import { TeamDriver, DriverDto } from '../models/types';

export function getSettings(teamId: string): { teamName: string } {
  const row = db.prepare('SELECT team_name FROM team_settings WHERE id = ?').get(teamId) as any;
  return { teamName: row?.team_name || 'My Racing Team' };
}

export function updateSettings(teamId: string, updates: { teamName?: string }): boolean {
  const existing = db.prepare('SELECT id FROM team_settings WHERE id = ?').get(teamId);
  if (!existing) return false;
  if (updates.teamName !== undefined) {
    db.prepare('UPDATE team_settings SET team_name = ? WHERE id = ?').run(updates.teamName, teamId);
  }
  return true;
}

function rowToDriver(row: any): TeamDriver {
  return {
    id: row.id,
    name: row.name,
    accentColor: row.accent_color,
    avgLapTimeMs: row.avg_lap_time_ms,
    fuelPerLapL: row.fuel_per_lap_l,
    errorFactor: row.error_factor,
    licenseClass: row.license_class,
    iRating: row.i_rating,
    nationality: row.nationality,
    role: row.role,
  };
}

export function getAllDrivers(teamId: string, page = 1, limit = 50): TeamDriver[] {
  const offset = (page - 1) * limit;
  return (db.prepare('SELECT * FROM team_drivers WHERE team_id = ? LIMIT ? OFFSET ?').all(teamId, limit, offset) as any[]).map(rowToDriver);
}

export function addDriver(teamId: string, dto: DriverDto): TeamDriver {
  const id = dto.id || uuid().replace(/-/g, '').slice(0, 12);
  db.prepare(`INSERT INTO team_drivers (id, team_id, name, accent_color, avg_lap_time_ms, fuel_per_lap_l, error_factor, license_class, i_rating, nationality, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    id, teamId, dto.name, dto.accentColor, dto.avgLapTimeMs, dto.fuelPerLapL ?? null, dto.errorFactor,
    dto.licenseClass ?? null, dto.iRating ?? null, dto.nationality ?? null, dto.role ?? null);

  return rowToDriver(db.prepare('SELECT * FROM team_drivers WHERE id = ?').get(id));
}

export function updateDriver(teamId: string, id: string, dto: DriverDto): boolean {
  const existing = db.prepare('SELECT id FROM team_drivers WHERE id = ? AND team_id = ?').get(id, teamId);
  if (!existing) return false;

  db.prepare(`UPDATE team_drivers SET name = ?, accent_color = ?, avg_lap_time_ms = ?, fuel_per_lap_l = ?, error_factor = ?,
    license_class = ?, i_rating = ?, nationality = ?, role = ? WHERE id = ? AND team_id = ?`).run(
    dto.name, dto.accentColor, dto.avgLapTimeMs, dto.fuelPerLapL ?? null, dto.errorFactor,
    dto.licenseClass ?? null, dto.iRating ?? null, dto.nationality ?? null, dto.role ?? null, id, teamId);
  return true;
}

export function deleteDriver(teamId: string, id: string): boolean {
  const existing = db.prepare('SELECT id FROM team_drivers WHERE id = ? AND team_id = ?').get(id, teamId);
  if (!existing) return false;
  db.prepare('DELETE FROM team_drivers WHERE id = ? AND team_id = ?').run(id, teamId);
  return true;
}
