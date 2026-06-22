import { DriverProfile, StintPlanItem } from '../models/race-strategy.model';

export function calculateStintLaps(
  driver: DriverProfile | undefined,
  tankCapacity: number,
  globalFuelPerLap: number
): number {
  const consumption = (driver?.fuelPerLapL) ?? globalFuelPerLap;
  return consumption > 0 && tankCapacity > 0 ? Math.floor(tankCapacity / consumption) : 0;
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
  pitStopTiresMs: number
): StintPlanItem[] {
  let currentTimeMs = 0;
  const driverMap = new Map(drivers.map(d => [d.id, d]));

  return stints.map(stint => {
    const driver = driverMap.get(stint.driverId);
    const laps = calculateStintLaps(driver, tankCapacity, globalFuelPerLap);
    const duration = calculateStintDuration(laps, driver, globalAvgLapTime);
    const pitBaseTime = stint.changeTires ? pitStopTiresMs : pitStopFuelOnlyMs;
    const totalPitTime = pitBaseTime + (stint.additionalTimeMs || 0);

    const updated = {
      ...stint,
      startTimeMs: currentTimeMs,
      endTimeMs: currentTimeMs + duration,
      laps,
    };

    currentTimeMs = updated.endTimeMs + totalPitTime;
    return updated;
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
