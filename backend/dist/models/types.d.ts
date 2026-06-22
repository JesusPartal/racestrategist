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
//# sourceMappingURL=types.d.ts.map