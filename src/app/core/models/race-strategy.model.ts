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
  eventId: string;
  vehicleId: string;
  stints: StintPlanItem[];
  pitStopTimeMs: number;
}
