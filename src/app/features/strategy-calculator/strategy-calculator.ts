import { Component, OnInit, signal, computed, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { CatalogService } from '../../core/services/catalog.service';
import { TranslationService } from '../../core/services/translation.service';
import { StrategyService } from '../../core/services/strategy.service';
import { IRacingEvent, Vehicle, WeatherCondition, TireType, DriverProfile } from '../../core/models/race-strategy.model';

@Component({
  selector: 'app-strategy-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './strategy-calculator.html',
  styleUrl: './strategy-calculator.css'
})
export class StrategyCalculator implements OnInit {
  // Color Palette for Drivers (Racing Accent Colors)
  private readonly colorPalette = [
    '#FFB000', // Racing Amber (Yellow) - Driver 1
    '#2979FF', // Electric Blue - Driver 2
    '#00E676', // Track Green - Driver 3
    '#FF5252', // Red - Driver 4
    '#D1C4E9', // Soft Purple - Driver 5
    '#FF4081', // Pink - Driver 6
    '#00E5FF', // Cyan - Driver 7
    '#FF6E40', // Orange - Driver 8
    '#7C4DFF', // Deep Purple - Driver 9
    '#B2FF59'  // Lime - Driver 10
  ];

  // Catalogs
  events = signal<IRacingEvent[]>([]);
  vehiclesByEvent = signal<Vehicle[]>([]);

  // Selection
  selectedEventId = signal<string>('');
  selectedVehicleId = signal<string>('');

  // Manual Inputs
  fuelPerLap = signal<number>(0);
  lapMin = signal<number>(0);
  lapSec = signal<number>(0);
  lapMs = signal<number>(0);
  tankCapacityOverride = signal<number | null>(null);

  // New Driver Form
  newDriverName = '';
  newDriverAccent = '#FFB000';
  newDriverError = 0.02;
  newDriverFuel: number | null = null;
  newDriverLapMin: number | null = null;
  newDriverLapSec: number | null = null;
  newDriverLapMs: number | null = null;

  newDriverAvgLapTime = computed(() => {
    if (this.newDriverLapMin === null && this.newDriverLapSec === null && this.newDriverLapMs === null) return null;
    return (Number(this.newDriverLapMin || 0) * 60 * 1000) +
      (Number(this.newDriverLapSec || 0) * 1000) +
      Number(this.newDriverLapMs || 0);
  });

  // Derived Values
  selectedEvent = computed(() => this.events().find(e => e.id === this.selectedEventId()));
  selectedVehicle = computed(() => this.vehiclesByEvent().find(v => v.id === this.selectedVehicleId()));

  avgLapTime = computed(() => {
    return (this.lapMin() * 60 * 1000) + (this.lapSec() * 1000) + (this.lapMs() || 0);
  });

  tankCapacity = computed(() => {
    if (this.tankCapacityOverride() !== null) return this.tankCapacityOverride()!;
    return this.selectedVehicle()?.fuelTankCapacityL || 0;
  });

  maxLaps = computed(() => {
    const consumption = this.fuelPerLap();
    const capacity = this.tankCapacity();
    if (consumption <= 0 || capacity <= 0) return 0;
    return Math.floor(capacity / consumption);
  });

  stintDurationMs = computed(() => {
    return this.maxLaps() * this.avgLapTime();
  });

  stintDurationFormatted = computed(() => {
    const ms = this.stintDurationMs();
    if (ms <= 0) return '00:00:00';
    return this.formatMs(ms);
  });

  stintsNeeded = computed(() => {
    const eventMins = this.selectedEvent()?.durationMinutes || 0;
    const stintMs = this.stintDurationMs();
    if (eventMins <= 0 || stintMs <= 0) return 0;

    const eventMs = eventMins * 60 * 1000;
    return Number((eventMs / stintMs).toFixed(2));
  });

  canGenerateStints = computed(() => this.stintsNeeded() > 0 && this.stintsNeeded() <= 1000);

  constructor(
    private catalog: CatalogService,
    public trans: TranslationService,
    public strategyService: StrategyService
  ) {
    // React to event changes to filter vehicles
    effect(() => {
      const eventId = this.selectedEventId();
      if (eventId) {
        this.catalog.getVehiclesByEvent(eventId).subscribe(v => {
          this.vehiclesByEvent.set(v);
          if (v.length > 0) {
            this.selectedVehicleId.set(v[0].id);
          }
        });
      }
    });

    // React to vehicle change to reset override
    effect(() => {
      this.selectedVehicleId();
      this.tankCapacityOverride.set(null);
    });

    // Ripple Recalculate Effect
    effect(() => {
      const fuel = this.fuelPerLap();
      const lapTime = this.avgLapTime();
      const tank = this.tankCapacity();
      const drivers = this.strategyService.drivers(); // Watch for driver parameter changes
      const pitFuel = this.strategyService.pitStopFuelOnlyMs();
      const pitTires = this.strategyService.pitStopTiresMs();

      // Just trigger when these change, don't watch stintPlan itself to avoid loop
      if (untracked(() => this.strategyService.stintPlan()).length > 0) {
        this.strategyService.recalculateTimeline(fuel, lapTime, tank);
      }
    });
  }

  // Editing State
  editingDriverId = signal<string | null>(null);

  editDriver(driver: DriverProfile) {
    this.editingDriverId.set(driver.id);
    this.newDriverName = driver.name;
    this.newDriverAccent = driver.accentColor;
    this.newDriverError = driver.errorFactor;
    this.newDriverFuel = driver.fuelPerLapL || null;

    // Parse time back to components
    if (driver.avgLapTimeMs) {
      const totalSeconds = Math.floor(driver.avgLapTimeMs / 1000);
      this.newDriverLapMin = Math.floor(totalSeconds / 60);
      this.newDriverLapSec = totalSeconds % 60;
      this.newDriverLapMs = driver.avgLapTimeMs % 1000;
    }
  }

  cancelEdit() {
    this.editingDriverId.set(null);
    this.newDriverName = '';
    this.newDriverFuel = null;
    this.newDriverLapMin = null;
    this.newDriverLapSec = null;
    this.newDriverLapMs = null;
    // Reset to next color
    const nextIndex = this.strategyService.drivers().length % this.colorPalette.length;
    this.newDriverAccent = this.colorPalette[nextIndex];
  }

  updateDriver() {
    const id = this.editingDriverId();
    if (!id || !this.newDriverName) return;

    this.strategyService.updateDriver(id, {
      name: this.newDriverName,
      accentColor: this.newDriverAccent,
      fuelPerLapL: this.newDriverFuel || undefined,
      avgLapTimeMs: this.newDriverAvgLapTime() || undefined,
      errorFactor: this.newDriverError
    });

    this.cancelEdit();
  }

  ngOnInit() {
    this.catalog.getEvents().subscribe(e => {
      this.events.set(e);
      if (e.length > 0) {
        this.selectedEventId.set(e[0].id);
      }
    });
  }

  onEventChange(id: string) {
    this.selectedEventId.set(id);
  }

  onVehicleChange(id: string) {
    this.selectedVehicleId.set(id);
  }

  formatMs(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  addDriver() {
    if (!this.newDriverName) return;
    this.strategyService.addDriver({
      name: this.newDriverName,
      accentColor: this.newDriverAccent,
      avgLapTimeMs: this.newDriverAvgLapTime() || this.avgLapTime(),
      fuelPerLapL: this.newDriverFuel || undefined,
      errorFactor: this.newDriverError
    });

    this.newDriverName = '';
    this.newDriverFuel = null;
    this.newDriverLapMin = null;
    this.newDriverLapSec = null;
    this.newDriverLapMs = null;

    // Set next color from palette
    const nextIndex = this.strategyService.drivers().length % this.colorPalette.length;
    this.newDriverAccent = this.colorPalette[nextIndex];
  }

  generateStintPlan() {
    const count = Math.ceil(this.stintsNeeded());
    this.strategyService.generateEmptyStints(count, this.maxLaps(), this.avgLapTime());
    // Trigger initial calculation
    this.strategyService.recalculateTimeline(this.fuelPerLap(), this.avgLapTime(), this.tankCapacity());
  }

  updateStintDriver(stintIndex: number, driverId: string) {
    this.strategyService.updateStintDriver(stintIndex, driverId);
    this.strategyService.recalculateTimeline(this.fuelPerLap(), this.avgLapTime(), this.tankCapacity());
  }

  updateStintTires(stintIndex: number, change: boolean) {
    this.strategyService.updateStintFields(stintIndex, { changeTires: change });
    this.strategyService.recalculateTimeline(this.fuelPerLap(), this.avgLapTime(), this.tankCapacity());
  }

  updateStintExtraTime(stintIndex: number, seconds: number) {
    this.strategyService.updateStintFields(stintIndex, { additionalTimeMs: (seconds || 0) * 1000 });
    this.strategyService.recalculateTimeline(this.fuelPerLap(), this.avgLapTime(), this.tankCapacity());
  }

  drop(event: CdkDragDrop<string[]>) {
    this.strategyService.reorderStints(event.previousIndex, event.currentIndex);
    this.strategyService.recalculateTimeline(this.fuelPerLap(), this.avgLapTime(), this.tankCapacity());
  }

  getDriverColor(driverId: string): string {
    if (!driverId) return '#888'; // Light grey for unassigned
    return this.strategyService.getDriverById(driverId)?.accentColor || '#888';
  }

  scrollToStint(index: number) {
    const el = document.getElementById(`stint-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

      // Temporary highlight (scale only, no glow)
      el.classList.add('highlight');
      setTimeout(() => el.classList.remove('highlight'), 2000);
    }
  }
}
