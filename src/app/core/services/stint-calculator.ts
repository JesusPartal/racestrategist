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
  eventDurationMs?: number,
  fromIndex = 0
): StintPlanItem[] {
  const driverMap = new Map(drivers.map(d => [d.id, d]));
  let currentTimeMs = fromIndex > 0 ? stints[fromIndex - 1].endTimeMs + getPitTime(stints[fromIndex - 1], pitStopFuelOnlyMs, pitStopTiresMs) : 0;

  return stints.map((stint, idx) => {
    if (idx < fromIndex) return stint;

    const driver = driverMap.get(stint.driverId);
    let laps = calculateStintLaps(driver, tankCapacity, globalFuelPerLap, stint.fuelAddedL);
    let duration = calculateStintDuration(laps, driver, globalAvgLapTime);
    const totalPitTime = getPitTime(stint, pitStopFuelOnlyMs, pitStopTiresMs);
    const startTimeMs = currentTimeMs;

    let endTimeMs: number;
    if (stint.manualEndTimeMs != null) {
      endTimeMs = stint.manualEndTimeMs;
    } else {
      let calculatedEnd = startTimeMs + duration;
      if (eventDurationMs && idx === stints.length - 1) {
        const remainingMs = eventDurationMs - startTimeMs;
        if (remainingMs <= 0) {
          laps = 0;
          duration = 0;
          calculatedEnd = startTimeMs;
        } else {
          const maxFuelLaps = calculateStintLaps(driver, tankCapacity, globalFuelPerLap, undefined);
          const bestLaps = Math.max(1, Math.round(remainingMs / globalAvgLapTime));
          laps = Math.min(bestLaps, maxFuelLaps);
          duration = calculateStintDuration(laps, driver, globalAvgLapTime);
          calculatedEnd = startTimeMs + duration;
        }
      }
      endTimeMs = calculatedEnd;
    }

    currentTimeMs = endTimeMs + totalPitTime;
    return { ...stint, startTimeMs, endTimeMs, laps };
  });
}

function getPitTime(stint: StintPlanItem, pitStopFuelOnlyMs: number, pitStopTiresMs: number): number {
  const pitBaseTime = stint.changeTires ? pitStopTiresMs : pitStopFuelOnlyMs;
  return pitBaseTime + (stint.additionalTimeMs || 0);
}

export function calculateDefaultLastStintFuel(
  stintStartMs: number,
  eventDurationMs: number,
  lapTimeMs: number,
  consumptionPerLap: number,
  tankCapacity: number,
  actualLaps?: number
): number {
  const baseLaps = actualLaps ?? Math.ceil((eventDurationMs - stintStartMs) / lapTimeMs);
  const totalLaps = baseLaps + 1;
  const fuel = Math.ceil(totalLaps * consumptionPerLap);
  return Math.min(fuel, tankCapacity);
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
