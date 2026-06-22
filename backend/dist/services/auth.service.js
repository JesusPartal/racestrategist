"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.getUserById = getUserById;
const fs_1 = __importDefault(require("fs"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../db"));
const auth_1 = require("../middleware/auth");
function login(req) {
    fs_1.default.writeFileSync('/tmp/opencode/auth_debug.log', `username: ${req.username}\npassword: ${req.password}\ndb prepared\n`, { flag: 'w' });
    const row = db_1.default.prepare('SELECT * FROM users WHERE username = ?').get(req.username);
    if (!row) {
        fs_1.default.appendFileSync('/tmp/opencode/auth_debug.log', 'row is null\n');
        return null;
    }
    fs_1.default.appendFileSync('/tmp/opencode/auth_debug.log', `row keys: ${Object.keys(row)}\npassword_hash: ${row.password_hash}\n`);
    const valid = bcryptjs_1.default.compareSync(req.password, row.password_hash);
    if (!valid)
        return null;
    const token = (0, auth_1.generateToken)(row.id, row.username);
    return { token, displayName: row.displayName, licenseClass: row.licenseClass, iRating: row.iRating, userId: row.id };
}
function getUserById(userId) {
    const row = db_1.default.prepare('SELECT id, username, display_name, license_class, i_rating FROM users WHERE id = ?').get(userId);
    if (!row)
        return null;
    return {
        id: row.id,
        username: row.username,
        displayName: row.display_name,
        licenseClass: row.license_class,
        iRating: row.i_rating,
    };
}
//# sourceMappingURL=auth.service.js.map