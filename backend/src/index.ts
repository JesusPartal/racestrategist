import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './db';
import { errorHandler } from './middleware/error';
import authRoutes from './routes/auth.routes';
import strategiesRoutes from './routes/strategies.routes';
import catalogRoutes from './routes/catalog.routes';
import teamRoutes from './routes/team.routes';
import iracingRoutes from './routes/iracing.routes';
import adminRoutes from './routes/admin.routes';
import { seedData } from './seed';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initializeDatabase();

// Seed data
seedData();

// Middleware
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
app.use('/api/iracing', iracingRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`RaceStrategist API running on http://localhost:${PORT}`);
});

export default app;
