import { Component, OnInit, OnDestroy, signal, computed, effect, untracked, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { TranslationService } from '../../core/services/translation.service';
import { StrategyStore } from '../../core/services/strategy-store.service';
import { StrategyApiService } from '../../core/services/strategy-api.service';
import { TeamService } from '../../core/services/team.service';
import { TeamsService, TeamSummary } from '../../core/services/teams.service';
import { DriverProfile } from '../../core/models/race-strategy.model';
import { calculateStintCount } from '../../core/services/stint-calculator';
import { HasUnsavedChanges } from '../../core/guards/unsaved-changes.guard';
import { AuthService } from '../../core/services/auth.service';
import { TelemetryService } from '../../core/services/telemetry.service';
import { TelemetryApiService, AgentTokenDto } from '../../core/services/telemetry-api.service';
import { environment } from '../../../environments/environment';
import { TelemetryPanelComponent } from '../telemetry-panel/telemetry-panel';

@Component({
  selector: 'app-strategy-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DragDropModule, TelemetryPanelComponent],
  templateUrl: './strategy-calculator.html',
  styleUrl: './strategy-calculator.css'
})
export class StrategyCalculator implements OnInit, OnDestroy, HasUnsavedChanges {
  private teamsService = inject(TeamsService);
  private suppressDirty = true;

  eventDurationMinutes = signal<number | null>(null);
  vehicleName = signal<string>('');

  fuelPerLap = signal<number>(0);
  lapMin = signal<number>(0);
  lapSec = signal<number>(0);
  lapMs = signal<number>(0);
  tankCapacityInput = signal<number | null>(null);

  eventStartHour = signal<number>(0);
  eventStartMinute = signal<number>(0);

  showRemoveStintDialog = signal<number | null>(null);
  showTeamSelector = signal(false);
  availableTeams = signal<TeamSummary[]>([]);
  teamsLoading = signal(false);

  avgLapTime = computed(() => {
    return (this.lapMin() * 60 * 1000) + (this.lapSec() * 1000) + (this.lapMs() || 0);
  });

  tankCapacity = computed(() => {
    return this.tankCapacityInput() ?? 0;
  });

  maxLaps = computed(() => {
    const consumption = this.fuelPerLap();
    const capacity = this.tankCapacity();
    if (consumption <= 0 || capacity <= 0) return 0;
    return Math.floor(capacity / consumption);
  });

  stintDurationMs = computed(() => this.maxLaps() * this.avgLapTime());

  stintDurationFormatted = computed(() => {
    const ms = this.stintDurationMs();
    if (ms <= 0) return '00:00:00';
    return this.formatMs(ms);
  });

  stintsNeeded = computed(() => {
    const dur = this.eventDurationMinutes();
    if (!dur || dur <= 0) return 0;
    const stintMs = this.stintDurationMs();
    if (stintMs <= 0) return 0;
    const eventMs = dur * 60 * 1000;
    return Number((eventMs / stintMs).toFixed(2));
  });

  canGenerateStints = computed(() => this.stintsNeeded() > 0 && this.stintsNeeded() <= 1000);

  stintCoverage = computed<'error' | 'warning' | null>(() => {
    const planned = this.store.stintPlan().length;
    const needed = this.stintCountWithPits();
    if (needed === 0) return null;
    if (planned < needed) return 'error';
    if (planned > needed) return 'warning';
    return null;
  });

  stintCoverageTitle = computed<string>(() => {
    const state = this.stintCoverage();
    const needed = this.stintCountWithPits();
    const planned = this.store.stintPlan().length;
    if (state === 'error') {
      return this.trans.translate('stint_coverage_error', { d1: planned, d2: needed });
    }
    if (state === 'warning') {
      return this.trans.translate('stint_coverage_warning', { d1: planned, d2: needed });
    }
    return '';
  });

  stintCountWithPits = computed(() => {
    const dur = this.eventDurationMinutes();
    if (!dur || dur <= 0) return 0;
    const stintMs = this.stintDurationMs();
    if (stintMs <= 0) return 0;
    const eventMs = dur * 60 * 1000;
    const avgPitMs = this.store.pitStopFuelOnlyMs();
    return calculateStintCount(eventMs, stintMs, avgPitMs, this.maxLaps());
  });

missingFields = computed<string[]>(() => {
    const missing: string[] = [];
    if (!this.eventDurationMinutes() || this.eventDurationMinutes()! <= 0) missing.push('event_duration');
    if (!this.vehicleName().trim()) missing.push('vehicle_label');
    if (this.fuelPerLap() <= 0) missing.push('fuel_consumption');
    if (this.avgLapTime() <= 0) missing.push('avg_lap_time');
    if (this.tankCapacity() <= 0) missing.push('tank_capacity');
    return missing;
  });

  /** Drivers available for stint assignment: team roster + strategy snapshot drivers */
  availableDrivers = computed(() => {
    const team = this.team.roster();
    const snapshot = this.store.drivers();
    const merged = new Map<string, DriverProfile>();
    for (const d of team) merged.set(d.id, d);
    for (const d of snapshot) if (!merged.has(d.id)) merged.set(d.id, d);
    return [...merged.values()];
  });

  /** Refreshes stale driver data from team roster into the strategy snapshot */
  refreshDriversFromRoster() {
    const roster = this.team.roster();
    const currentDrivers = this.store.drivers();
    let changed = false;
    const updated = currentDrivers.map(sd => {
      const rosterMatch = roster.find(rd => rd.id === sd.id);
      if (rosterMatch && (rosterMatch.avgLapTimeMs !== sd.avgLapTimeMs || rosterMatch.fuelPerLapL !== sd.fuelPerLapL)) {
        changed = true;
        return { ...sd, ...rosterMatch };
      }
      return sd;
    });
    if (changed) this.store.drivers.set(updated);
  }

  getDriverById(id: string): DriverProfile | undefined {
    return this.availableDrivers().find(d => d.id === id);
  }

  constructor(
    public trans: TranslationService,
    public store: StrategyStore,
    private api: StrategyApiService,
    public team: TeamService,
    private router: Router,
    public telemetry: TelemetryService,
    public auth: AuthService
  ) {
    effect(() => {
      const fuel = this.fuelPerLap();
      const lapTime = this.avgLapTime();
      const tank = this.tankCapacity();
      const drivers = this.store.drivers();
      const pitFuel = this.store.pitStopFuelOnlyMs();
      const pitTires = this.store.pitStopTiresMs();

      if (untracked(() => this.store.stintPlan()).length > 0) {
        this.store.recalculateTimeline(fuel, lapTime, tank, this.availableDrivers());
      }
    });

    effect(() => {
      this.fuelPerLap(); this.lapMin(); this.lapSec(); this.lapMs();
      this.eventDurationMinutes(); this.vehicleName();
      this.store.pitStopFuelOnlyMs(); this.store.pitStopTiresMs();
      this.store.stintPlan(); this.store.drivers();
      this.store.activeStrategyName(); this.store.activeEventStartTime();

      if (untracked(() => this.suppressDirty)) return;
      untracked(() => this.isDirty.set(true));
    });
  }

  async ngOnInit() {
    this.team.loadRoster();
    this.refreshDriversFromRoster();

    if (this.store.activeStrategyId()) {
      this.syncFromActiveStrategy();
    } else {
      this.suppressDirty = false;
    }
  }

  async openTeamSelector() {
    this.teamsLoading.set(true);
    this.availableTeams.set([]);
    try {
      const teams = await this.teamsService.loadTeams();
      this.availableTeams.set(teams);
      this.showTeamSelector.set(true);
    } catch { /* ignore */ }
    finally { this.teamsLoading.set(false); }
  }

  async loadTeamIntoStrategy(teamId: string) {
    try {
      const team = await this.teamsService.loadTeam(teamId);
      const drivers: DriverProfile[] = team.drivers.map(d => ({
        id: d.id,
        name: d.name,
        accentColor: d.accentColor,
        avgLapTimeMs: d.avgLapTimeMs,
        fuelPerLapL: d.fuelPerLapL || 0,
        errorFactor: d.errorFactor,
        licenseClass: d.licenseClass as any,
        iRating: d.iRating || 0,
        nationality: d.nationality || '',
        role: d.role as any
      }));
      this.store.drivers.set(drivers);
      this.showTeamSelector.set(false);
    } catch { /* ignore */ }
  }

  closeTeamSelector() {
    this.showTeamSelector.set(false);
  }

  syncFromActiveStrategy() {
    this.suppressDirty = true;
    const dur = this.store.activeEventDurationMinutes();
    const vname = this.store.activeVehicleName();
    const fuel = this.store.activeFuelPerLap();
    const totalMs = this.store.activeAvgLapTimeMs();

    if (dur) this.eventDurationMinutes.set(dur);
    if (vname) this.vehicleName.set(vname);
    if (fuel) this.fuelPerLap.set(fuel);

    if (totalMs) {
      const totalSeconds = Math.floor(totalMs / 1000);
      this.lapMin.set(Math.floor(totalSeconds / 60));
      this.lapSec.set(totalSeconds % 60);
      this.lapMs.set(totalMs % 1000);
    }

    const tank = this.store.activeTankCapacity();
    if (tank) this.tankCapacityInput.set(tank);

    const startTs = this.store.activeEventStartTime();
    if (startTs) {
      const d = new Date(startTs);
      this.eventStartHour.set(d.getHours());
      this.eventStartMinute.set(d.getMinutes());
    }

    this.telemetry.setPlannedValues(fuel, totalMs);

    untracked(() => this.isDirty.set(false));
    setTimeout(() => { this.suppressDirty = false; });
  }

  onEventDurationChange(v: number | null) { this.eventDurationMinutes.set(v); }
  onVehicleNameInput(v: string) { this.vehicleName.set(v); }

  onStrategyNameInput(event: Event) {
    this.store.activeStrategyName.set((event.target as HTMLInputElement).value);
  }

  onStrategyNameBlur(event: Event) {
    const val = (event.target as HTMLInputElement).value.trim();
    if (!val) {
      this.store.activeStrategyName.set('Unnamed Strategy');
      (event.target as HTMLInputElement).value = 'Unnamed Strategy';
    } else {
      this.store.activeStrategyName.set(val);
    }
  }

  onStrategyNameEnter(event: Event) { (event.target as HTMLInputElement).blur(); }

  onEventStartChange() {
    const h = this.eventStartHour();
    const m = this.eventStartMinute();
    const d = new Date();
    d.setHours(h, m, 0, 0);
    this.store.activeEventStartTime.set(d.getTime());
  }

  formatMs(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  formatLapTime(ms: number): string {
    if (!ms) return '—';
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const msRem = ms % 1000;
    return `${m}:${s.toString().padStart(2, '0')}.${msRem.toString().padStart(3, '0')}`;
  }

  formatAbsoluteTime(stintMs: number): string {
    if (this.useRelativeTime()) {
      return this.formatMs(stintMs);
    }
    const ts = this.store.activeEventStartTime();
    if (!ts) return '—';
    const d = new Date(ts + stintMs);
    const h = this.useLocalTime() ? d.getHours() : d.getUTCHours();
    const m = this.useLocalTime() ? d.getMinutes() : d.getUTCMinutes();
    const s = this.useLocalTime() ? d.getSeconds() : d.getUTCSeconds();
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  generateStintPlan() {
    const eventDuration = this.eventDurationMinutes() || 0;
    this.store.activeEventDurationMinutes.set(eventDuration);
    const avgPitMs = this.store.pitStopFuelOnlyMs();
    const stintMs = this.stintDurationMs();
    const eventMs = eventDuration * 60 * 1000;
    const count = calculateStintCount(eventMs, stintMs, avgPitMs, this.maxLaps());
    this.store.generateEmptyStints(count, this.maxLaps());
    this.store.recalculateTimeline(this.fuelPerLap(), this.avgLapTime(), this.tankCapacity(), this.availableDrivers());
    this.store.applyDefaultLastStintFuel(this.fuelPerLap(), this.avgLapTime(), this.tankCapacity());
    this.telemetry.setPlannedValues(this.fuelPerLap(), this.avgLapTime());
  }

  updateStintFuel(stintIndex: number, fuelL: number | null) {
    const fuelPerLap = this.fuelPerLap();
    const lapTimeMs = this.avgLapTime();
    const tank = this.tankCapacity();
    const value = fuelL != null && fuelL > 0 ? (fuelL < tank ? fuelL : null) : null;
    this.store.updateStintFuel(stintIndex, value, fuelPerLap, lapTimeMs, tank);
  }

  updateStintDriver(stintIndex: number, driverId: string) {
    this.store.updateStintDriver(stintIndex, driverId);
    this.store.recalculateTimeline(this.fuelPerLap(), this.avgLapTime(), this.tankCapacity(), this.availableDrivers());
  }

  updateStintTires(stintIndex: number, change: boolean) {
    this.store.updateStintFields(stintIndex, { changeTires: change });
    this.store.recalculateTimeline(this.fuelPerLap(), this.avgLapTime(), this.tankCapacity(), this.availableDrivers());
  }

updateStintExtraTime(stintIndex: number, seconds: number) {
    this.store.updateStintFields(stintIndex, { additionalTimeMs: (seconds || 0) * 1000 });
    this.store.recalculateTimeline(this.fuelPerLap(), this.avgLapTime(), this.tankCapacity(), this.availableDrivers());
  }

  toggleExtraTimeInput(stintIndex: number) {
    this.extraTimeOpen.set(this.extraTimeOpen() === stintIndex ? -1 : stintIndex);
  }

  drop(event: CdkDragDrop<string[]>) {
    this.store.reorderStints(event.previousIndex, event.currentIndex);
    this.store.recalculateTimeline(this.fuelPerLap(), this.avgLapTime(), this.tankCapacity(), this.availableDrivers());
  }

  insertStint(atIndex: number) {
    this.store.insertStint(atIndex);
    this.store.recalculateTimeline(this.fuelPerLap(), this.avgLapTime(), this.tankCapacity(), this.availableDrivers());
  }

  confirmRemoveStint(atIndex: number) {
    if (this.store.stintPlan().length <= 1) return;
    this.showRemoveStintDialog.set(atIndex);
  }

  cancelRemoveStint() {
    this.showRemoveStintDialog.set(null);
  }

  removeStint(atIndex: number) {
    this.showRemoveStintDialog.set(null);
    this.store.removeStintAtPosition(atIndex);
    this.store.recalculateTimeline(this.fuelPerLap(), this.avgLapTime(), this.tankCapacity(), this.availableDrivers());
  }

  stintSettingsOpen = signal<number | null>(null);
  stintSettingsFuel = signal<number | null>(null);
  stintSettingsExtraSec = signal<number>(0);
  stintSettingsTires = signal<boolean>(false);

  openStintSettings(stintIndex: number) {
    const stint = this.store.stintPlan().find(s => s.index === stintIndex);
    if (!stint) return;
    this.stintSettingsOpen.set(stintIndex);
    this.stintSettingsFuel.set(stint.fuelAddedL ?? null);
    this.stintSettingsExtraSec.set((stint.additionalTimeMs || 0) / 1000);
    this.stintSettingsTires.set(!!stint.changeTires);
  }

  closeStintSettings() {
    this.stintSettingsOpen.set(null);
  }

  onStintSettingsFuel(v: number) { this.stintSettingsFuel.set(v); }
  onStintSettingsExtraSec(v: number) { this.stintSettingsExtraSec.set(v); }
  onStintSettingsTires(v: boolean) { this.stintSettingsTires.set(v); }

  saveStintSettings() {
    const idx = this.stintSettingsOpen();
    if (idx == null) return;
    this.store.activeEventDurationMinutes.set(this.eventDurationMinutes() || 0);
    this.store.updateStintFields(idx, {
      fuelAddedL: this.stintSettingsFuel() ?? undefined,
      additionalTimeMs: (this.stintSettingsExtraSec() || 0) * 1000,
      changeTires: this.stintSettingsTires(),
    });
    this.store.recalculateTimeline(this.fuelPerLap(), this.avgLapTime(), this.tankCapacity(), this.availableDrivers(), idx);
    this.stintSettingsOpen.set(null);
  }

  trackByDriverId = (_: number, d: { id: string }) => d.id;
  trackByStintIndex = (_: number, s: { index: number }) => s.index;

  getDriverColor(driverId: string): string {
    if (!driverId) return '#888888';
    return this.getDriverById(driverId)?.accentColor || '#888888';
  }

  scrollToStint(index: number) {
    const el = document.getElementById(`stint-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      el.classList.add('highlight');
      setTimeout(() => el.classList.remove('highlight'), 2000);
    }
  }

  isDirty = signal(false);

  showUnsavedDialog = signal(false);
  showDeleteDialog = signal(false);
  useLocalTime = signal(false);
  useRelativeTime = signal(true);
  dashCollapsed = signal(false);
  extraTimeOpen = signal(-1);

  // Driver settings modal
  driverSettingsOpen = signal<string | null>(null);
  driverSettingsFuel = signal<number | null>(null);
  driverSettingsLapMin = signal<number>(0);
  driverSettingsLapSec = signal<number>(0);
  driverSettingsLapMs = signal<number>(0);

  openDriverSettings(driver: DriverProfile) {
    this.driverSettingsOpen.set(driver.id);
    this.driverSettingsFuel.set(driver.fuelPerLapL ?? null);
    const ms = driver.avgLapTimeMs || 0;
    const totalSec = Math.floor(ms / 1000);
    this.driverSettingsLapMin.set(Math.floor(totalSec / 60));
    this.driverSettingsLapSec.set(totalSec % 60);
    this.driverSettingsLapMs.set(ms % 1000);
  }

  closeDriverSettings() {
    this.driverSettingsOpen.set(null);
  }

  saveDriverSettings(driverId: string) {
    const fuel = this.driverSettingsFuel();
    const lapMs = (this.driverSettingsLapMin() * 60 * 1000) + (this.driverSettingsLapSec() * 1000) + (this.driverSettingsLapMs() || 0);

    // Update in store.drivers if present, otherwise add a copy with overrides
    const existing = this.store.drivers();
    const inStore = existing.find(d => d.id === driverId);
    if (inStore) {
      this.store.drivers.set(existing.map(d => d.id === driverId ? { ...d, fuelPerLapL: fuel ?? 0, avgLapTimeMs: lapMs } : d));
    } else {
      // Driver is from team roster only — clone into strategy snapshot with overrides
      const fromRoster = this.availableDrivers().find(d => d.id === driverId);
      if (fromRoster) {
        this.store.drivers.set([...existing, { ...fromRoster, fuelPerLapL: fuel ?? 0, avgLapTimeMs: lapMs }]);
      }
    }

    this.store.recalculateTimeline(this.fuelPerLap(), this.avgLapTime(), this.tankCapacity(), this.availableDrivers());
    this.closeDriverSettings();
  }

  getDriverSettingsLapMs(driver: DriverProfile): number {
    return driver.avgLapTimeMs || 0;
  }

  // Manual end time edit for stints
  endTimeEditOpen = signal<number>(-1);
  endTimeEditH = signal<number>(0);
  endTimeEditM = signal<number>(0);
  endTimeEditS = signal<number>(0);

  toggleEndTimeEdit(stintIndex: number) {
    if (this.endTimeEditOpen() === stintIndex) {
      this.endTimeEditOpen.set(-1);
      return;
    }
    const stint = this.store.stintPlan().find(s => s.index === stintIndex);
    if (!stint) return;
    const ms = stint.manualEndTimeMs ?? stint.endTimeMs;
    const totalSec = Math.floor(ms / 1000);
    this.endTimeEditH.set(Math.floor(totalSec / 3600));
    this.endTimeEditM.set(Math.floor((totalSec % 3600) / 60));
    this.endTimeEditS.set(totalSec % 60);
    this.endTimeEditOpen.set(stintIndex);
  }

  saveEndTimeEdit(stintIndex: number) {
    const ms = (this.endTimeEditH() * 3600 + this.endTimeEditM() * 60 + this.endTimeEditS()) * 1000;
    this.store.updateStintFields(stintIndex, { manualEndTimeMs: ms });
    this.store.recalculateTimeline(this.fuelPerLap(), this.avgLapTime(), this.tankCapacity(), this.availableDrivers());
    this.endTimeEditOpen.set(-1);
  }

  clearEndTimeEdit(stintIndex: number) {
    this.store.updateStintFields(stintIndex, { manualEndTimeMs: null });
    this.store.recalculateTimeline(this.fuelPerLap(), this.avgLapTime(), this.tankCapacity(), this.availableDrivers());
    this.endTimeEditOpen.set(-1);
  }

  toggleTimeMode() {
    if (this.useRelativeTime()) {
      this.useRelativeTime.set(false);
    } else if (!this.useLocalTime()) {
      this.useLocalTime.set(true);
    } else {
      this.useLocalTime.set(false);
      this.useRelativeTime.set(true);
    }
  }

  timeModeLabel(): string {
    if (this.useRelativeTime()) return 'REL';
    return this.useLocalTime() ? 'LOCAL' : 'UTC';
  }

  toggleDash() {
    this.dashCollapsed.set(!this.dashCollapsed());
  }

  // ── Race Progress: Auto/Mannual Stint Completion ──────────────────────

  autoCompleteEnabled = signal(false);
  completedCollapsed = signal(true);
  private autoCompleteTimer: ReturnType<typeof setInterval> | null = null;

  currentStintIndex = computed(() => {
    const stints = this.store.stintPlan();
    const completed = stints.filter(s => s.isCompleted);
    if (completed.length === 0 && stints.length > 0) return stints[0].index;
    if (completed.length >= stints.length) return -1;
    return stints[completed.length].index;
  });

  toggleAutoComplete() {
    if (this.autoCompleteEnabled()) {
      this.stopAutoComplete();
    } else {
      this.startAutoComplete();
    }
  }

  private startAutoComplete() {
    this.stopAutoComplete();
    this.autoCompleteEnabled.set(true);
    this.autoCompleteTimer = setInterval(() => {
      const eventStart = this.store.activeEventStartTime();
      if (!eventStart) return;
      const lastCompleted = this.store.autoCompleteStints(eventStart);
      if (lastCompleted >= 0) {
        this.scrollToStint(this.currentStintIndex());
      }
    }, 5000);
  }

  private stopAutoComplete() {
    if (this.autoCompleteTimer !== null) {
      clearInterval(this.autoCompleteTimer);
      this.autoCompleteTimer = null;
    }
    this.autoCompleteEnabled.set(false);
  }

  toggleCompletedCollapsed() {
    this.completedCollapsed.set(!this.completedCollapsed());
  }

  manualCompleteStint(stintIndex: number) {
    this.store.markStintCompleted(stintIndex);
    this.scrollToStint(this.currentStintIndex());
  }

  manualIncompleteStint(stintIndex: number) {
    this.store.markStintIncomplete(stintIndex);
  }

  isCurrentStint(stintIndex: number): boolean {
    return this.currentStintIndex() === stintIndex;
  }

  getSummaryEventName(): string {
    const dur = this.eventDurationMinutes();
    return dur ? `${dur} min` : '—';
  }

  getSummaryVehicleName(): string {
    return this.vehicleName() || '—';
  }

  private deactivateResolver: ((allow: boolean) => void) | null = null;

  canDeactivate(): boolean | Promise<boolean> {
    if (!this.isDirty()) return true;
    this.showUnsavedDialog.set(true);
    return new Promise<boolean>(resolve => {
      this.deactivateResolver = resolve;
    });
  }

  keepEditing() {
    this.showUnsavedDialog.set(false);
    if (this.deactivateResolver) {
      this.deactivateResolver(false);
      this.deactivateResolver = null;
    }
  }

  saveAndNavigate() {
    this.saveStrategy();
    this.showUnsavedDialog.set(false);
    if (this.deactivateResolver) {
      this.deactivateResolver(true);
      this.deactivateResolver = null;
    }
  }

  discardAndNavigate() {
    this.discardChanges();
    this.showUnsavedDialog.set(false);
    if (this.deactivateResolver) {
      this.deactivateResolver(true);
      this.deactivateResolver = null;
    }
  }

  async saveStrategy() {
    this.store.activeEventDurationMinutes.set(this.eventDurationMinutes() || 0);
    this.store.activeVehicleName.set(this.vehicleName());

    if (!this.store.activeStrategyId()) {
      const name = this.store.activeStrategyName() || 'New Strategy';
      const created = await this.api.createStrategy(
        name, this.eventDurationMinutes() || 0, this.vehicleName(),
        this.avgLapTime(), this.fuelPerLap(),
        this.store.activeEventStartTime() || undefined,
        this.tankCapacity()
      );
      this.store.activeStrategyId.set(created.id);
      this.store.activeStrategyName.set(name);
      await this.saveStintsAndDrivers(created.id);
      await this.loadLibrary();
    } else {
      const id = this.store.activeStrategyId()!;
      const name = this.store.activeStrategyName() || 'Unnamed Strategy';
      await this.api.updateStrategy(id, {
        name,
        vehicleName: this.vehicleName(),
        avgLapTimeMs: this.avgLapTime(), fuelPerLap: this.fuelPerLap(),
        tankCapacity: this.tankCapacity(),
        pitStopFuelOnlyMs: this.store.pitStopFuelOnlyMs(),
        pitStopTiresMs: this.store.pitStopTiresMs(),
        eventStartTime: this.store.activeEventStartTime(),
        eventDurationMinutes: this.eventDurationMinutes() || 0,
      } as any);
      await this.saveStintsAndDrivers(id);
      await this.loadLibrary();
    }
    this.isDirty.set(false);
    this.suppressDirty = true;
    setTimeout(() => { this.suppressDirty = false; });
  }

  private async saveStintsAndDrivers(id: string) {
    await this.api.updateStints(id, this.store.stintPlan());
    await this.api.updateDrivers(id, this.store.drivers());
  }

  private async loadLibrary() {
    try {
      const list = await this.api.loadLibrary();
      this.store.savedStrategies.set(list);
    } catch {
      this.store.error.set('Failed to load strategy library');
    }
  }

  async deleteStrategy() {
    const id = this.store.activeStrategyId();
    if (!id) return;
    try {
      await this.api.deleteStrategy(id);
      this.showDeleteDialog.set(false);
      this.store.clearActive();
      this.isDirty.set(false);
      this.router.navigate(['/strategies']);
    } catch {
      this.store.error.set('Failed to delete strategy');
    }
  }

  inviteUrl = signal<string | null>(null);
  inviteCopied = signal(false);

  async openInvite() {
    const id = this.store.activeStrategyId();
    if (!id) return;
    try {
      const { token } = await this.api.generateInvite(id);
      const base = window.location.origin;
      this.inviteUrl.set(`${base}/join?token=${token}`);
      this.inviteCopied.set(false);
    } catch {
      this.store.error.set('Failed to generate invite');
    }
  }

  closeInvite() {
    this.inviteUrl.set(null);
    this.inviteCopied.set(false);
  }

  async copyInvite() {
    const url = this.inviteUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      this.inviteCopied.set(true);
      setTimeout(() => this.inviteCopied.set(false), 2000);
    } catch {
      const input = document.querySelector('.invite-url-input') as HTMLInputElement;
      input?.select();
    }
  }

  discardChanges() {
    const id = this.store.activeStrategyId();
    if (id) {
      this.api.loadStrategy(id).then(strat => {
        if (strat) this.store.applyLoadedStrategy(strat);
        this.syncFromActiveStrategy();
      });
    } else {
      this.store.clearActive();
      this.eventDurationMinutes.set(null);
      this.vehicleName.set('');
      this.fuelPerLap.set(0);
      this.lapMin.set(0);
      this.lapSec.set(0);
      this.lapMs.set(0);
      this.tankCapacityInput.set(null);
      this.eventStartHour.set(0);
      this.eventStartMinute.set(0);
      this.store.activeTankCapacity.set(0);
    }
    this.isDirty.set(false);
  }

  useRealTelemetryData = signal(false);
  autoUpdateEnabled = signal(false);
  autoUpdateIntervalSec = signal(30);
  autoUpdateCountdown = signal(0);
  private autoUpdateTimer: ReturnType<typeof setInterval> | null = null;

  ngOnDestroy(): void {
    this.stopAutoUpdate();
    this.stopAutoComplete();
  }

  applyRealPitFuelOnly(): void {
    const actual = this.telemetry.avgPitDurationMs();
    if (actual <= 0) return;
    this.store.applyRealPitTime(Math.round(actual), this.store.pitStopTiresMs());
    this.isDirty.set(true);
  }

  applyRealPitWithTires(): void {
    const actual = this.telemetry.avgPitDurationMs();
    if (actual <= 0) return;
    this.store.applyRealPitTime(this.store.pitStopFuelOnlyMs(), Math.round(actual));
    this.isDirty.set(true);
  }

  toggleAutoUpdate(): void {
    if (this.autoUpdateEnabled()) {
      this.stopAutoUpdate();
    } else {
      this.startAutoUpdate();
    }
  }

  private startAutoUpdate(): void {
    this.stopAutoUpdate();
    this.autoUpdateEnabled.set(true);
    this.autoUpdateCountdown.set(this.autoUpdateIntervalSec());
    this.autoUpdateTimer = setInterval(() => {
      const c = this.autoUpdateCountdown() - 1;
      if (c <= 0) {
        this.autoApplyTelemetry();
        this.autoUpdateCountdown.set(this.autoUpdateIntervalSec());
      } else {
        this.autoUpdateCountdown.set(c);
      }
    }, 1000);
  }

  private stopAutoUpdate(): void {
    if (this.autoUpdateTimer !== null) {
      clearInterval(this.autoUpdateTimer);
      this.autoUpdateTimer = null;
    }
    this.autoUpdateEnabled.set(false);
    this.autoUpdateCountdown.set(0);
  }

  private autoApplyTelemetry(): void {
    if (this.telemetry.actualFuelPerLap() > 0) {
      this.store.applyRealFuelData(this.telemetry.actualFuelPerLap(), this.tankCapacity());
      this.fuelPerLap.set(this.telemetry.actualFuelPerLap());
    }
    if (this.telemetry.actualAvgLapTime() > 0) {
      const totalMs = Math.round(this.telemetry.actualAvgLapTime());
      this.store.applyRealPaceData(totalMs, this.tankCapacity());
      const totalSeconds = Math.floor(totalMs / 1000);
      this.lapMin.set(Math.floor(totalSeconds / 60));
      this.lapSec.set(totalSeconds % 60);
      this.lapMs.set(totalMs % 1000);
    }
    if (this.telemetry.avgPitDurationMs() > 0) {
      const avg = Math.round(this.telemetry.avgPitDurationMs());
      this.store.applyRealPitTime(avg, avg);
    }
    this.telemetry.setPlannedValues(this.store.activeFuelPerLap(), this.store.activeAvgLapTimeMs());
    this.isDirty.set(true);
  }

  applyRealFuelToStrategy() {
    const actual = this.telemetry.actualFuelPerLap();
    if (actual <= 0) return;
    this.store.applyRealFuelData(actual, this.tankCapacity());
    this.fuelPerLap.set(actual);
    this.telemetry.setPlannedValues(actual, this.store.activeAvgLapTimeMs());
    this.isDirty.set(true);
  }

  applyRealPaceToStrategy() {
    const actual = this.telemetry.actualAvgLapTime();
    if (actual <= 0) return;
    const totalMs = Math.round(actual);
    this.store.applyRealPaceData(totalMs, this.tankCapacity());
    const totalSeconds = Math.floor(totalMs / 1000);
    this.lapMin.set(Math.floor(totalSeconds / 60));
    this.lapSec.set(totalSeconds % 60);
    this.lapMs.set(totalMs % 1000);
    this.telemetry.setPlannedValues(this.store.activeFuelPerLap(), totalMs);
    this.isDirty.set(true);
  }

  toggleRealTelemetryData() {
    if (this.useRealTelemetryData()) {
      this.useRealTelemetryData.set(false);
    } else {
      this.applyRealFuelToStrategy();
      this.applyRealPaceToStrategy();
      this.useRealTelemetryData.set(true);
    }
  }

  // Telemetry Agent Setup
  private telemetryApi = inject(TelemetryApiService);
  showAgentSetup = signal(false);
  agentTokens = signal<AgentTokenDto[]>([]);
  agentDriverName = '';
  generatingToken = signal(false);
  lastCopiedCommand = '';
  selectedStrategyDriverId = signal<string | null>(null);

  onStrategyDriverChange(driverId: string) {
    this.selectedStrategyDriverId.set(driverId || null);
    const driver = this.availableDrivers().find(d => d.id === driverId);
    this.agentDriverName = driver?.name || '';
  }

  async generateAgentToken() {
    const name = this.agentDriverName.trim();
    const strategyDriverId = this.selectedStrategyDriverId();
    if (!name) return;
    this.generatingToken.set(true);
    try {
      const id = strategyDriverId || name.toLowerCase().replace(/\s+/g, '-');
      const token = await this.telemetryApi.createAgentToken(id, name, strategyDriverId || undefined);
      this.agentTokens.update(t => [...t, token]);
      this.agentDriverName = '';
      this.selectedStrategyDriverId.set(null);
      this.lastCopiedCommand = '';
    } catch { /* ignore */ }
    this.generatingToken.set(false);
  }

  async revokeAgentToken(id: string) {
    try {
      await this.telemetryApi.revokeAgentToken(id);
      this.agentTokens.update(t => t.filter(x => x.id !== id));
    } catch { /* ignore */ }
  }

  getStrategyDriverName(driverId: string): string {
    return this.store.drivers().find(d => d.id === driverId)?.name || driverId;
  }

  copiedTokenId = signal('');

  async copyToken(t: AgentTokenDto) {
    try {
      await navigator.clipboard.writeText(t.token);
      this.copiedTokenId.set(t.id);
      setTimeout(() => this.copiedTokenId.set(''), 2000);
    } catch { /* ignore */ }
  }

  async copyAgentCommand(t: AgentTokenDto) {
    try {
      const cfg = await this.telemetryApi.getRelayConfig();
      this.lastCopiedCommand = `set PARTS_TEL_TOKEN=${t.token} && node server.js --relay=${cfg.relayUrl} --driver=${t.driverId}`;
      await navigator.clipboard.writeText(this.lastCopiedCommand);
    } catch {
      this.lastCopiedCommand = `set PARTS_TEL_TOKEN=${t.token} && node server.js --relay=ws://YOUR_SERVER_IP:3000/ws/telemetry/agent --driver=${t.driverId}`;
      await navigator.clipboard.writeText(this.lastCopiedCommand).catch(() => {});
    }
  }

  copyText(text: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
    this.lastCopiedCommand = '';
  }

  connectTelemetry() {
    // Prefer relay if auth token available, fall back to direct WS
    if (this.auth.token()) {
      this.telemetry.connectRelay();
    } else {
      this.telemetry.connect();
    }
  }

  connectTelemetryRelay() {
    this.telemetry.connectRelay();
  }

  disconnectTelemetry() {
    this.telemetry.disconnect();
  }
}
