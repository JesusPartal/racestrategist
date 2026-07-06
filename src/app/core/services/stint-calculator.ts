import { DriverProfile, StintPlanItem } from '../models/race-strategy.model';

export function calculateStintLaps(
  driver: DriverProfile | undefined,
  tankCapacity: number,
  globalFuelPerLap: number,
  fuelAddedL?: number
): number {
  const consumption = driver?.fuelPerLapL || globalFuelPerLap;
  const fuel = (fuelAddedL != null && fuelAddedL > 0) ? fuelAddedL : tankCapacity;
  return consumption > 0 && fuel > 0 ? Math.floor(fuel / consumption) : 0;
}

export function calculateStintDuration(laps: number, driver: DriverProfile | undefined, globalAvgLapTime: number): number {
  const lapTime = driver?.avgLapTimeMs || globalAvgLapTime;
  return laps * lapTime;
}

export function recalculateTimeline(
  stints: StintPlanItem[],
  drivers: DriverProfile[],
  globalFuelPerLap: number,
  globalAvgLapTime: number,
  tankCapacity: number,
  pitStopFuelOnlyMs: number,
  pitStopTiresMs: number,
  eventDurationMs?: number
): StintPlanItem[] {
  let currentTimeMs = 0;
  const driverMap = new Map(drivers.map(d => [d.id, d]));

  return stints.map((stint, idx) => {
    const driver = driverMap.get(stint.driverId);
    let laps = calculateStintLaps(driver, tankCapacity, globalFuelPerLap, stint.fuelAddedL);
    let duration = calculateStintDuration(laps, driver, globalAvgLapTime);
    const pitBaseTime = stint.changeTires ? pitStopTiresMs : pitStopFuelOnlyMs;
    const totalPitTime = pitBaseTime + (stint.additionalTimeMs || 0);

    let endTimeMs: number;
    if (stint.manualEndTimeMs != null) {
      endTimeMs = stint.manualEndTimeMs;
    } else {
      let calculatedEnd = currentTimeMs + duration;
      if (eventDurationMs && idx === stints.length - 1 && calculatedEnd > eventDurationMs) {
        if (currentTimeMs >= eventDurationMs) {
          laps = 0;
          duration = 0;
          calculatedEnd = currentTimeMs;
        } else {
          const remainingMs = eventDurationMs - currentTimeMs;
          const adjustedLaps = Math.max(1, Math.floor(remainingMs / globalAvgLapTime));
          laps = adjustedLaps;
          duration = calculateStintDuration(laps, driver, globalAvgLapTime);
          calculatedEnd = currentTimeMs + duration;
        }
      }
      endTimeMs = calculatedEnd;
    }

    currentTimeMs = endTimeMs + totalPitTime;
    return { ...stint, startTimeMs: currentTimeMs - totalPitTime, endTimeMs, laps };
  });
}

export function generateEmptyStints(count: number, lapsPerStint: number): StintPlanItem[] {
  const stints: StintPlanItem[] = [];
  for (let i = 0; i < count; i++) {
    stints.push({
      index: i + 1,
      driverId: '',
      startTimeMs: 0,
      endTimeMs: 0,
      laps: lapsPerStint,
      changeTires: false,
      additionalTimeMs: 0,
    });
  }
  return stints;
}

export function updateStintFields(stints: StintPlanItem[], stintIndex: number, updates: Partial<StintPlanItem>): StintPlanItem[] {
  return stints.map(s => s.index === stintIndex ? { ...s, ...updates } : s);
}

export function reorderStints(stints: StintPlanItem[], previousIndex: number, currentIndex: number): StintPlanItem[] {
  const newStints = [...stints];
  const item = newStints.splice(previousIndex, 1)[0];
  newStints.splice(currentIndex, 0, item);
  return newStints.map((s, i) => ({ ...s, index: i + 1 }));
}

export function insertStintAt(stints: StintPlanItem[], atIndex: number): StintPlanItem[] {
  const newStints = [...stints];
  const clampedIndex = Math.max(0, Math.min(atIndex, newStints.length));
  const newItem: StintPlanItem = {
    index: 0,
    driverId: '',
    startTimeMs: 0,
    endTimeMs: 0,
    laps: 0,
    changeTires: false,
    additionalTimeMs: 0,
    manualEndTimeMs: null,
  };
  newStints.splice(clampedIndex, 0, newItem);
  return newStints.map((s, i) => ({ ...s, index: i + 1 }));
}

export function removeStintAtPosition(stints: StintPlanItem[], atIndex: number): StintPlanItem[] {
  const newStints = [...stints];
  if (atIndex < 0 || atIndex >= newStints.length) return newStints;
  newStints.splice(atIndex, 1);
  return newStints.map((s, i) => ({ ...s, index: i + 1 }));
}

export function calculateStintCount(
  eventDurationMs: number,
  stintMs: number,
  avgPitMs: number,
  maxLapsPerStint: number
): number {
  const cycleMs = stintMs + avgPitMs;
  const fullCycles = Math.floor(eventDurationMs / cycleMs);
  const remainingMs = eventDurationMs - fullCycles * cycleMs;
  const remainingLaps = Math.floor(remainingMs / (stintMs / maxLapsPerStint));
  return remainingLaps > 0 ? fullCycles + 1 : fullCycles;
}

export function removeTrailingEmptyStints(stints: StintPlanItem[]): StintPlanItem[] {
  let i = stints.length - 1;
  while (i >= 0 && stints[i].laps <= 0) {
    i--;
  }
  return stints.slice(0, i + 1).map((s, idx) => ({ ...s, index: idx + 1 }));
}
