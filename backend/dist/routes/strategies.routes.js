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
const strategyService = __importStar(require("../services/strategy.service"));
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.get('/', (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    res.json(strategyService.getAllStrategies(page, limit));
});
router.get('/:id', (req, res) => {
    const id = req.params.id;
    const strategy = strategyService.getStrategyById(id);
    if (!strategy) {
        res.status(404).json({ error: 'Strategy not found' });
        return;
    }
    res.json(strategy);
});
router.post('/', (req, res) => {
    const { name, eventId, vehicleId, avgLapTimeMs, fuelPerLap } = req.body;
    if (!name || !eventId || !vehicleId) {
        res.status(400).json({ error: 'name, eventId, and vehicleId are required' });
        return;
    }
    const strategy = strategyService.createStrategy({ name, eventId, vehicleId, avgLapTimeMs: avgLapTimeMs || 0, fuelPerLap: fuelPerLap || 0 });
    if (!strategy) {
        res.status(400).json({ error: 'Invalid eventId or vehicleId' });
        return;
    }
    res.status(201).json(strategy);
});
router.put('/:id', (req, res) => {
    const id = req.params.id;
    const updated = strategyService.updateStrategy(id, req.body);
    if (!updated) {
        res.status(404).json({ error: 'Strategy not found' });
        return;
    }
    res.json(strategyService.getStrategyById(id));
});
router.delete('/:id', (req, res) => {
    const id = req.params.id;
    const deleted = strategyService.deleteStrategy(id);
    if (!deleted) {
        res.status(404).json({ error: 'Strategy not found' });
        return;
    }
    res.status(204).send();
});
router.put('/:id/stints', (req, res) => {
    const id = req.params.id;
    const { stints } = req.body;
    if (!Array.isArray(stints)) {
        res.status(400).json({ error: 'stints array is required' });
        return;
    }
    const updated = strategyService.updateStints(id, stints);
    if (!updated) {
        res.status(404).json({ error: 'Strategy not found' });
        return;
    }
    res.json(strategyService.getStrategyById(id));
});
router.put('/:id/drivers', (req, res) => {
    const id = req.params.id;
    const { drivers } = req.body;
    if (!Array.isArray(drivers)) {
        res.status(400).json({ error: 'drivers array is required' });
        return;
    }
    const updated = strategyService.updateDrivers(id, drivers);
    if (!updated) {
        res.status(404).json({ error: 'Strategy not found' });
        return;
    }
    res.json(strategyService.getStrategyById(id));
});
exports.default = router;
//# sourceMappingURL=strategies.routes.js.map