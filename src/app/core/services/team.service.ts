import { Injectable, signal, computed } from '@angular/core';
import { DriverProfile } from '../models/race-strategy.model';

export interface TeamSettings {
    teamName: string;
    defaultPitFuelOnlyS: number;
    defaultPitTiresS: number;
}

@Injectable({ providedIn: 'root' })
export class TeamService {
    private readonly STORAGE_KEY = 'rs_team_roster';
    private readonly SETTINGS_KEY = 'rs_team_settings';

    // Team Roster (persisted independently of any active strategy)
    roster = signal<DriverProfile[]>([]);

    // Global team settings
    settings = signal<TeamSettings>({
        teamName: 'My Racing Team',
        defaultPitFuelOnlyS: 45,
        defaultPitTiresS: 65
    });

    // Stats computed from roster
    avgIRating = computed(() => {
        const drivers = this.roster().filter(d => d.iRating);
        if (!drivers.length) return 0;
        return Math.round(drivers.reduce((s, d) => s + (d.iRating || 0), 0) / drivers.length);
    });

    constructor() {
        this.load();
        if (this.roster().length === 0) {
            this.seedMockRoster();
        }
    }

    private load() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) this.roster.set(JSON.parse(raw));
            const sRaw = localStorage.getItem(this.SETTINGS_KEY);
            if (sRaw) this.settings.set(JSON.parse(sRaw));
        } catch { /* ignore */ }
    }

    private save() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.roster()));
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.settings()));
    }

    addDriver(driver: Omit<DriverProfile, 'id'>) {
        const newDriver: DriverProfile = { ...driver, id: crypto.randomUUID() };
        this.roster.update(r => [...r, newDriver]);
        this.save();
    }

    updateDriver(id: string, updates: Partial<DriverProfile>) {
        this.roster.update(r => r.map(d => d.id === id ? { ...d, ...updates } : d));
        this.save();
    }

    removeDriver(id: string) {
        this.roster.update(r => r.filter(d => d.id !== id));
        this.save();
    }

    updateSettings(updates: Partial<TeamSettings>) {
        this.settings.update(s => ({ ...s, ...updates }));
        this.save();
    }

    formatLapTime(ms: number): string {
        if (!ms) return '—';
        const m = Math.floor(ms / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        const msRem = ms % 1000;
        return `${m}:${s.toString().padStart(2, '0')}.${msRem.toString().padStart(3, '0')}`;
    }

    private seedMockRoster() {
        const mock: DriverProfile[] = [
            {
                id: 'td-1', name: 'Marco Rossi', accentColor: '#FFB000',
                avgLapTimeMs: 510000, fuelPerLapL: 12.8, errorFactor: 0.01,
                licenseClass: 'A', iRating: 4850, nationality: '🇮🇹', role: 'Primary'
            },
            {
                id: 'td-2', name: 'Sophie Müller', accentColor: '#2979FF',
                avgLapTimeMs: 514000, fuelPerLapL: 13.1, errorFactor: 0.015,
                licenseClass: 'A', iRating: 4120, nationality: '🇩🇪', role: 'Primary'
            },
            {
                id: 'td-3', name: 'James Park', accentColor: '#00E676',
                avgLapTimeMs: 520000, fuelPerLapL: undefined, errorFactor: 0.02,
                licenseClass: 'B', iRating: 3400, nationality: '🇬🇧', role: 'Reserve'
            }
        ];
        this.roster.set(mock);
        this.save();
    }
}
