import db from '../db';
import { IRacingEvent, Vehicle } from '../models/types';

export function getEvents(): IRacingEvent[] {
  const rows = db.prepare('SELECT * FROM events').all() as any[];
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    trackId: r.track_id,
    durationMinutes: r.duration_minutes,
    allowedCarClasses: JSON.parse(r.allowed_car_classes || '[]'),
  }));
}

export function getVehicles(eventId?: string): Vehicle[] {
  let rows: any[];
  if (eventId) {
    const ev = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId) as any;
    if (ev) {
      const allowed: string[] = JSON.parse(ev.allowed_car_classes || '[]');
      if (allowed.length > 0) {
        const placeholders = allowed.map(() => '?').join(',');
        rows = db.prepare(`SELECT * FROM vehicles WHERE vehicle_class IN (${placeholders})`).all(...allowed) as any[];
      } else {
        rows = db.prepare('SELECT * FROM vehicles').all() as any[];
      }
    } else {
      rows = db.prepare('SELECT * FROM vehicles').all() as any[];
    }
  } else {
    rows = db.prepare('SELECT * FROM vehicles').all() as any[];
  }

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    fuelTankCapacityL: r.fuel_tank_capacity_l,
    refuelRateLS: r.refuel_rate_ls,
    vehicleClass: r.vehicle_class,
  }));
}
