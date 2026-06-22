import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE } from '../api.config';
import { RaceStrategy, StrategySummary, DriverProfile } from '../models/race-strategy.model';
import { lastValueFrom } from 'rxjs';
import { CatalogService } from './catalog.service';

interface StrategySummaryDto {
  id: string;
  name: string;
  vehicleId: string;
  vehicleName: string;
  stintCount: number;
  driverCount: number;
  lastModified: number;
}

@Injectable({ providedIn: 'root' })
export class StrategyApiService {
  private http = inject(HttpClient);
  private catalog = inject(CatalogService);

  async loadLibrary(page = 1, limit = 50): Promise<StrategySummary[]> {
    const list = await lastValueFrom(
      this.http.get<StrategySummaryDto[]>(`${API_BASE}/strategies?page=${page}&limit=${limit}`)
    );
    const results: StrategySummary[] = [];
    for (const dto of list) {
      const vehicleName = dto.vehicleName || await this.catalog.resolveVehicleName(dto.vehicleId ?? '') || '—';
      results.push({
        id: dto.id,
        name: dto.name,
        vehicleId: dto.vehicleId,
        vehicleName,
        stintCount: dto.stintCount,
        driverCount: dto.driverCount,
        lastModified: dto.lastModified,
      });
    }
    return results;
  }

  async loadStrategy(id: string): Promise<RaceStrategy | null> {
    const data = await lastValueFrom(
      this.http.get<RaceStrategy>(`${API_BASE}/strategies/${id}`)
    );
    if (data && data.vehicleId) {
      data.vehicleName = await this.catalog.resolveVehicleName(data.vehicleId);
    }
    return data;
  }

  async createStrategy(name: string, eventId: string, vehicleId: string, avgLapTimeMs: number, fuelPerLap: number): Promise<RaceStrategy> {
    return lastValueFrom(
      this.http.post<RaceStrategy>(`${API_BASE}/strategies`, { name, eventId, vehicleId, avgLapTimeMs, fuelPerLap })
    );
  }

  async updateStrategy(id: string, payload: Partial<RaceStrategy>): Promise<void> {
    await lastValueFrom(
      this.http.put(`${API_BASE}/strategies/${id}`, payload)
    );
  }

  async deleteStrategy(id: string): Promise<void> {
    await lastValueFrom(
      this.http.delete(`${API_BASE}/strategies/${id}`)
    );
  }

  async updateStints(strategyId: string, stints: any[]): Promise<void> {
    await lastValueFrom(
      this.http.put(`${API_BASE}/strategies/${strategyId}/stints`, { stints })
    );
  }

  async updateDrivers(strategyId: string, drivers: DriverProfile[]): Promise<void> {
    await lastValueFrom(
      this.http.put(`${API_BASE}/strategies/${strategyId}/drivers`, { drivers })
    );
  }
}
