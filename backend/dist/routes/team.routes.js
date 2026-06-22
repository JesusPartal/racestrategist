"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const teamService = __importStar(require("../services/team.service"));
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.get('/settings', (req, res) => {
    res.json(teamService.getSettings());
});
router.put('/settings', (req, res) => {
    const { teamName } = req.body;
    if (!teamService.updateSettings({ teamName })) {
        res.status(500).json({ error: 'Failed to update settings' });
        return;
    }
    res.json(teamService.getSettings());
});
router.get('/drivers', (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    res.json(teamService.getAllDrivers(page, limit));
});
router.post('/drivers', (req, res) => {
    const { name, accentColor, avgLapTimeMs, fuelPerLapL, errorFactor, licenseClass, iRating, nationality, role } = req.body;
    if (!name) {
        res.status(400).json({ error: 'name is required' });
        return;
    }
    const driver = teamService.addDriver({ name, accentColor: accentColor || '#FFB000', avgLapTimeMs: avgLapTimeMs || 0, fuelPerLapL, errorFactor: errorFactor || 0, licenseClass, iRating, nationality, role });
    res.status(201).json(driver);
});
router.put('/drivers/:id', (req, res) => {
    const id = req.params.id;
    const updated = teamService.updateDriver(id, req.body);
    if (!updated) {
        res.status(404).json({ error: 'Driver not found' });
        return;
    }
    res.json(teamService.getAllDrivers().find(d => d.id === id));
});
router.delete('/drivers/:id', (req, res) => {
    const id = req.params.id;
    const deleted = teamService.deleteDriver(id);
    if (!deleted) {
        res.status(404).json({ error: 'Driver not found' });
        return;
    }
    res.status(204).send();
});
exports.default = router;
//# sourceMappingURL=team.routes.js.map