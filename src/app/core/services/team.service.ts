import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE } from '../api.config';
import { DriverProfile } from '../models/race-strategy.model';
import { lastValueFrom } from 'rxjs';

export interface TeamSettings {
  teamName: string;
}

@Injectable({ providedIn: 'root' })
export class TeamService {
  private http = inject(HttpClient);

  roster = signal<DriverProfile[]>([]);
  settings = signal<TeamSettings>({ teamName: 'My Racing Team' });
  loading = signal(false);
  error = signal<string | null>(null);

  avgIRating = computed(() => {
    const drivers = this.roster().filter(d => d.iRating);
    if (!drivers.length) return 0;
    return Math.round(drivers.reduce((s, d) => s + (d.iRating || 0), 0) / drivers.length);
  });

  async loadSettings(): Promise<void> {
    try {
      const settings = await lastValueFrom(
        this.http.get<{ teamName: string }>(`${API_BASE}/team/settings`)
      );
      this.settings.set(settings);
    } catch {
      // default settings already set
    }
  }

  async saveSettings(updates: Partial<TeamSettings>): Promise<void> {
    try {
      await lastValueFrom(
        this.http.put(`${API_BASE}/team/settings`, updates)
      );
      this.settings.update(s => ({ ...s, ...updates }));
    } catch {
      this.error.set('Failed to save team settings');
    }
  }

  async loadRoster(page = 1, limit = 50): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const drivers = await lastValueFrom(
        this.http.get<DriverProfile[]>(`${API_BASE}/team/drivers?page=${page}&limit=${limit}`)
      );
      this.roster.set(drivers);
    } catch {
      this.roster.set([]);
      this.error.set('Failed to load team roster');
    } finally {
      this.loading.set(false);
    }
  }

  async addDriver(driver: Omit<DriverProfile, 'id'>) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const created = await lastValueFrom(
        this.http.post<DriverProfile>(`${API_BASE}/team/drivers`, driver)
      );
      this.roster.update(r => [...r, created]);
    } catch {
      this.error.set('Failed to add driver');
    } finally {
      this.loading.set(false);
    }
  }

  async updateDriver(id: string, updates: Partial<DriverProfile>) {
    const driver = this.roster().find(d => d.id === id);
    if (!driver) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      await lastValueFrom(
        this.http.put(`${API_BASE}/team/drivers/${id}`, { ...driver, ...updates })
      );
      this.roster.update(r => r.map(d => d.id === id ? { ...d, ...updates } : d));
    } catch {
      this.error.set('Failed to update driver');
    } finally {
      this.loading.set(false);
    }
  }

  async removeDriver(id: string) {
    this.loading.set(true);
    this.error.set(null);
    try {
      await lastValueFrom(
        this.http.delete(`${API_BASE}/team/drivers/${id}`)
      );
      this.roster.update(r => r.filter(d => d.id !== id));
    } catch {
      this.error.set('Failed to remove driver');
    } finally {
      this.loading.set(false);
    }
  }

  updateSettings(updates: Partial<TeamSettings>) {
    this.settings.update(s => ({ ...s, ...updates }));
    this.saveSettings(updates);
  }

  formatLapTime(ms: number): string {
    if (!ms) return '—';
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const msRem = ms % 1000;
    return `${m}:${s.toString().padStart(2, '0')}.${msRem.toString().padStart(3, '0')}`;
  }
}
