import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE } from '../api.config';
import { lastValueFrom } from 'rxjs';

export interface TeamSummary {
  id: string;
  name: string;
  createdAt: number;
  driverCount: number;
}

export interface TeamDriver {
  id: string;
  name: string;
  accentColor: string;
  avgLapTimeMs: number;
  fuelPerLapL: number;
  errorFactor: number;
  licenseClass?: string;
  iRating?: number;
  nationality?: string;
  role?: string;
}

export interface TeamDetail extends TeamSummary {
  drivers: TeamDriver[];
}

@Injectable({ providedIn: 'root' })
export class TeamsService {
  private http = inject(HttpClient);

  async loadTeams(): Promise<TeamSummary[]> {
    return lastValueFrom(this.http.get<TeamSummary[]>(`${API_BASE}/teams`));
  }

  async loadTeam(id: string): Promise<TeamDetail> {
    return lastValueFrom(this.http.get<TeamDetail>(`${API_BASE}/teams/${id}`));
  }

  async createTeam(name: string): Promise<TeamSummary> {
    return lastValueFrom(this.http.post<TeamSummary>(`${API_BASE}/teams`, { name }));
  }

  async updateTeam(id: string, name: string): Promise<void> {
    await lastValueFrom(this.http.put(`${API_BASE}/teams/${id}`, { name }));
  }

  async deleteTeam(id: string): Promise<void> {
    await lastValueFrom(this.http.delete(`${API_BASE}/teams/${id}`));
  }

  async addDriver(teamId: string, driver: Partial<TeamDriver>): Promise<TeamDriver> {
    return lastValueFrom(
      this.http.post<TeamDriver>(`${API_BASE}/teams/${teamId}/drivers`, driver)
    );
  }

  async updateDriver(teamId: string, driverId: string, driver: Partial<TeamDriver>): Promise<TeamDriver> {
    return lastValueFrom(
      this.http.put<TeamDriver>(`${API_BASE}/teams/${teamId}/drivers/${driverId}`, driver)
    );
  }

  async deleteDriver(teamId: string, driverId: string): Promise<void> {
    await lastValueFrom(
      this.http.delete(`${API_BASE}/teams/${teamId}/drivers/${driverId}`)
    );
  }
}