import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE } from '../api.config';
import { IRacingEvent, Vehicle } from '../models/race-strategy.model';
import { lastValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private http = inject(HttpClient);

  private eventsCache: IRacingEvent[] | null = null;
  private vehiclesCache = new Map<string, Vehicle[]>();
  private allVehiclesCache: Vehicle[] | null = null;

  loading = signal(false);
  error = signal<string | null>(null);

  async getEvents(): Promise<IRacingEvent[]> {
    if (this.eventsCache) return this.eventsCache;
    this.loading.set(true);
    this.error.set(null);
    try {
      this.eventsCache = await lastValueFrom(
        this.http.get<IRacingEvent[]>(`${API_BASE}/catalog/events`)
      );
      return this.eventsCache;
    } catch {
      this.error.set('Failed to load events');
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  async getVehiclesByEvent(eventId: string): Promise<Vehicle[]> {
    if (this.vehiclesCache.has(eventId)) return this.vehiclesCache.get(eventId)!;
    this.loading.set(true);
    this.error.set(null);
    try {
      const vehicles = await lastValueFrom(
        this.http.get<Vehicle[]>(`${API_BASE}/catalog/vehicles?eventId=${eventId}`)
      );
      this.vehiclesCache.set(eventId, vehicles);
      return vehicles;
    } catch {
      this.error.set('Failed to load vehicles');
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  async getVehicleById(id: string): Promise<Vehicle | undefined> {
    if (this.allVehiclesCache) return this.allVehiclesCache.find(v => v.id === id);
    this.loading.set(true);
    this.error.set(null);
    try {
      this.allVehiclesCache = await lastValueFrom(
        this.http.get<Vehicle[]>(`${API_BASE}/catalog/vehicles`)
      );
      return this.allVehiclesCache.find(v => v.id === id);
    } catch {
      this.error.set('Failed to load vehicles');
      return undefined;
    } finally {
      this.loading.set(false);
    }
  }

  async resolveVehicleName(vehicleId: string): Promise<string> {
    const v = await this.getVehicleById(vehicleId);
    return v?.name || 'Unknown Vehicle';
  }

  invalidateCache() {
    this.eventsCache = null;
    this.vehiclesCache.clear();
    this.allVehiclesCache = null;
  }
}
