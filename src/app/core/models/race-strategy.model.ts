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
  isCompleted: boolean;
  changeTires?: boolean;
  additionalTimeMs?: number;
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
}
