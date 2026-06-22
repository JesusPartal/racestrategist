import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const PERSISTENT_PATH = '/railway/persistent/racestrategist.db';
const LOCAL_PATH = path.join(__dirname, '..', 'racestrategist.db');
const DB_PATH = (process.env.DB_PATH) ||
  (fs.existsSync('/railway/persistent') ? PERSISTENT_PATH : LOCAL_PATH);

const db: DatabaseType = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initializeDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      license_class TEXT NOT NULL DEFAULT 'A',
      i_rating INTEGER NOT NULL DEFAULT 4500,
      team_id TEXT NOT NULL DEFAULT 'default'
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      track_id TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      allowed_car_classes TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      fuel_tank_capacity_l REAL NOT NULL,
      refuel_rate_ls REAL NOT NULL,
      vehicle_class TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS strategies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT 'Unnamed Strategy',
      event_id TEXT NOT NULL,
      vehicle_id TEXT NOT NULL,
      vehicle_name TEXT NOT NULL DEFAULT '',
      avg_lap_time_ms REAL NOT NULL DEFAULT 0,
      fuel_per_lap REAL NOT NULL DEFAULT 0,
      pit_stop_fuel_only_ms INTEGER NOT NULL DEFAULT 45000,
      pit_stop_tires_ms INTEGER NOT NULL DEFAULT 65000,
      last_modified INTEGER NOT NULL,
      drivers TEXT NOT NULL DEFAULT '[]',
      stints TEXT NOT NULL DEFAULT '[]',
      team_id TEXT NOT NULL DEFAULT 'default',
      FOREIGN KEY (event_id) REFERENCES events(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );

    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT 'My Racing Team',
      created_at INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS team_drivers (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      name TEXT NOT NULL,
      accent_color TEXT NOT NULL DEFAULT '#FFB000',
      avg_lap_time_ms REAL NOT NULL DEFAULT 0,
      fuel_per_lap_l REAL DEFAULT 0,
      error_factor REAL NOT NULL DEFAULT 0,
      license_class TEXT,
      i_rating INTEGER,
      nationality TEXT,
      role TEXT,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
    );
  `);

  // Migrate existing tables
  try { db.exec('ALTER TABLE users ADD COLUMN team_id TEXT NOT NULL DEFAULT \'default\''); } catch {}
  try { db.exec('ALTER TABLE strategies ADD COLUMN team_id TEXT NOT NULL DEFAULT \'default\''); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0'); } catch {}
  try { db.exec('ALTER TABLE team_drivers ADD COLUMN team_id TEXT NOT NULL DEFAULT \'default\''); } catch {}
  try { db.exec('ALTER TABLE teams ADD COLUMN user_id TEXT NOT NULL DEFAULT \'user_1\''); } catch {}
  try { db.exec('ALTER TABLE teams ADD COLUMN created_at INTEGER NOT NULL DEFAULT 0'); } catch {}
  try { db.exec('ALTER TABLE team_drivers ADD COLUMN fuel_per_lap_l REAL DEFAULT 0'); } catch {}
}

export default db;
