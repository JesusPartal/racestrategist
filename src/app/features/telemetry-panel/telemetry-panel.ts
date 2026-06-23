import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TelemetryService } from '../../core/services/telemetry.service';
import { TranslationService } from '../../core/services/translation.service';
import { TelemetryConnectionStatus, StintPlanItem } from '../../core/models/race-strategy.model';

@Component({
  selector: 'app-telemetry-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './telemetry-panel.html',
  styleUrl: './telemetry-panel.css'
})
export class TelemetryPanelComponent {
  Math = Math;
  telemetry = inject(TelemetryService);
  trans = inject(TranslationService);

  stintPlan = input<StintPlanItem[]>([]);
  connect = output<void>();
  disconnect = output<void>();

  connectionStatus = TelemetryConnectionStatus;

  formatSpeed(speed: number): string {
    return speed.toFixed(0);
  }

  formatLapTime(seconds: number): string {
    if (!seconds || seconds <= 0) return '--:--.---';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }

  formatDistance(pct: number): string {
    return pct.toFixed(1);
  }

  detectStintTransition(packet: any): number | null {
    const lap = packet?.lapDetails?.currentLap;
    if (!lap) return null;
    const plan = this.stintPlan();
    let accumulatedLaps = 0;
    for (const stint of plan) {
      accumulatedLaps += stint.laps;
      if (lap <= accumulatedLaps) return stint.index;
    }
    return null;
  }

  onConnectClick() {
    this.connect.emit();
  }

  onDisconnectClick() {
    this.disconnect.emit();
  }
}
