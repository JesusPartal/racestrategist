import { Injectable, signal, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import {
  TelemetryPacket,
  TelemetryConnectionStatus,
  PitStopDetection,
} from '../models/race-strategy.model';

const DEFAULT_WS_URL = 'ws://localhost:8080';
const RECONNECT_DELAY_MS = 3000;
const PIT_SPEED_THRESHOLD = 5;

@Injectable({ providedIn: 'root' })
export class TelemetryService {
  private auth = inject(AuthService);
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private lastCompletedLap = 0;

  connectionStatus = signal<TelemetryConnectionStatus>(TelemetryConnectionStatus.DISCONNECTED);
  lastPacket = signal<TelemetryPacket | null>(null);
  isInPit = signal(false);
  pitStop = signal<PitStopDetection>({ inPit: false, enteredAt: null, exitedAt: null, durationMs: 0 });
  consecutiveFails = signal(0);

  currentSpeed = computed(() => this.lastPacket()?.car.speed ?? 0);
  currentRpm = computed(() => this.lastPacket()?.car.rpm ?? 0);
  currentGear = computed(() => this.lastPacket()?.car.gear ?? 0);
  currentLap = computed(() => this.lastPacket()?.lapDetails.currentLap ?? 0);
  currentLapTime = computed(() => this.lastPacket()?.lapDetails.lapTimeCurrent ?? 0);
  distancePercentage = computed(() => this.lastPacket()?.lapDetails.distancePercentage ?? 0);
  isConnected = computed(() => this.connectionStatus() === TelemetryConnectionStatus.CONNECTED);

  activeStintIndex = signal<number>(1);
  actualLapTimes = signal<number[]>([]);
  lastStintCompleted = signal<number | null>(null);
  pitExited = signal<number | null>(null);

  /** Driver ID from the relay packet (multi-PC support) */
  activeDriverId = signal<string | null>(null);

  actualPitStopDurations = signal<number[]>([]);
  lastPitDurationMs = computed(() => {
    const d = this.actualPitStopDurations();
    return d.length > 0 ? d[d.length - 1] : 0;
  });
  avgPitDurationMs = computed(() => {
    const d = this.actualPitStopDurations();
    return d.length > 0 ? d.reduce((a, b) => a + b, 0) / d.length : 0;
  });

  fuelLevel = computed(() => this.lastPacket()?.car.fuelLevel ?? 0);
  fuelLevelPct = computed(() => (this.lastPacket()?.car.fuelLevelPct ?? 0) * 100);
  lastLapTime = computed(() => this.lastPacket()?.lapDetails.lastLapTime ?? 0);
  trackTemp = computed(() => this.lastPacket()?.lapDetails.trackTemp ?? 0);
  airTemp = computed(() => this.lastPacket()?.lapDetails.airTemp ?? 0);
  sessionElapsedMs = computed(() => {
    const s = this.lastPacket()?.lapDetails.sessionTime;
    return s != null ? s * 1000 : 0;
  });
  sessionRemainingMs = computed(() => {
    const s = this.lastPacket()?.lapDetails.sessionTimeRemain;
    return s != null ? s * 1000 : 0;
  });

  connect(url: string = DEFAULT_WS_URL): void {
    if (this.ws) this.disconnect();
    this.connectionStatus.set(TelemetryConnectionStatus.CONNECTING);

    this.activeStintIndex.set(1);
    this.actualLapTimes.set([]);
    this.lastStintCompleted.set(null);
    this.pitExited.set(null);
    this.lastCompletedLap = 0;
    this.activeDriverId.set(null);
    this.resetFuelTracking();

    try {
      this.ws = new WebSocket(url);
    } catch {
      this.connectionStatus.set(TelemetryConnectionStatus.DISCONNECTED);
      this.scheduleReconnect(url);
      return;
    }

    this.ws.onopen = () => {
      this.connectionStatus.set(TelemetryConnectionStatus.CONNECTED);
      this.consecutiveFails.set(0);
    };

    this.ws.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data);

        // Handle relay-wrapped packets
        const packet: TelemetryPacket = raw.type === 'telemetry' ? raw : raw;

        // Handle relay snapshot (initial state)
        if (raw.type === 'snapshot') {
          this.handleSnapshot(raw.agents);
          return;
        }

        // Extract driverId from relay packet
        if (raw.driverId) {
          this.activeDriverId.set(raw.driverId);
        }

        this.lastPacket.set(packet);
        this.detectLapCompletion(packet);
        this.detectPitStop(packet);
        this.consecutiveFails.set(0);
      } catch { /* ignore malformed packets */ }
    };

    this.ws.onclose = () => {
      this.connectionStatus.set(TelemetryConnectionStatus.DISCONNECTED);
      this.ws = null;
      this.scheduleReconnect(url);
    };

    this.ws.onerror = () => {
      this.consecutiveFails.update(v => v + 1);
    };
  }

  /** Connect via the backend telemetry relay (multi-PC support) */
  connectRelay(relayUrl: string = environment.telemetryRelayUrl): void {
    const token = this.auth.token();
    if (!token) {
      console.warn('Telemetry: no auth token available for relay connection');
      this.connectionStatus.set(TelemetryConnectionStatus.DISCONNECTED);
      return;
    }
    const url = `${relayUrl}?token=${encodeURIComponent(token)}`;
    this.connect(url);
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.connectionStatus.set(TelemetryConnectionStatus.DISCONNECTED);
    this.lastPacket.set(null);
    this.isInPit.set(false);
    this.pitStop.set({ inPit: false, enteredAt: null, exitedAt: null, durationMs: 0 });
    this.activeDriverId.set(null);
  }

  resetPitDetection(): void {
    this.pitStop.set({ inPit: false, enteredAt: null, exitedAt: null, durationMs: 0 });
  }

  private scheduleReconnect(url: string): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(url);
    }, RECONNECT_DELAY_MS);
  }

  private lapStartFuel = 0;
  actualFuelPerLapValues = signal<number[]>([]);
  actualAvgLapTimeValues = signal<number[]>([]);

  actualFuelPerLap = computed(() => {
    const values = this.actualFuelPerLapValues();
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  });

  actualAvgLapTime = computed(() => {
    const values = this.actualAvgLapTimeValues();
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  });

  fuelDeviation = computed(() => {
    const planned = this._plannedFuelPerLap();
    const actual = this.actualFuelPerLap();
    if (planned <= 0 || actual <= 0) return 0;
    return ((actual - planned) / planned) * 100;
  });

  paceDeviation = computed(() => {
    const planned = this._plannedAvgLapTime();
    const actual = this.actualAvgLapTime();
    if (planned <= 0 || actual <= 0) return 0;
    return ((actual - planned) / planned) * 100;
  });

  private _plannedFuelPerLap = signal(0);
  private _plannedAvgLapTime = signal(0);

  setPlannedValues(fuelPerLap: number, avgLapTimeMs: number): void {
    this._plannedFuelPerLap.set(fuelPerLap);
    this._plannedAvgLapTime.set(avgLapTimeMs);
  }

  resetFuelTracking(): void {
    this.lapStartFuel = 0;
    this.actualFuelPerLapValues.set([]);
    this.actualAvgLapTimeValues.set([]);
  }

  private handleSnapshot(agents: Record<string, any>): void {
    // Pick the agent with the most recent timestamp
    let latest: any = null;
    let latestDriverId: string | null = null;
    for (const [id, data] of Object.entries(agents)) {
      if (data && (!latest || data.timestamp > latest.timestamp)) {
        latest = data;
        latestDriverId = id;
      }
    }
    if (latest) {
      this.lastPacket.set(latest);
      this.activeDriverId.set(latestDriverId);
    }
  }

  private detectLapCompletion(packet: TelemetryPacket): void {
    const currentLap = packet.lapDetails.currentLap;
    if (currentLap > this.lastCompletedLap && this.lastCompletedLap > 0) {
      const lapTime = packet.lapDetails.lastLapTime || packet.lapDetails.lapTimeCurrent;
      if (lapTime > 0) {
        this.actualAvgLapTimeValues.update(t => [...t, lapTime * 1000]);
        this.actualLapTimes.update(times => [...times, lapTime]);
      }

      const fuelNow = packet.car.fuelLevel ?? 0;
      if (this.lapStartFuel > 0 && fuelNow > 0) {
        const fuelUsed = this.lapStartFuel - fuelNow;
        if (fuelUsed > 0 && fuelUsed < 50) {
          this.actualFuelPerLapValues.update(v => [...v, fuelUsed]);
        }
      }
      this.lapStartFuel = fuelNow;
    } else if (currentLap === 1 && this.lastCompletedLap === 0) {
      this.lapStartFuel = packet.car.fuelLevel ?? 0;
    }
    this.lastCompletedLap = currentLap;
  }

  private detectPitStop(packet: TelemetryPacket): void {
    const speed = packet.car.speed;
    const now = packet.timestamp;
    const current = this.pitStop();

    if (speed < PIT_SPEED_THRESHOLD && !current.inPit) {
      this.pitStop.set({
        inPit: true,
        enteredAt: now,
        exitedAt: null,
        durationMs: 0,
      });
      this.isInPit.set(true);
    } else if (speed >= PIT_SPEED_THRESHOLD && current.inPit) {
      const durationMs = current.enteredAt !== null ? now - current.enteredAt : 0;
      this.pitStop.set({
        inPit: false,
        enteredAt: current.enteredAt,
        exitedAt: now,
        durationMs,
      });
      this.isInPit.set(false);
      this.pitExited.set(now);
      if (durationMs > 1000) {
        this.actualPitStopDurations.update(d => [...d, durationMs]);
      }
      this.activeStintIndex.update(i => i + 1);
      this.lastStintCompleted.set(this.activeStintIndex() - 1);
    } else if (current.inPit && current.enteredAt !== null) {
      this.pitStop.update(v => ({ ...v, durationMs: now - v.enteredAt! }));
    }
  }

  resetPitStopDurations(): void {
    this.actualPitStopDurations.set([]);
  }

  resetStintTracking(): void {
    this.activeStintIndex.set(1);
    this.actualLapTimes.set([]);
    this.lastStintCompleted.set(null);
    this.pitExited.set(null);
    this.lastCompletedLap = 0;
    this.resetPitStopDurations();
  }
}
