"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEvents = getEvents;
exports.getVehicles = getVehicles;
const db_1 = __importDefault(require("../db"));
function getEvents() {
    const rows = db_1.default.prepare('SELECT * FROM events').all();
    return rows.map(r => ({
        id: r.id,
        name: r.name,
        trackId: r.track_id,
        durationMinutes: r.duration_minutes,
        allowedCarClasses: JSON.parse(r.allowed_car_classes || '[]'),
    }));
}
function getVehicles(eventId) {
    let rows;
    if (eventId) {
        const ev = db_1.default.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
        if (ev) {
            const allowed = JSON.parse(ev.allowed_car_classes || '[]');
            if (allowed.length > 0) {
                const placeholders = allowed.map(() => '?').join(',');
                rows = db_1.default.prepare(`SELECT * FROM vehicles WHERE vehicle_class IN (${placeholders})`).all(...allowed);
            }
            else {
                rows = db_1.default.prepare('SELECT * FROM vehicles').all();
            }
        }
        else {
            rows = db_1.default.prepare('SELECT * FROM vehicles').all();
        }
    }
    else {
        rows = db_1.default.prepare('SELECT * FROM vehicles').all();
    }
    return rows.map(r => ({
        id: r.id,
        name: r.name,
        fuelTankCapacityL: r.fuel_tank_capacity_l,
        refuelRateLS: r.refuel_rate_ls,
        vehicleClass: r.vehicle_class,
    }));
}
//# sourceMappingURL=catalog.service.js.map