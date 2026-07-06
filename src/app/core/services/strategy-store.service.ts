import { Injectable, signal } from '@angular/core';
import { RaceStrategy, DriverProfile, StintPlanItem, StrategySummary } from '../models/race-strategy.model';
import { generateEmptyStints, recalculateTimeline, updateStintFields, reorderStints, insertStintAt, removeStintAtPosition, removeTrailingEmptyStints, calculateDefaultLastStintFuel } from './stint-calculator';

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
  activeEventDurationMinutes = signal<number>(0);
  activeVehicleName = signal<string>('');
  activeTankCapacity = signal<number>(0);
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
    this.activeEventDurationMinutes.set(0);
    this.activeVehicleName.set('');
    this.activeTankCapacity.set(0);
    this.drivers.set([]);
    this.stintPlan.set([]);
    this.pitStopFuelOnlyMs.set(45000);
    this.pitStopTiresMs.set(65000);
  }

  generateEmptyStints(count: number, lapsPerStint: number) {
    this.stintPlan.set(generateEmptyStints(count, lapsPerStint));
  }

  recalculateTimeline(globalFuelPerLap: number, globalAvgLapTime: number, tankCapacity: number, drivers?: DriverProfile[], fromIndex = 0) {
    const eventDurationMs = this.activeEventDurationMinutes() * 60 * 1000;
    this.stintPlan.update(stints => {
      const updated = recalculateTimeline(
        stints, drivers ?? this.drivers(), globalFuelPerLap, globalAvgLapTime, tankCapacity,
        this.pitStopFuelOnlyMs(), this.pitStopTiresMs(), eventDurationMs, fromIndex
      );
      return removeTrailingEmptyStints(updated);
    });
  }

  updateStintFuel(stintIndex: number, fuelL: number | null, globalFuelPerLap: number, globalAvgLapTime: number, tankCapacity: number) {
    this.updateStintFields(stintIndex, { fuelAddedL: fuelL ?? undefined });
    this.recalculateTimeline(globalFuelPerLap, globalAvgLapTime, tankCapacity, undefined, stintIndex);
  }

  applyDefaultLastStintFuel(globalFuelPerLap: number, globalAvgLapTime: number, tankCapacity: number) {
    const eventDurationMs = this.activeEventDurationMinutes() * 60 * 1000;
    if (!eventDurationMs) return;
    this.stintPlan.update(stints => {
      if (stints.length === 0) return stints;
      const last = stints[stints.length - 1];
      const fuel = calculateDefaultLastStintFuel(
        last.startTimeMs, eventDurationMs, globalAvgLapTime, globalFuelPerLap, tankCapacity
      );
      return stints.map((s, idx) =>
        idx === stints.length - 1 ? { ...s, fuelAddedL: fuel || undefined } : s
      );
    });
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

  insertStint(atIndex: number) {
    this.stintPlan.update(stints => insertStintAt(stints, atIndex));
  }

  removeStintAtPosition(atIndex: number) {
    this.stintPlan.update(stints => removeStintAtPosition(stints, atIndex));
  }

  applyLoadedStrategy(data: RaceStrategy) {
    this.activeStrategyId.set(data.id);
    this.activeStrategyName.set(data.name);
    this.activeEventId.set(data.eventId);
    this.activeVehicleId.set(data.vehicleId);
    this.activeAvgLapTimeMs.set(data.avgLapTimeMs);
    this.activeFuelPerLap.set(data.fuelPerLap);
    this.activeEventStartTime.set(data.eventStartTime || 0);
    this.activeEventDurationMinutes.set(data.eventDurationMinutes || 0);
    this.activeVehicleName.set(data.vehicleName || '');
    this.activeTankCapacity.set(data.tankCapacity || 0);
    this.drivers.set(data.drivers || []);
    this.stintPlan.set(data.stints || []);
    this.pitStopFuelOnlyMs.set(data.pitStopFuelOnlyMs);
    this.pitStopTiresMs.set(data.pitStopTiresMs);
  }

  markStintCompleted(stintIndex: number): void {
    this.stintPlan.update(stints =>
      stints.map(s =>
        s.index === stintIndex ? { ...s, isCompleted: true } : s
      )
    );
  }

  markStintIncomplete(stintIndex: number): void {
    this.stintPlan.update(stints =>
      stints.map(s =>
        s.index === stintIndex ? { ...s, isCompleted: false } : s
      )
    );
  }

  autoCompleteStints(eventStartTime: number): number {
    const now = Date.now();
    const elapsedMs = now - eventStartTime;
    let lastCompleted = -1;

    this.stintPlan.update(stints =>
      stints.map(s => {
        if (!s.isCompleted && elapsedMs >= s.endTimeMs) {
          lastCompleted = s.index;
          return { ...s, isCompleted: true };
        }
        return s;
      })
    );

    return lastCompleted;
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
