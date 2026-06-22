import bcrypt from 'bcryptjs';
import db from './db';

export function seedData(): void {
  const users = [
    { id: 'user_1', username: 'TrackTitan_99',   password: 'demo',     display: 'TrackTitan_99',   license: 'Pro', irating: 4500 },
    { id: 'user_2', username: 'HectorGoded',     password: 'hector23', display: 'Hector Goded',    license: 'A',   irating: 3200 },
    { id: 'user_3', username: 'CesarMaldonado',  password: 'cesar23',  display: 'César Maldonado', license: 'A',   irating: 3000 },
    { id: 'user_4', username: 'JosueTellez',     password: 'josue23',  display: 'Josué Téllez',    license: 'B',   irating: 2500 },
    { id: 'user_5', username: 'JesusPartal',     password: 'jesus23',  display: 'Jesús Partal',    license: 'Pro', irating: 4000 },
    { id: 'user_6', username: 'BicorValencia',   password: 'bicor23',  display: 'Bicor Valencia',  license: 'A',   irating: 3500 },
    { id: 'user_7', username: 'OrlandoDoniz',    password: 'orlando23',display: 'Orlando Doniz',    license: 'B',   irating: 2800 },
    { id: 'user_8', username: 'RaycoLeon',       password: 'rayco23',  display: 'Rayco León',      license: 'A',   irating: 3100 },
  ];

  for (const u of users) {
    const hash = bcrypt.hashSync(u.password, 10);
    db.prepare('INSERT OR IGNORE INTO users (id, username, password_hash, display_name, license_class, i_rating, team_id) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      u.id, u.username, hash, u.display, u.license, u.irating, 'default');
  }

  // Seed events
  db.prepare('INSERT OR IGNORE INTO events (id, name, track_id, duration_minutes, allowed_car_classes) VALUES (?, ?, ?, ?, ?)').run(
    'daytona24', '24h of Daytona', 'daytona_road', 1440, JSON.stringify(['GT3', 'GTP', 'LMP2']));
  db.prepare('INSERT OR IGNORE INTO events (id, name, track_id, duration_minutes, allowed_car_classes) VALUES (?, ?, ?, ?, ?)').run(
    'nurburgring24', 'Nürburgring 24h', 'nurburgring_24h', 1440, JSON.stringify(['GT3', 'GT4', 'TCR']));
  db.prepare('INSERT OR IGNORE INTO events (id, name, track_id, duration_minutes, allowed_car_classes) VALUES (?, ?, ?, ?, ?)').run(
    'sebring12', 'Sebring 12h', 'sebring_international', 720, JSON.stringify(['GT3', 'GTP', 'LMP2']));

  // Seed vehicles
  db.prepare('INSERT OR IGNORE INTO vehicles (id, name, fuel_tank_capacity_l, refuel_rate_ls, vehicle_class) VALUES (?, ?, ?, ?, ?)').run(
    'porsche992_gt3r', 'Porsche 911 GT3 R (992)', 114, 2.5, 'GT3');
  db.prepare('INSERT OR IGNORE INTO vehicles (id, name, fuel_tank_capacity_l, refuel_rate_ls, vehicle_class) VALUES (?, ?, ?, ?, ?)').run(
    'bmw_m4_gt3', 'BMW M4 GT3', 118, 2.5, 'GT3');
  db.prepare('INSERT OR IGNORE INTO vehicles (id, name, fuel_tank_capacity_l, refuel_rate_ls, vehicle_class) VALUES (?, ?, ?, ?, ?)').run(
    'cadillac_vseries', 'Cadillac V-Series.R', 95, 3.0, 'GTP');
  db.prepare('INSERT OR IGNORE INTO vehicles (id, name, fuel_tank_capacity_l, refuel_rate_ls, vehicle_class) VALUES (?, ?, ?, ?, ?)').run(
    'dallara_p217', 'Dallara P217', 80, 3.0, 'LMP2');

  // Seed mock strategy
  const mockDrivers = JSON.stringify([
    { id: 'driver_1', name: 'TrackTitan_99', accentColor: '#FFB000', avgLapTimeMs: 104500, errorFactor: 0.02, licenseClass: 'Pro', iRating: 4500, role: 'Primary' },
    { id: 'driver_2', name: 'SpeedDemon', accentColor: '#00E676', avgLapTimeMs: 105200, errorFactor: 0.03, licenseClass: 'A', iRating: 3200, role: 'Primary' },
    { id: 'driver_3', name: 'NightOwl', accentColor: '#448AFF', avgLapTimeMs: 106000, errorFactor: 0.04, licenseClass: 'B', iRating: 2800, role: 'Reserve' },
  ]);

  const mockStints = JSON.stringify([
    { index: 0, driverId: 'driver_1', startTimeMs: 0, endTimeMs: 2100000, laps: 20, changeTires: true, isCompleted: false },
    { index: 1, driverId: 'driver_2', startTimeMs: 2100000, endTimeMs: 4200000, laps: 20, changeTires: false, isCompleted: false },
  ]);

  db.prepare(`INSERT OR IGNORE INTO strategies (id, name, event_id, vehicle_id, vehicle_name, avg_lap_time_ms, fuel_per_lap, pit_stop_fuel_only_ms, pit_stop_tires_ms, last_modified, drivers, stints, team_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    'strat_001', 'Daytona 24h - Baseline', 'daytona24', 'porsche992_gt3r', 'Porsche 911 GT3 R (992)',
    105000, 3.2, 45000, 65000, Date.now(), mockDrivers, mockStints, 'default');

  console.log('Database seeded successfully');
}
