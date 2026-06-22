"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSettings = getSettings;
exports.updateSettings = updateSettings;
exports.getAllDrivers = getAllDrivers;
exports.addDriver = addDriver;
exports.updateDriver = updateDriver;
exports.deleteDriver = deleteDriver;
const db_1 = __importDefault(require("../db"));
const uuid_1 = require("uuid");
function getSettings() {
    const row = db_1.default.prepare('SELECT team_name FROM team_settings WHERE id = ?').get('default');
    return { teamName: row?.team_name || 'My Racing Team' };
}
function updateSettings(updates) {
    const existing = db_1.default.prepare('SELECT id FROM team_settings WHERE id = ?').get('default');
    if (!existing)
        return false;
    if (updates.teamName !== undefined) {
        db_1.default.prepare('UPDATE team_settings SET team_name = ? WHERE id = ?').run(updates.teamName, 'default');
    }
    return true;
}
function rowToDriver(row) {
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
function getAllDrivers(page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    return db_1.default.prepare('SELECT * FROM team_drivers LIMIT ? OFFSET ?').all(limit, offset).map(rowToDriver);
}
function addDriver(dto) {
    const id = dto.id || (0, uuid_1.v4)().replace(/-/g, '').slice(0, 12);
    db_1.default.prepare(`INSERT INTO team_drivers (id, name, accent_color, avg_lap_time_ms, fuel_per_lap_l, error_factor, license_class, i_rating, nationality, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, dto.name, dto.accentColor, dto.avgLapTimeMs, dto.fuelPerLapL ?? null, dto.errorFactor, dto.licenseClass ?? null, dto.iRating ?? null, dto.nationality ?? null, dto.role ?? null);
    return rowToDriver(db_1.default.prepare('SELECT * FROM team_drivers WHERE id = ?').get(id));
}
function updateDriver(id, dto) {
    const existing = db_1.default.prepare('SELECT id FROM team_drivers WHERE id = ?').get(id);
    if (!existing)
        return false;
    db_1.default.prepare(`UPDATE team_drivers SET name = ?, accent_color = ?, avg_lap_time_ms = ?, fuel_per_lap_l = ?, error_factor = ?,
    license_class = ?, i_rating = ?, nationality = ?, role = ? WHERE id = ?`).run(dto.name, dto.accentColor, dto.avgLapTimeMs, dto.fuelPerLapL ?? null, dto.errorFactor, dto.licenseClass ?? null, dto.iRating ?? null, dto.nationality ?? null, dto.role ?? null, id);
    return true;
}
function deleteDriver(id) {
    const existing = db_1.default.prepare('SELECT id FROM team_drivers WHERE id = ?').get(id);
    if (!existing)
        return false;
    db_1.default.prepare('DELETE FROM team_drivers WHERE id = ?').run(id);
    return true;
}
//# sourceMappingURL=team.service.js.map