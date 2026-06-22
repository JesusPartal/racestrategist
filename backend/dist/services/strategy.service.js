"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllStrategies = getAllStrategies;
exports.getStrategyById = getStrategyById;
exports.createStrategy = createStrategy;
exports.updateStrategy = updateStrategy;
exports.updateStints = updateStints;
exports.updateDrivers = updateDrivers;
exports.deleteStrategy = deleteStrategy;
const db_1 = __importDefault(require("../db"));
const uuid_1 = require("uuid");
const STRATEGY_COLS = 'id, name, event_id, vehicle_id, vehicle_name, avg_lap_time_ms, fuel_per_lap, pit_stop_fuel_only_ms, pit_stop_tires_ms, last_modified';
function rowToStrategy(row) {
    return {
        id: row.id,
        name: row.name,
        eventId: row.event_id,
        vehicleId: row.vehicle_id,
        vehicleName: row.vehicle_name,
        avgLapTimeMs: row.avg_lap_time_ms,
        fuelPerLap: row.fuel_per_lap,
        pitStopFuelOnlyMs: row.pit_stop_fuel_only_ms,
        pitStopTiresMs: row.pit_stop_tires_ms,
        lastModified: row.last_modified,
        drivers: JSON.parse(row.drivers || '[]'),
        stints: JSON.parse(row.stints || '[]'),
    };
}
const SUMMARY_COLS = 'id, name, event_id, vehicle_id, vehicle_name, COALESCE(json_array_length(drivers), 0) as driver_count, COALESCE(json_array_length(stints), 0) as stint_count, last_modified';
function getAllStrategies(page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const rows = db_1.default.prepare(`SELECT ${SUMMARY_COLS} FROM strategies ORDER BY last_modified DESC LIMIT ? OFFSET ?`).all(limit, offset);
    return rows.map(r => ({
        id: r.id,
        name: r.name,
        vehicleId: r.vehicle_id,
        vehicleName: r.vehicle_name,
        stintCount: r.stint_count,
        driverCount: r.driver_count,
        lastModified: r.last_modified,
    }));
}
function getStrategyById(id) {
    const row = db_1.default.prepare(`SELECT ${STRATEGY_COLS}, drivers, stints FROM strategies WHERE id = ?`).get(id);
    if (!row)
        return null;
    return rowToStrategy(row);
}
function createStrategy(req) {
    const eventExists = db_1.default.prepare('SELECT id FROM events WHERE id = ?').get(req.eventId);
    if (!eventExists)
        return null;
    const vehicleExists = db_1.default.prepare('SELECT id FROM vehicles WHERE id = ?').get(req.vehicleId);
    if (!vehicleExists)
        return null;
    const id = (0, uuid_1.v4)().replace(/-/g, '').slice(0, 12);
    const now = Date.now();
    db_1.default.prepare(`INSERT INTO strategies (id, name, event_id, vehicle_id, vehicle_name, avg_lap_time_ms, fuel_per_lap, last_modified, drivers, stints)
    VALUES (?, ?, ?, ?, '', ?, ?, ?, '[]', '[]')`).run(id, req.name, req.eventId, req.vehicleId, req.avgLapTimeMs, req.fuelPerLap, now);
    return getStrategyById(id);
}
function updateStrategy(id, req) {
    const existing = db_1.default.prepare('SELECT id FROM strategies WHERE id = ?').get(id);
    if (!existing)
        return false;
    const fields = [];
    const values = [];
    if (req.name !== undefined) {
        fields.push('name = ?');
        values.push(req.name);
    }
    if (req.eventId !== undefined) {
        fields.push('event_id = ?');
        values.push(req.eventId);
    }
    if (req.vehicleId !== undefined) {
        fields.push('vehicle_id = ?');
        values.push(req.vehicleId);
    }
    if (req.vehicleName !== undefined) {
        fields.push('vehicle_name = ?');
        values.push(req.vehicleName);
    }
    if (req.avgLapTimeMs !== undefined) {
        fields.push('avg_lap_time_ms = ?');
        values.push(req.avgLapTimeMs);
    }
    if (req.fuelPerLap !== undefined) {
        fields.push('fuel_per_lap = ?');
        values.push(req.fuelPerLap);
    }
    if (req.pitStopFuelOnlyMs !== undefined) {
        fields.push('pit_stop_fuel_only_ms = ?');
        values.push(req.pitStopFuelOnlyMs);
    }
    if (req.pitStopTiresMs !== undefined) {
        fields.push('pit_stop_tires_ms = ?');
        values.push(req.pitStopTiresMs);
    }
    fields.push('last_modified = ?');
    values.push(Date.now());
    values.push(id);
    db_1.default.prepare(`UPDATE strategies SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return true;
}
function updateStints(strategyId, stints) {
    const existing = db_1.default.prepare('SELECT id FROM strategies WHERE id = ?').get(strategyId);
    if (!existing)
        return false;
    db_1.default.prepare('UPDATE strategies SET stints = ?, last_modified = ? WHERE id = ?').run(JSON.stringify(stints), Date.now(), strategyId);
    return true;
}
function updateDrivers(strategyId, drivers) {
    const existing = db_1.default.prepare('SELECT id FROM strategies WHERE id = ?').get(strategyId);
    if (!existing)
        return false;
    db_1.default.prepare('UPDATE strategies SET drivers = ?, last_modified = ? WHERE id = ?').run(JSON.stringify(drivers), Date.now(), strategyId);
    return true;
}
function deleteStrategy(id) {
    const existing = db_1.default.prepare('SELECT id FROM strategies WHERE id = ?').get(id);
    if (!existing)
        return false;
    db_1.default.prepare('DELETE FROM strategies WHERE id = ?').run(id);
    return true;
}
//# sourceMappingURL=strategy.service.js.map