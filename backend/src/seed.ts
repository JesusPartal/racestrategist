import bcrypt from 'bcryptjs';
import db from './db';
import { v4 as uuid } from 'uuid';

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
    const isAdmin = u.username === 'JesusPartal' ? 1 : 0;
    db.prepare('INSERT OR IGNORE INTO users (id, username, password_hash, display_name, license_class, i_rating, team_id, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      u.id, u.username, hash, u.display, u.license, u.irating, 'default', isAdmin);
  }

  // Seed a default team for user_1 (JesusPartal)
  const teamId = 'team_' + uuid().slice(0, 8);
  db.prepare('INSERT OR IGNORE INTO teams (id, user_id, name, created_at) VALUES (?, ?, ?, ?)').run(
    teamId, 'user_5', 'Racing Club Valencia', Date.now());

  // Seed drivers for this team
  const drivers = [
    { name: 'Jesús Partal', accentColor: '#FFB000', avgLapTimeMs: 104500, fuelPerLapL: 3.2, errorFactor: 0.02, licenseClass: 'Pro', iRating: 4000, nationality: 'ES', role: 'Primary' },
    { name: 'Bicor Valencia', accentColor: '#00E676', avgLapTimeMs: 105200, fuelPerLapL: 3.1, errorFactor: 0.03, licenseClass: 'A', iRating: 3500, nationality: 'ES', role: 'Primary' },
    { name: 'Orlando Doniz', accentColor: '#448AFF', avgLapTimeMs: 106000, fuelPerLapL: 3.0, errorFactor: 0.04, licenseClass: 'B', iRating: 2800, nationality: 'ES', role: 'Reserve' },
  ];
  for (const d of drivers) {
    db.prepare('INSERT OR IGNORE INTO team_drivers (id, team_id, name, accent_color, avg_lap_time_ms, fuel_per_lap_l, error_factor, license_class, i_rating, nationality, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      'td_' + uuid().slice(0, 8), teamId, d.name, d.accentColor, d.avgLapTimeMs, d.fuelPerLapL, d.errorFactor, d.licenseClass, d.iRating, d.nationality, d.role);
  }

  // Seed events
  db.prepare('INSERT OR IGNORE INTO events (id, name, track_id, duration_minutes, allowed_car_classes) VALUES (?, ?, ?, ?, ?)').run(
    'daytona24', '24h of Daytona', 'daytona_road', 1440, JSON.stringify(['GT3', 'GTP', 'LMP2']));
  db.prepare('INSERT OR IGNORE INTO events (id, name, track_id, duration_minutes, allowed_car_classes) VALUES (?, ?, ?, ?, ?)').run(
    'nurburgring24', 'Nürburgring 24h', 'nurburgring_24h', 1440, JSON.stringify(['GT3', 'GT4', 'TCR']));
  db.prepare('INSERT OR IGNORE INTO events (id, name, track_id, duration_minutes, allowed_car_classes) VALUES (?, ?, ?, ?, ?)').run(
    'sebring12', 'Sebring 12h', 'sebring_international', 720, JSON.stringify(['GT3', 'GTP', 'LMP2']));

  // Clean up old vehicles and seed new ones
  db.prepare('DELETE FROM vehicles WHERE id IN (?, ?, ?, ?)').run('porsche992_gt3r', 'cadillac_vseries', 'dallara_p217', 'bmw_m4_gt3');

  const vehicles = [
    { id: 'aston_vantage_gt3_evo', name: 'Aston Martin Vantage GT3 Evo', tank: 120, refuel: 2.5 },
    { id: 'acura_nsx_gt3_evo22', name: 'Acura NSX GT3 EVO 22', tank: 110, refuel: 2.5 },
    { id: 'audi_r8_lms_gt3_evo2', name: 'Audi R8 LMS GT3 EVO 2', tank: 120, refuel: 2.5 },
    { id: 'bmw_m4_gt3', name: 'BMW M4 GT3', tank: 118, refuel: 2.5 },
    { id: 'corvette_z06_gt3r', name: 'Chevrolet Corvette Z06 GT3.R', tank: 120, refuel: 2.5 },
    { id: 'ferrari_296_gt3', name: 'Ferrari 296 GT3', tank: 110, refuel: 2.5 },
    { id: 'ford_mustang_gt3', name: 'Ford Mustang GT3', tank: 120, refuel: 2.5 },
    { id: 'lambo_huracan_gt3', name: 'Lamborghini Huracán GT3', tank: 120, refuel: 2.5 },
    { id: 'mclaren_720s_gt3_evo', name: 'McLaren 720S GT3 EVO', tank: 120, refuel: 2.5 },
    { id: 'mercedes_amg_gt3_2020', name: 'Mercedes-AMG GT3 2020', tank: 120, refuel: 2.5 },
    { id: 'porsche_992_gt3r', name: 'Porsche 992 GT3 R', tank: 114, refuel: 2.5 },
  ];
  for (const v of vehicles) {
    db.prepare('INSERT OR REPLACE INTO vehicles (id, name, fuel_tank_capacity_l, refuel_rate_ls, vehicle_class) VALUES (?, ?, ?, ?, ?)').run(
      v.id, v.name, v.tank, v.refuel, 'GT3');
  }

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
    'strat_001', 'Daytona 24h - Baseline', 'daytona24', 'porsche_992_gt3r', 'Porsche 992 GT3 R',
    105000, 3.2, 45000, 65000, Date.now(), mockDrivers, mockStints, 'default');

  console.log('Database seeded successfully');
}
