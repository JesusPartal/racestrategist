import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE } from '../api.config';
import { lastValueFrom } from 'rxjs';

export interface AgentTokenDto {
  id: string;
  teamId: string;
  driverId: string;
  driverName: string;
  token: string;
  createdAt: number;
  expiresAt: number;
  lastUsedAt: number | null;
  createdBy: string;
}

export interface RelayConfig {
  relayUrl: string;
}

@Injectable({ providedIn: 'root' })
export class TelemetryApiService {
  private http = inject(HttpClient);

  async getRelayConfig(): Promise<RelayConfig> {
    return lastValueFrom(
      this.http.get<RelayConfig>(`${API_BASE}/telemetry/config`)
    );
  }

  async listAgentTokens(): Promise<AgentTokenDto[]> {
    return lastValueFrom(
      this.http.get<AgentTokenDto[]>(`${API_BASE}/telemetry/agent-tokens`)
    );
  }

  async createAgentToken(driverId: string, driverName: string): Promise<AgentTokenDto> {
    return lastValueFrom(
      this.http.post<AgentTokenDto>(`${API_BASE}/telemetry/agent-tokens`, { driverId, driverName })
    );
  }

  async revokeAgentToken(id: string): Promise<void> {
    await lastValueFrom(
      this.http.delete(`${API_BASE}/telemetry/agent-tokens/${id}`)
    );
  }
}
