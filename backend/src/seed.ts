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
    const isAdmin = u.username === 'JesusPartal' ? 1 : 0;
    db.prepare('INSERT OR IGNORE INTO users (id, username, password_hash, display_name, license_class, i_rating, team_id, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      u.id, u.username, hash, u.display, u.license, u.irating, 'default', isAdmin);
  }

  // Seed events — only Spa 24HR, clean up old data
  db.exec('PRAGMA foreign_keys = OFF');
  db.prepare('DELETE FROM strategies WHERE event_id != ?').run('spa24');
  db.prepare('DELETE FROM events').run();
  db.exec('PRAGMA foreign_keys = ON');
  db.prepare('INSERT INTO events (id, name, track_id, duration_minutes, allowed_car_classes) VALUES (?, ?, ?, ?, ?)').run(
    'spa24', '24h of Spa', 'spa_francorchamps', 1440, JSON.stringify(['GT3']));

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

  console.log('Database seeded successfully');
}
