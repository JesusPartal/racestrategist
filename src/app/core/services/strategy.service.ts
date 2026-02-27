import { Injectable, signal, inject } from '@angular/core';
import { DriverProfile, StintPlanItem, RaceStrategy } from '../models/race-strategy.model';
import { CatalogService } from './catalog.service';

@Injectable({
    providedIn: 'root'
})
export class StrategyService {
    private catalog = inject(CatalogService);

    // Current Team Drivers
    drivers = signal<DriverProfile[]>([]);

    // Stint Plan (Live/Active)
    stintPlan = signal<StintPlanItem[]>([]);
    activeStrategyId = signal<string | null>(null);
    activeStrategyName = signal<string>('New Strategy');
    activeEventId = signal<string>('');
    activeVehicleId = signal<string>('');
    activeAvgLapTimeMs = signal<number>(0);
    activeFuelPerLap = signal<number>(0);

    // Pit stop times (in ms)
    pitStopFuelOnlyMs = signal<number>(45000); // 45s default
    pitStopTiresMs = signal<number>(65000);    // 65s default

    // Strategy Library
    savedStrategies = signal<RaceStrategy[]>([]);

    constructor() {
        this.loadFromStorage();
        if (this.savedStrategies().length === 0) {
            this.generateMockStrategies();
        }
    }

    private loadFromStorage() {
        const saved = localStorage.getItem('rs_saved_strategies');
        if (saved) {
            try {
                this.savedStrategies.set(JSON.parse(saved));
            } catch (e) {
                console.error('Error loading strategies', e);
            }
        }
    }

    private saveToStorage() {
        localStorage.setItem('rs_saved_strategies', JSON.stringify(this.savedStrategies()));
    }

    loadStrategy(id: string) {
        const strategy = this.savedStrategies().find(s => s.id === id);
        if (strategy) {
            this.activeStrategyId.set(strategy.id);
            this.activeStrategyName.set(strategy.name);
            this.activeEventId.set(strategy.eventId);
            this.activeVehicleId.set(strategy.vehicleId);
            this.activeAvgLapTimeMs.set(strategy.avgLapTimeMs);
            this.activeFuelPerLap.set(strategy.fuelPerLap);
            this.drivers.set(strategy.drivers || []);
            this.stintPlan.set(strategy.stints);
            this.pitStopFuelOnlyMs.set(strategy.pitStopFuelOnlyMs);
            this.pitStopTiresMs.set(strategy.pitStopTiresMs);
            return strategy;
        }
        return null;
    }

    clearActive() {
        this.activeStrategyId.set(null);
        this.activeStrategyName.set('New Strategy');
        this.activeEventId.set('');
        this.activeVehicleId.set('');
        this.activeAvgLapTimeMs.set(0);
        this.activeFuelPerLap.set(0);
        this.drivers.set([]);
        this.stintPlan.set([]);
    }

    private generateMockStrategies() {
        const mock: RaceStrategy[] = [
            {
                id: 'strat-1',
                name: '24h Nürburgring - Aggressive',
                eventId: 'event-1',
                vehicleId: 'veh-1',
                vehicleName: 'Porsche 911 GT3 R',
                avgLapTimeMs: 512000, // 8:32
                fuelPerLap: 12.5,
                drivers: [
                    { id: 'd1', name: 'Max Verstappen', accentColor: '#FFB000', avgLapTimeMs: 510000, errorFactor: 0.01 }
                ],
                pitStopFuelOnlyMs: 44000,
                pitStopTiresMs: 62000,
                lastModified: Date.now() - 3600000,
                stints: [
                    { index: 1, driverId: 'd1', startTimeMs: 0, endTimeMs: 3600000, laps: 8, isCompleted: false, changeTires: true },
                    { index: 2, driverId: 'd1', startTimeMs: 3662000, endTimeMs: 7262000, laps: 8, isCompleted: false, changeTires: true }
                ]
            },
            {
                id: 'strat-2',
                name: 'Spa 24h - Fuel Save',
                eventId: 'event-2',
                vehicleId: 'veh-2',
                vehicleName: 'BMW M4 GT3',
                avgLapTimeMs: 140000, // 2:20
                fuelPerLap: 3.8,
                drivers: [
                    { id: 'd2', name: 'Lewis Hamilton', accentColor: '#2979FF', avgLapTimeMs: 139500, errorFactor: 0.01 }
                ],
                pitStopFuelOnlyMs: 48000,
                pitStopTiresMs: 70000,
                lastModified: Date.now() - 86400000,
                stints: [
                    { index: 1, driverId: 'd2', startTimeMs: 0, endTimeMs: 3900000, laps: 9, isCompleted: false, changeTires: false }
                ]
            }
        ];
        this.savedStrategies.set(mock);
        this.saveToStorage();
    }

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

    /** Save the current working state as a new strategy in the library */
    saveCurrentAsNew(id: string, name: string, vehicleId: string) {
        const newStrategy = {
            id,
            name,
            eventId: this.activeEventId(),
            vehicleId: vehicleId,
            vehicleName: vehicleId, // Will be resolved by vehicle name in a real app
            avgLapTimeMs: this.activeAvgLapTimeMs(),
            fuelPerLap: this.activeFuelPerLap(),
            drivers: [...this.drivers()],
            stints: [...this.stintPlan()],
            pitStopFuelOnlyMs: this.pitStopFuelOnlyMs(),
            pitStopTiresMs: this.pitStopTiresMs(),
            lastModified: Date.now()
        };
        this.activeStrategyId.set(id);
        this.activeStrategyName.set(name);
        this.savedStrategies.update(list => [...list, newStrategy]);
        this.saveToStorage();
    }

    /** Update an existing strategy with the current working state */
    updateCurrentStrategy(eventId: string, vehicleId: string, avgLapTimeMs: number, fuelPerLap: number) {
        const id = this.activeStrategyId();
        if (!id) return;
        this.savedStrategies.update(list => list.map(s => {
            if (s.id !== id) return s;
            return {
                ...s,
                eventId,
                vehicleId,
                avgLapTimeMs,
                fuelPerLap,
                drivers: [...this.drivers()],
                stints: [...this.stintPlan()],
                pitStopFuelOnlyMs: this.pitStopFuelOnlyMs(),
                pitStopTiresMs: this.pitStopTiresMs(),
                lastModified: Date.now()
            };
        }));
        this.saveToStorage();
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
