import { Component, OnInit, signal, computed, effect, untracked, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { CatalogService } from '../../core/services/catalog.service';
import { TranslationService } from '../../core/services/translation.service';
import { StrategyStore } from '../../core/services/strategy-store.service';
import { StrategyApiService } from '../../core/services/strategy-api.service';
import { TeamService } from '../../core/services/team.service';
import { TeamsService, TeamSummary } from '../../core/services/teams.service';
import { Vehicle, DriverProfile } from '../../core/models/race-strategy.model';
import { HasUnsavedChanges } from '../../core/guards/unsaved-changes.guard';

@Component({
  selector: 'app-strategy-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DragDropModule],
  templateUrl: './strategy-calculator.html',
  styleUrl: './strategy-calculator.css'
})
export class StrategyCalculator implements OnInit, HasUnsavedChanges {
  private teamsService = inject(TeamsService);

  events = signal<any[]>([]);
  vehiclesByEvent = signal<Vehicle[]>([]);

  selectedEventId = signal<string>('');
  selectedVehicleId = signal<string>('');

  fuelPerLap = signal<number>(0);
  lapMin = signal<number>(0);
  lapSec = signal<number>(0);
  lapMs = signal<number>(0);
  tankCapacityOverride = signal<number | null>(null);

  showTeamSelector = signal(false);
  availableTeams = signal<TeamSummary[]>([]);
  teamsLoading = signal(false);

  selectedEvent = computed(() => this.events().find((e: any) => e.id === this.selectedEventId()));
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

  stintDurationMs = computed(() => this.maxLaps() * this.avgLapTime());

  stintDurationFormatted = computed(() => {
    const ms = this.stintDurationMs();
    if (ms <= 0) return '00:00:00';
    return this.formatMs(ms);
  });

  stintsNeeded = computed(() => {
    const event = this.selectedEvent();
    if (!event) return 0;
    const stintMs = this.stintDurationMs();
    if (stintMs <= 0) return 0;
    const eventMs = event.durationMinutes * 60 * 1000;
    return Number((eventMs / stintMs).toFixed(2));
  });

  canGenerateStints = computed(() => this.stintsNeeded() > 0 && this.stintsNeeded() <= 1000);

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
    private catalog: CatalogService,
    public trans: TranslationService,
    public store: StrategyStore,
    private api: StrategyApiService,
    public team: TeamService,
    private router: Router
  ) {
    effect(() => {
      const eventId = this.selectedEventId();
      if (eventId) {
        this.catalog.getVehiclesByEvent(eventId).then(v => {
          this.vehiclesByEvent.set(v);
          if (v.length > 0) {
            const current = untracked(() => this.selectedVehicleId());
            if (!current || !v.some(item => item.id === current)) {
              this.selectedVehicleId.set(v[0].id);
            }
          }
        });
      }
    });

    effect(() => {
      this.selectedVehicleId();
      untracked(() => this.tankCapacityOverride.set(null));
    });

    effect(() => {
      const fuel = this.fuelPerLap();
      const lapTime = this.avgLapTime();
      const tank = this.tankCapacity();
      const drivers = this.store.drivers();
      const pitFuel = this.store.pitStopFuelOnlyMs();
      const pitTires = this.store.pitStopTiresMs();

      if (untracked(() => this.store.stintPlan()).length > 0) {
        this.store.recalculateTimeline(fuel, lapTime, tank);
      }
    });

    let dirtyInitSkip = true;
    effect(() => {
      this.fuelPerLap(); this.lapMin(); this.lapSec(); this.lapMs();
      this.selectedEventId(); this.selectedVehicleId();
      this.store.pitStopFuelOnlyMs(); this.store.pitStopTiresMs();
      this.store.stintPlan(); this.store.drivers();

      if (dirtyInitSkip) {
        dirtyInitSkip = false;
        return;
      }
      untracked(() => this.isDirty.set(true));
    });
  }

  async ngOnInit() {
    this.team.loadRoster();
    this.refreshDriversFromRoster();
    const events = await this.catalog.getEvents();
    this.events.set(events);
    if (events.length > 0 && !this.store.activeStrategyId() && !this.selectedEventId()) {
      this.selectedEventId.set(events[0].id);
    }

    if (this.store.activeStrategyId()) {
      this.syncFromActiveStrategy();
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
    const eventId = this.store.activeEventId();
    const vehicleId = this.store.activeVehicleId();
    const fuel = this.store.activeFuelPerLap();
    const totalMs = this.store.activeAvgLapTimeMs();
    const eventStartTime = this.store.activeEventStartTime();

    if (eventId) this.selectedEventId.set(eventId);
    if (vehicleId) this.selectedVehicleId.set(vehicleId);
    if (fuel) this.fuelPerLap.set(fuel);

    if (totalMs) {
      const totalSeconds = Math.floor(totalMs / 1000);
      this.lapMin.set(Math.floor(totalSeconds / 60));
      this.lapSec.set(totalSeconds % 60);
      this.lapMs.set(totalMs % 1000);
    }
  }

  onEventChange(id: string) { this.selectedEventId.set(id); }

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
  onVehicleChange(id: string) { this.selectedVehicleId.set(id); }

  getEventStartDateString(): string {
    const ts = this.store.activeEventStartTime();
    if (!ts) return '';
    return new Date(ts).toISOString().slice(0, 16);
  }

  onEventStartChange(value: string) {
    const ts = value ? new Date(value).getTime() : 0;
    this.store.activeEventStartTime.set(ts);
  }

  formatMs(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  formatAbsoluteTime(stintMs: number): string {
    const ts = this.store.activeEventStartTime();
    if (!ts) return '—';
    const d = new Date(ts + stintMs);
    const h = this.useLocalTime() ? d.getHours() : d.getUTCHours();
    const m = this.useLocalTime() ? d.getMinutes() : d.getUTCMinutes();
    const s = this.useLocalTime() ? d.getSeconds() : d.getUTCSeconds();
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  generateStintPlan() {
    const count = Math.ceil(this.stintsNeeded());
    this.store.generateEmptyStints(count, this.maxLaps());
    this.store.recalculateTimeline(this.fuelPerLap(), this.avgLapTime(), this.tankCapacity());
  }

  updateStintDriver(stintIndex: number, driverId: string) {
    this.store.updateStintDriver(stintIndex, driverId);
    this.store.recalculateTimeline(this.fuelPerLap(), this.avgLapTime(), this.tankCapacity());
  }

  updateStintTires(stintIndex: number, change: boolean) {
    this.store.updateStintFields(stintIndex, { changeTires: change });
    this.store.recalculateTimeline(this.fuelPerLap(), this.avgLapTime(), this.tankCapacity());
  }

  updateStintExtraTime(stintIndex: number, seconds: number) {
    this.store.updateStintFields(stintIndex, { additionalTimeMs: (seconds || 0) * 1000 });
    this.store.recalculateTimeline(this.fuelPerLap(), this.avgLapTime(), this.tankCapacity());
  }

  drop(event: CdkDragDrop<string[]>) {
    this.store.reorderStints(event.previousIndex, event.currentIndex);
    this.store.recalculateTimeline(this.fuelPerLap(), this.avgLapTime(), this.tankCapacity());
  }

  trackByEventId = (_: number, e: { id: string }) => e.id;
  trackByVehicleId = (_: number, v: { id: string }) => v.id;
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

  toggleTimeMode() {
    this.useLocalTime.set(!this.useLocalTime());
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
    if (!this.store.activeStrategyId()) {
      const name = this.store.activeStrategyName() || 'New Strategy';
      const created = await this.api.createStrategy(
        name, this.selectedEventId(), this.selectedVehicleId(),
        this.avgLapTime(), this.fuelPerLap(),
        this.store.activeEventStartTime() || undefined
      );
      this.store.activeStrategyId.set(created.id);
      this.store.activeStrategyName.set(name);
      await this.saveStintsAndDrivers(created.id);
      await this.loadLibrary();
    } else {
      const id = this.store.activeStrategyId()!;
      await this.api.updateStrategy(id, {
        eventId: this.selectedEventId(), vehicleId: this.selectedVehicleId(),
        avgLapTimeMs: this.avgLapTime(), fuelPerLap: this.fuelPerLap(),
        pitStopFuelOnlyMs: this.store.pitStopFuelOnlyMs(),
        pitStopTiresMs: this.store.pitStopTiresMs(),
        eventStartTime: this.store.activeEventStartTime(),
      } as any);
      await this.saveStintsAndDrivers(id);
      await this.loadLibrary();
    }
    this.isDirty.set(false);
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
      this.selectedEventId.set('');
      this.selectedVehicleId.set('');
      this.fuelPerLap.set(0);
      this.lapMin.set(0);
      this.lapSec.set(0);
      this.lapMs.set(0);
      this.tankCapacityOverride.set(null);
    }
    this.isDirty.set(false);
  }
}
