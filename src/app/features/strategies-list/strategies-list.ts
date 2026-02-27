import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StrategyService } from '../../core/services/strategy.service';
import { RaceStrategy } from '../../core/models/race-strategy.model';

@Component({
  selector: 'app-strategies-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="strategies-container">
      <div class="header-section animate-in">
        <h1 style="font-family: var(--font-display); font-weight: 800; font-size: 2rem; margin: 0;">
          STRATEGY <span style="color: var(--accent-color);">LIBRARY</span>
        </h1>
        <p style="color: var(--text-dim); margin-top: 10px;">
          Manage and load your saved race configurations.
        </p>
      </div>

      <div class="search-bar animate-in stagger-1">
        <div style="position: relative; flex: 1;">
          <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 15px; top: 15px; color: var(--text-dim);"></i>
          <input type="text" [value]="searchQuery()" (input)="updateSearch($event)" placeholder="Filter by event, car or name..."
                 style="padding-left: 45px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);">
        </div>
        <button class="primary-btn" (click)="newStrategy()">+ NEW STRATEGY</button>
      </div>

      <div class="strategies-grid stagger-2">
        <div *ngFor="let strat of filteredStrategies()" class="glass-card strategy-card animate-in" (click)="loadStrategy(strat)">
          <div class="card-header">
            <span class="track-tag">iRACING_CIRCUIT</span>
            <span class="date">{{ strat.lastModified | date:'MMM dd, HH:mm' }}</span>
          </div>

          <h3 class="strat-title">{{ strat.name }}</h3>

          <div class="strat-details">
            <div class="detail-item">
              <span class="label">VEHICLE</span>
              <span class="val">{{ strat.vehicleName }}</span>
            </div>
            <div class="detail-item">
              <span class="label">STINTS</span>
              <span class="val">{{ strat.stints.length }} Sessions</span>
            </div>
            <div class="detail-item">
              <span class="label">FUEL / LAP</span>
              <span class="val">{{ strat.fuelPerLap | number:'1.1-2' }} L</span>
            </div>
            <div class="detail-item">
              <span class="label">DRIVERS</span>
              <span class="val">{{ strat.drivers?.length || 0 }} Configured</span>
            </div>
          </div>

          <div class="card-footer">
            <div class="pit-icons">
              <div class="icon-tooltip-wrap">
                <i class="fa-solid fa-gas-pump" [style.color]="'var(--accent-color)'"></i>
                <div class="icon-tooltip">
                  <div class="tooltip-title">⛽ Pit Stop Times</div>
                  <div class="tooltip-row">
                    <span>Fuel only:</span><strong>{{ strat.pitStopFuelOnlyMs / 1000 }}s</strong>
                  </div>
                  <div class="tooltip-row">
                    <span>With tires:</span><strong>{{ strat.pitStopTiresMs / 1000 }}s</strong>
                  </div>
                </div>
              </div>
              <div class="icon-tooltip-wrap">
                <i class="fa-solid fa-gear" [style.color]="hasTireChanges(strat) ? 'var(--success-color)' : 'var(--text-dim)'"></i>
                <div class="icon-tooltip">
                  <div class="tooltip-title">⚙️ Tire Strategy</div>
                  <div class="tooltip-row" *ngIf="hasTireChanges(strat)">
                    <span>Tire changes:</span><strong style="color: var(--success-color);">{{ countTireChanges(strat) }} stints</strong>
                  </div>
                  <div class="tooltip-row" *ngIf="!hasTireChanges(strat)">
                    <span style="color: var(--text-dim);">No tire changes planned</span>
                  </div>
                </div>
              </div>
              <div class="icon-tooltip-wrap" *ngIf="strat.drivers?.length">
                <i class="fa-solid fa-user-group" style="color: var(--text-dim);"></i>
                <div class="icon-tooltip">
                  <div class="tooltip-title">👤 Drivers</div>
                  <div class="tooltip-row" *ngFor="let d of strat.drivers">
                    <span [style.color]="d.accentColor">▌</span> <span>{{ d.name }}</span>
                  </div>
                </div>
              </div>
            </div>
            <button class="load-btn" (click)="loadStrategy(strat); $event.stopPropagation()">LOAD_MODULE</button>
          </div>

          <div class="card-glow"></div>
        </div>

        <div *ngIf="filteredStrategies().length === 0" class="empty-state glass-card">
          <i class="fa-solid fa-ghost" style="font-size: 3rem; color: var(--text-dim); margin-bottom: 20px;"></i>
          <h3>No Strategies Found</h3>
          <p style="color: var(--text-dim);">Try a different search query or create a new strategy.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .strategies-container { padding: 20px 0; }
    .header-section { margin-bottom: 40px; }
    .search-bar { display: flex; gap: 20px; margin-bottom: 40px; align-items: center; }
    .strategies-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 30px;
    }
    .strategy-card {
      position: relative; cursor: pointer; display: flex; flex-direction: column;
      gap: 20px; overflow: visible; border-left: 2px solid transparent; transition: var(--transition);
    }
    .strategy-card:hover { border-left-color: var(--accent-color); background: rgba(255, 176, 0, 0.03); transform: scale(1.02); }
    .card-header { display: flex; justify-content: space-between; align-items: center; }
    .track-tag {
      font-size: 0.55rem; letter-spacing: 2px; color: var(--accent-color); font-weight: 800;
      background: rgba(255, 176, 0, 0.1); padding: 3px 8px; border-radius: 4px;
    }
    .date { font-family: monospace; font-size: 0.7rem; color: var(--text-dim); }
    .strat-title { font-family: var(--font-display); font-size: 1.1rem; margin: 0; line-height: 1.4; }
    .strat-details {
      display: grid; grid-template-columns: 1fr 1fr; gap: 15px;
      padding: 15px 0; border-top: 1px solid rgba(255,255,255,0.05);
    }
    .detail-item { display: flex; flex-direction: column; gap: 5px; }
    .label { font-size: 0.6rem; color: var(--text-dim); letter-spacing: 1px; }
    .val { font-size: 0.85rem; font-weight: 700; color: #fff; }
    .card-footer { margin-top: auto; display: flex; justify-content: space-between; align-items: center; }
    .pit-icons { display: flex; gap: 16px; align-items: center; }

    /* Tooltip */
    .icon-tooltip-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }
    .icon-tooltip-wrap i {
      font-size: 1rem;
      cursor: help;
      transition: 0.2s;
    }
    .icon-tooltip-wrap:hover i { transform: scale(1.2); }
    .icon-tooltip {
      position: absolute;
      bottom: calc(100% + 14px);
      left: 50%;
      transform: translateX(-50%);
      background: #111;
      border: 1px solid rgba(255,255,255,0.12);
      box-shadow: 0 15px 40px rgba(0,0,0,0.7);
      padding: 12px 15px;
      border-radius: 10px;
      min-width: 180px;
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 100;
      white-space: nowrap;
    }
    .icon-tooltip::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 7px solid transparent;
      border-top-color: rgba(255,255,255,0.12);
    }
    .icon-tooltip::before {
      content: '';
      position: absolute;
      top: calc(100% + 1px);
      left: 50%;
      transform: translateX(-50%);
      border: 6px solid transparent;
      border-top-color: #111;
      z-index: 1;
    }
    .icon-tooltip-wrap:hover .icon-tooltip { opacity: 1; visibility: visible; }
    .tooltip-title {
      font-size: 0.65rem; font-weight: 800; letter-spacing: 1px;
      color: var(--accent-color); margin-bottom: 8px; padding-bottom: 6px;
      border-bottom: 1px solid rgba(255,255,255,0.07);
    }
    .tooltip-row {
      display: flex; justify-content: space-between; gap: 15px;
      font-size: 0.72rem; color: #ccc; margin-top: 4px;
    }
    .tooltip-row strong { color: #fff; }

    .load-btn {
      background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #fff;
      padding: 6px 15px; font-family: var(--font-display); font-size: 0.6rem; font-weight: 700;
      letter-spacing: 1px; border-radius: 4px; transition: 0.3s; cursor: pointer;
    }
    .strategy-card:hover .load-btn { background: var(--accent-color); color: black; border-color: var(--accent-color); }
    .empty-state { grid-column: 1 / -1; text-align: center; padding: 100px 20px; }
    input { margin-bottom: 0; }
    .primary-btn {
      background: var(--accent-color); color: black; border: none; padding: 12px 25px;
      border-radius: 8px; font-family: var(--font-display); font-weight: 800;
      font-size: 0.75rem; letter-spacing: 1px; cursor: pointer;
    }
    .card-glow {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: radial-gradient(circle at top right, rgba(255, 176, 0, 0.05), transparent 70%);
      pointer-events: none;
    }
  `]
})
export class StrategiesListComponent {
  strategyService = inject(StrategyService);
  router = inject(Router);
  searchQuery = signal('');

  filteredStrategies = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.strategyService.savedStrategies().filter(s =>
      s.name.toLowerCase().includes(query) ||
      s.vehicleName.toLowerCase().includes(query)
    );
  });

  updateSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  hasTireChanges(strat: RaceStrategy): boolean {
    return strat.stints.some(s => s.changeTires);
  }

  countTireChanges(strat: RaceStrategy): number {
    return strat.stints.filter(s => s.changeTires).length;
  }

  loadStrategy(strat: RaceStrategy) {
    this.strategyService.loadStrategy(strat.id);
    this.router.navigate(['/strategy']);
  }

  newStrategy() {
    this.strategyService.clearActive();
    this.router.navigate(['/strategy']);
  }
}
