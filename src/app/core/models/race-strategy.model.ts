export enum WeatherCondition {
  DRY = 'DRY',
  DAMP = 'DAMP',
  WET = 'WET'
}

export enum TireType {
  SLICK = 'SLICK',
  RAIN = 'RAIN'
}

export interface IRacingEvent {
  id: string;
  name: string;
  trackId: string;
  durationMinutes: number;
  allowedCarClasses: string[];
}

export interface Vehicle {
  id: string;
  name: string;
  fuelTankCapacityL: number;
  refuelRateLS: number;
  vehicleClass: string;
  eventId?: string;
}

export interface DriverProfile {
  id: string;
  name: string;
  accentColor: string;
  avgLapTimeMs: number;
  fuelPerLapL?: number; // Optional: falls back to global if null
  errorFactor: number;
  // Team roster metadata (optional)
  licenseClass?: 'A' | 'B' | 'C' | 'D' | 'Pro' | 'Pro/Am';
  iRating?: number;
  nationality?: string;
  role?: 'Primary' | 'Reserve' | 'Coach';
}

export interface StintPlanItem {
  index: number;
  driverId: string;
  startTimeMs: number;
  endTimeMs: number;
  laps: number;
  changeTires?: boolean;
  additionalTimeMs?: number;
  isCompleted?: boolean;
  actualEndTimeMs?: number;
}

export interface RaceStrategy {
  id: string;
  name: string;
  eventId: string;
  vehicleId: string;
  vehicleName: string;
  avgLapTimeMs: number;
  fuelPerLap: number;
  drivers: DriverProfile[];
  stints: StintPlanItem[];
  pitStopFuelOnlyMs: number;
  pitStopTiresMs: number;
  lastModified: number;
  eventStartTime: number;
}

export interface StrategySummary {
  id: string;
  name: string;
  vehicleId: string;
  vehicleName: string;
  stintCount: number;
  driverCount: number;
  lastModified: number;
}

export interface CarTelemetry {
  speed: number;
  rpm: number;
  gear: number;
  fuelLevel?: number;
  fuelLevelPct?: number;
}

export interface LapTelemetry {
  currentLap: number;
  lapTimeCurrent: number;
  distancePercentage: number;
  lastLapTime?: number;
  trackTemp?: number;
  airTemp?: number;
}

export interface TelemetryPacket {
  timestamp: number;
  car: CarTelemetry;
  lapDetails: LapTelemetry;
}

export enum TelemetryConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
}

export interface PitStopDetection {
  inPit: boolean;
  enteredAt: number | null;
  exitedAt: number | null;
  durationMs: number;
}
