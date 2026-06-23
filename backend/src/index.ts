import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';
import { initializeDatabase } from './db';
import { errorHandler } from './middleware/error';
import authRoutes from './routes/auth.routes';
import strategiesRoutes from './routes/strategies.routes';
import catalogRoutes from './routes/catalog.routes';
import teamRoutes from './routes/team.routes';
import teamsRoutes from './routes/teams.routes';
import adminRoutes from './routes/admin.routes';
import telemetryRoutes from './routes/telemetry.routes';
import { seedData } from './seed';
import { TelemetryRelayService } from './services/telemetry-relay.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initializeDatabase();

// Seed data
seedData();

// Create shared HTTP server (Express + WebSocket on same port)
const server = http.createServer(app);

// Telemetry WebSocket relay (multi-PC support)
let telemetryRelay: TelemetryRelayService | null = null;
if (process.env.TELEMETRY_RELAY !== 'false') {
  telemetryRelay = new TelemetryRelayService(server);
  console.log('Telemetry relay enabled (ws://.../ws/telemetry/live)');
}
app.set('telemetryRelay', telemetryRelay);

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,   // CSP handled by frontend server
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:4200'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/strategies', strategiesRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/telemetry', telemetryRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Telemetry relay info endpoint
app.get('/api/telemetry/agents', (_req, res) => {
  if (!telemetryRelay) {
    res.json({ enabled: false, agents: [] });
    return;
  }
  res.json({ enabled: true, agents: telemetryRelay.getConnectedDrivers() });
});

// Error handler
app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`RaceStrategist API running on http://localhost:${PORT}`);
});

export default app;
