import { Injectable, signal } from '@angular/core';
import { DriverProfile, StintPlanItem } from '../models/race-strategy.model';

@Injectable({
    providedIn: 'root'
})
export class StrategyService {
    // Current Team Drivers
    drivers = signal<DriverProfile[]>([]);

    // Stint Plan
    stintPlan = signal<StintPlanItem[]>([]);

    // Pit stop times (in ms)
    pitStopFuelOnlyMs = signal<number>(45000); // 45s default
    pitStopTiresMs = signal<number>(65000);    // 65s default

    addDriver(driver: Omit<DriverProfile, 'id'>) {
        const newDriver: DriverProfile = {
            ...driver,
            id: Math.random().toString(36).substring(2, 9)
        };
        this.drivers.update(d => [...d, newDriver]);
    }

    removeDriver(id: string) {
        this.drivers.update(d => d.filter(driver => driver.id !== id));
    }

    updateDriver(id: string, updates: Partial<DriverProfile>) {
        this.drivers.update(drivers => {
            return drivers.map(d => d.id === id ? { ...d, ...updates } : d);
        });
    }

    // Generate initial plan
    generateEmptyStints(count: number, lapsPerStint: number, avgLapTimeMs: number) {
        const stints: StintPlanItem[] = [];

        for (let i = 0; i < count; i++) {
            stints.push({
                index: i + 1,
                driverId: '', // Start unassigned
                startTimeMs: 0, // Will be set by recalculate
                endTimeMs: 0,
                laps: lapsPerStint,
                isCompleted: false,
                changeTires: false,
                additionalTimeMs: 0
            });
        }
        this.stintPlan.set(stints);
    }

    // Ripple effect recalculation
    recalculateTimeline(globalFuelPerLap: number, globalAvgLapTime: number, tankCapacity: number) {
        this.stintPlan.update(stints => {
            let currentTimeMs = 0;
            return stints.map(stint => {
                const driver = this.getDriverById(stint.driverId);

                // Logic: Driver consumption or fallback
                const consumption = (driver && driver.fuelPerLapL) ? driver.fuelPerLapL : globalFuelPerLap;
                const lapTime = (driver && driver.avgLapTimeMs) ? driver.avgLapTimeMs : globalAvgLapTime;

                const laps = consumption > 0 ? Math.floor(tankCapacity / consumption) : 0;
                const duration = laps * lapTime;

                const updatedStint = {
                    ...stint,
                    startTimeMs: currentTimeMs,
                    endTimeMs: currentTimeMs + duration,
                    laps: laps
                };

                // Pit stop duration logic
                const pitBaseTime = stint.changeTires ? this.pitStopTiresMs() : this.pitStopFuelOnlyMs();
                const totalPitTime = pitBaseTime + (stint.additionalTimeMs || 0);

                currentTimeMs = updatedStint.endTimeMs + totalPitTime;
                return updatedStint;
            });
        });
    }

    updateStintFields(stintIndex: number, updates: Partial<StintPlanItem>) {
        this.stintPlan.update(stints => {
            return stints.map(s => s.index === stintIndex ? { ...s, ...updates } : s);
        });
    }

    updateStintDriver(stintIndex: number, driverId: string) {
        this.updateStintFields(stintIndex, { driverId });
    }

    reorderStints(previousIndex: number, currentIndex: number) {
        this.stintPlan.update(stints => {
            const newStints = [...stints];
            const item = newStints.splice(previousIndex, 1)[0];
            newStints.splice(currentIndex, 0, item);
            // Re-index
            return newStints.map((s, i) => ({ ...s, index: i + 1 }));
        });
    }

    getDriverById(id: string): DriverProfile | undefined {
        return this.drivers().find(d => d.id === id);
    }
}
