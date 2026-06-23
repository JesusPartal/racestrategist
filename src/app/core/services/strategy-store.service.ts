import { Injectable, signal } from '@angular/core';
import { RaceStrategy, DriverProfile, StintPlanItem, StrategySummary } from '../models/race-strategy.model';
import { generateEmptyStints, recalculateTimeline, updateStintFields, reorderStints } from './stint-calculator';

@Injectable({ providedIn: 'root' })
export class StrategyStore {
  drivers = signal<DriverProfile[]>([]);
  stintPlan = signal<StintPlanItem[]>([]);
  activeStrategyId = signal<string | null>(null);
  activeStrategyName = signal<string>('New Strategy');
  activeEventId = signal<string>('');
  activeVehicleId = signal<string>('');
  activeAvgLapTimeMs = signal<number>(0);
  activeFuelPerLap = signal<number>(0);
  activeEventStartTime = signal<number>(0);
  pitStopFuelOnlyMs = signal<number>(45000);
  pitStopTiresMs = signal<number>(65000);
  savedStrategies = signal<StrategySummary[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  getDriverById(id: string): DriverProfile | undefined {
    return this.drivers().find(d => d.id === id);
  }

  clearActive() {
    this.activeStrategyId.set(null);
    this.activeStrategyName.set('New Strategy');
    this.activeEventId.set('');
    this.activeVehicleId.set('');
    this.activeAvgLapTimeMs.set(0);
    this.activeFuelPerLap.set(0);
    this.activeEventStartTime.set(0);
    this.drivers.set([]);
    this.stintPlan.set([]);
    this.pitStopFuelOnlyMs.set(45000);
    this.pitStopTiresMs.set(65000);
  }

  generateEmptyStints(count: number, lapsPerStint: number) {
    this.stintPlan.set(generateEmptyStints(count, lapsPerStint));
  }

  recalculateTimeline(globalFuelPerLap: number, globalAvgLapTime: number, tankCapacity: number) {
    this.stintPlan.update(stints =>
      recalculateTimeline(
        stints, this.drivers(), globalFuelPerLap, globalAvgLapTime, tankCapacity,
        this.pitStopFuelOnlyMs(), this.pitStopTiresMs()
      )
    );
  }

  updateStintFields(stintIndex: number, updates: Partial<StintPlanItem>) {
    this.stintPlan.update(stints => updateStintFields(stints, stintIndex, updates));
  }

  updateStintDriver(stintIndex: number, driverId: string) {
    this.updateStintFields(stintIndex, { driverId });
  }

  reorderStints(previousIndex: number, currentIndex: number) {
    this.stintPlan.update(stints => reorderStints(stints, previousIndex, currentIndex));
  }

  applyLoadedStrategy(data: RaceStrategy) {
    this.activeStrategyId.set(data.id);
    this.activeStrategyName.set(data.name);
    this.activeEventId.set(data.eventId);
    this.activeVehicleId.set(data.vehicleId);
    this.activeAvgLapTimeMs.set(data.avgLapTimeMs);
    this.activeFuelPerLap.set(data.fuelPerLap);
    this.activeEventStartTime.set(data.eventStartTime || 0);
    this.drivers.set(data.drivers || []);
    this.stintPlan.set(data.stints || []);
    this.pitStopFuelOnlyMs.set(data.pitStopFuelOnlyMs);
    this.pitStopTiresMs.set(data.pitStopTiresMs);
  }

  markStintCompleted(stintIndex: number, actualTimeMs: number): void {
    this.stintPlan.update(stints =>
      stints.map(s =>
        s.index === stintIndex ? { ...s, endTimeMs: actualTimeMs, isCompleted: true } : s
      )
    );
  }

  applyRealFuelData(actualFuelPerLap: number, tankCapacity: number): void {
    this.activeFuelPerLap.set(actualFuelPerLap);
    this.recalculateTimeline(this.activeFuelPerLap(), this.activeAvgLapTimeMs(), tankCapacity);
  }

  applyRealPaceData(actualAvgLapTimeMs: number, tankCapacity: number): void {
    this.activeAvgLapTimeMs.set(actualAvgLapTimeMs);
    this.recalculateTimeline(this.activeFuelPerLap(), this.activeAvgLapTimeMs(), tankCapacity);
  }

  recalculateRemainingStints(currentLap: number, tankCapacity: number): void {
    const stints = this.stintPlan();
    let lapsAccounted = 0;

    const updated = stints.map(s => {
      const stintStartLap = lapsAccounted + 1;
      lapsAccounted += s.laps;
      if (currentLap > stintStartLap) {
        return { ...s, isCompleted: true };
      }
      return s;
    });

    this.stintPlan.set(updated);
    this.recalculateTimeline(this.activeFuelPerLap(), this.activeAvgLapTimeMs(), tankCapacity);
  }

  applyRealPitTime(fuelOnlyMs: number, tiresMs: number): void {
    this.pitStopFuelOnlyMs.set(fuelOnlyMs);
    this.pitStopTiresMs.set(tiresMs);
  }
}
