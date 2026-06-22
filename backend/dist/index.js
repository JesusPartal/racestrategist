"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./db");
const error_1 = require("./middleware/error");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const strategies_routes_1 = __importDefault(require("./routes/strategies.routes"));
const catalog_routes_1 = __importDefault(require("./routes/catalog.routes"));
const team_routes_1 = __importDefault(require("./routes/team.routes"));
const seed_1 = require("./seed");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Initialize database
(0, db_1.initializeDatabase)();
// Seed data
(0, seed_1.seedData)();
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:4200'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json());
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/strategies', strategies_routes_1.default);
app.use('/api/catalog', catalog_routes_1.default);
app.use('/api/team', team_routes_1.default);
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});
// Error handler
app.use(error_1.errorHandler);
app.listen(PORT, () => {
    console.log(`RaceStrategist API running on http://localhost:${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map