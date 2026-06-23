export interface StintPlanItem {
  index: number;
  driverId: string;
  startTimeMs: number;
  endTimeMs: number;
  laps: number;
  isCompleted: boolean;
  changeTires: boolean;
  additionalTimeMs?: number;
}

export interface DriverProfile {
  id: string;
  name: string;
  accentColor: string;
  avgLapTimeMs: number;
  fuelPerLapL?: number;
  errorFactor: number;
  licenseClass?: string;
  iRating?: number;
  nationality?: string;
  role?: string;
}

export interface RaceStrategy {
  id: string;
  name: string;
  eventId: string;
  vehicleId: string;
  vehicleName: string;
  avgLapTimeMs: number;
  fuelPerLap: number;
  pitStopFuelOnlyMs: number;
  pitStopTiresMs: number;
  lastModified: number;
  eventStartTime: number;
  drivers: DriverProfile[];
  stints: StintPlanItem[];
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
}

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  displayName: string;
  licenseClass: string;
  iRating: number;
  teamId: string;
  isAdmin: boolean;
}

export interface TeamDriver {
  id: string;
  name: string;
  accentColor: string;
  avgLapTimeMs: number;
  fuelPerLapL?: number;
  errorFactor: number;
  licenseClass?: string;
  iRating?: number;
  nationality?: string;
  role?: string;
}

// DTOs
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  displayName: string;
  licenseClass: string;
  iRating: number;
  userId: string;
  teamId: string;
  isAdmin: boolean;
}

export interface StrategySummaryDto {
  id: string;
  name: string;
  vehicleId: string;
  vehicleName: string;
  stintCount: number;
  driverCount: number;
  lastModified: number;
}

export interface CreateStrategyRequest {
  name: string;
  eventId: string;
  vehicleId: string;
  avgLapTimeMs: number;
  fuelPerLap: number;
  eventStartTime?: number;
}

export interface UpdateStrategyRequest {
  name?: string;
  eventId?: string;
  vehicleId?: string;
  vehicleName?: string;
  avgLapTimeMs?: number;
  fuelPerLap?: number;
  pitStopFuelOnlyMs?: number;
  pitStopTiresMs?: number;
  eventStartTime?: number;
}

export interface UpdateStintsRequest {
  stints: StintDto[];
}

export interface StintDto {
  index: number;
  driverId: string;
  startTimeMs: number;
  endTimeMs: number;
  laps: number;
  changeTires: boolean;
  additionalTimeMs?: number;
}

export interface AgentToken {
  id: string;
  teamId: string;
  driverId: string;
  driverName: string;
  token: string;
  createdAt: number;
  expiresAt: number;
  lastUsedAt: number | null;
  createdBy: string;
  strategyDriverId: string | null;
}

export interface DriverDto {
  id?: string;
  name: string;
  accentColor: string;
  avgLapTimeMs: number;
  fuelPerLapL?: number;
  errorFactor: number;
  licenseClass?: string;
  iRating?: number;
  nationality?: string;
  role?: string;
}
