import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StrategyStore } from '../../core/services/strategy-store.service';
import { StrategyApiService } from '../../core/services/strategy-api.service';
import { CatalogService } from '../../core/services/catalog.service';
import { StrategySummary } from '../../core/models/race-strategy.model';

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
          <input type="text" [value]="searchQuery()" (input)="updateSearch($event)" placeholder="Filter by name or car..."
                 style="padding-left: 45px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);">
        </div>
        <button class="primary-btn" (click)="newStrategy()">+ NEW STRATEGY</button>
      </div>

      <div *ngIf="loading()" class="loading-state glass-card">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; color: var(--accent-color);"></i>
        <p style="color: var(--text-dim); margin-top: 15px;">Loading strategies...</p>
      </div>

      <div *ngIf="error()" class="error-state glass-card">
        <i class="fa-solid fa-circle-exclamation" style="font-size: 2rem; color: #ff5252;"></i>
        <p style="color: #ff5252; margin-top: 10px;">{{ error() }}</p>
        <button class="primary-btn" style="margin-top: 15px;" (click)="ngOnInit()">RETRY</button>
      </div>

      <div class="strategies-grid stagger-2" *ngIf="!loading() && !error()">
        <div *ngFor="let strat of filteredStrategies(); trackBy: trackByStrategyId" class="glass-card strategy-card animate-in" (click)="loadStrategy(strat)">
          <div class="card-header">
            <span class="track-tag">iRACING_STRATEGY</span>
            <span class="date">{{ strat.lastModified | date:'MMM dd, HH:mm' }}</span>
          </div>

          <h3 class="strat-title">{{ strat.name }}</h3>

          <div class="strat-details">
            <div class="detail-item">
              <span class="label">VEHICLE</span>
              <span class="val">{{ strat.vehicleName || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">STINTS</span>
              <span class="val">{{ strat.stintCount }} Sessions</span>
            </div>
            <div class="detail-item">
              <span class="label">DRIVERS</span>
              <span class="val">{{ strat.driverCount }} Configured</span>
            </div>
          </div>

          <div class="card-footer">
            <button class="load-btn" (click)="loadStrategy(strat); $event.stopPropagation()">LOAD_MODULE</button>
          </div>

          <div class="card-glow"></div>
        </div>

        <div *ngIf="filteredStrategies().length === 0" class="empty-state glass-card">
          <i class="fa-solid fa-ghost" style="font-size: 3rem; color: var(--text-dim); margin-bottom: 20px;"></i>
          <h3>No Strategies Found</h3>
          <p style="color: var(--text-dim);">Create a new strategy from the calculator.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .strategies-container { padding: 20px 0; }
    .header-section { margin-bottom: 40px; }
    .search-bar { display: flex; gap: 20px; margin-bottom: 40px; align-items: center; }
    .strategies-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 30px; }
    .strategy-card { position: relative; cursor: pointer; display: flex; flex-direction: column; gap: 20px; overflow: visible; border-left: 2px solid transparent; transition: var(--transition); }
    .strategy-card:hover { border-left-color: var(--accent-color); background: rgba(255, 176, 0, 0.03); transform: scale(1.02); }
    .card-header { display: flex; justify-content: space-between; align-items: center; }
    .track-tag { font-size: 0.55rem; letter-spacing: 2px; color: var(--accent-color); font-weight: 800; background: rgba(255, 176, 0, 0.1); padding: 3px 8px; border-radius: 4px; }
    .date { font-family: monospace; font-size: 0.7rem; color: var(--text-dim); }
    .strat-title { font-family: var(--font-display); font-size: 1.1rem; margin: 0; line-height: 1.4; }
    .strat-details { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 15px 0; border-top: 1px solid rgba(255,255,255,0.05); }
    .detail-item { display: flex; flex-direction: column; gap: 5px; }
    .label { font-size: 0.6rem; color: var(--text-dim); letter-spacing: 1px; }
    .val { font-size: 0.85rem; font-weight: 700; color: #fff; }
    .card-footer { margin-top: auto; display: flex; justify-content: flex-end; }
    .load-btn { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 6px 15px; font-family: var(--font-display); font-size: 0.6rem; font-weight: 700; letter-spacing: 1px; border-radius: 4px; transition: 0.3s; cursor: pointer; }
    .strategy-card:hover .load-btn { background: var(--accent-color); color: black; border-color: var(--accent-color); }
    .empty-state { grid-column: 1 / -1; text-align: center; padding: 100px 20px; }
    .loading-state, .error-state { grid-column: 1 / -1; text-align: center; padding: 80px 20px; }
    input { margin-bottom: 0; }
    .primary-btn { background: var(--accent-color); color: black; border: none; padding: 12px 25px; border-radius: 8px; font-family: var(--font-display); font-weight: 800; font-size: 0.75rem; letter-spacing: 1px; cursor: pointer; }
    .card-glow { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at top right, rgba(255, 176, 0, 0.05), transparent 70%); pointer-events: none; }
  `]
})
export class StrategiesListComponent implements OnInit {
  store = inject(StrategyStore);
  api = inject(StrategyApiService);
  catalog = inject(CatalogService);
  router = inject(Router);
  searchQuery = signal('');
  trackByStrategyId = (_: number, s: StrategySummary) => s.id;

  filteredStrategies = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.store.savedStrategies().filter(s =>
      s.name.toLowerCase().includes(query) ||
      s.vehicleName.toLowerCase().includes(query)
    );
  });

  loading = computed(() => this.store.loading());
  error = computed(() => this.store.error());

  ngOnInit() {
    this.loadLibrary();
  }

  private async loadLibrary() {
    try {
      const list = await this.api.loadLibrary();
      this.store.savedStrategies.set(list);
    } catch {
      this.store.error.set('Failed to load strategies');
    }
  }

  updateSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  async loadStrategy(strat: StrategySummary) {
    try {
      const data = await this.api.loadStrategy(strat.id);
      if (data) {
        this.store.applyLoadedStrategy(data);
        this.router.navigate(['/strategy']);
      }
    } catch {
      this.store.error.set('Failed to load strategy');
    }
  }

  newStrategy() {
    this.store.clearActive();
    this.router.navigate(['/strategy']);
  }
}
