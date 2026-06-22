import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StrategyStore } from '../../core/services/strategy-store.service';
import { StrategyApiService } from '../../core/services/strategy-api.service';
import { CatalogService } from '../../core/services/catalog.service';
import { TranslationService } from '../../core/services/translation.service';
import { StrategySummary } from '../../core/models/race-strategy.model';

interface ConfirmDeleteState {
  id: string;
  name: string;
}

@Component({
  selector: 'app-strategies-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="strategies-container">
      <div class="header-section animate-in">
        <h1 style="font-family: var(--font-display); font-weight: 800; font-size: 2rem; margin: 0;">
          <span style="color: var(--accent-color);">{{ trans.translate('nav_strategy') }}</span> {{ trans.translate('strategy_library') }}
        </h1>
        <p style="color: var(--text-dim); margin-top: 10px;">
          {{ trans.translate('library_subtitle') }}
        </p>
      </div>

      <div class="search-bar animate-in stagger-1">
        <div style="position: relative; flex: 1;">
          <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 15px; top: 15px; color: var(--text-dim);"></i>
          <input type="text" [value]="searchQuery()" (input)="updateSearch($event)" [placeholder]="trans.translate('filter_placeholder')"
                 style="padding-left: 45px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);">
        </div>
        <button class="primary-btn" (click)="newStrategy()">{{ trans.translate('new_strategy_btn') }}</button>
      </div>

      <div *ngIf="loading()" class="loading-state glass-card">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; color: var(--accent-color);"></i>
        <p style="color: var(--text-dim); margin-top: 15px;">{{ trans.translate('loading_strategies') }}</p>
      </div>

      <div *ngIf="error()" class="error-state glass-card">
        <i class="fa-solid fa-circle-exclamation" style="font-size: 2rem; color: #ff5252;"></i>
        <p style="color: #ff5252; margin-top: 10px;">{{ error() }}</p>
        <button class="primary-btn" style="margin-top: 15px;" (click)="ngOnInit()">{{ trans.translate('retry') }}</button>
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
              <span class="label">{{ trans.translate('vehicle') }}</span>
              <span class="val">{{ strat.vehicleName || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">{{ trans.translate('stints') }}</span>
              <span class="val">{{ strat.stintCount }} {{ trans.translate('sessions') }}</span>
            </div>
            <div class="detail-item">
              <span class="label">{{ trans.translate('drivers') }}</span>
              <span class="val">{{ strat.driverCount }} {{ trans.translate('configured') }}</span>
            </div>
          </div>

          <div class="card-footer">
            <button class="load-btn" (click)="loadStrategy(strat); $event.stopPropagation()">{{ trans.translate('load_module') }}</button>
            <button class="invite-btn-card" (click)="openInvite(strat); $event.stopPropagation()" title="Invite">
              <i class="fa-solid fa-link"></i>
            </button>
            <button class="delete-btn-card" (click)="confirmDelete(strat); $event.stopPropagation()">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>

          <div class="card-glow"></div>
        </div>

        <div *ngIf="filteredStrategies().length === 0" class="empty-state glass-card">
          <i class="fa-solid fa-ghost" style="font-size: 3rem; color: var(--text-dim); margin-bottom: 20px;"></i>
          <h3>{{ trans.translate('no_strategies_found') }}</h3>
          <p style="color: var(--text-dim);">{{ trans.translate('no_strategies_desc') }}</p>
        </div>
      </div>
    </div>

    <!-- Invite Modal -->
    <div class="delete-overlay" *ngIf="inviteUrl()" (click)="closeInvite()">
      <div class="delete-modal glass-card animate-in" (click)="$event.stopPropagation()">
        <div class="delete-icon">
          <i class="fa-solid fa-link"></i>
        </div>
        <h3 class="delete-title">{{ trans.translate('invite_title') }}</h3>
        <p class="delete-body">{{ trans.translate('invite_body') }}</p>
        <div class="invite-url-row">
          <input type="text" [value]="inviteUrl()" readonly class="invite-url-input" (click)="$event.target.select()">
          <button class="btn-copy" (click)="copyInvite()">
            <i class="fa-solid fa-copy"></i> {{ trans.translate('copy') }}
          </button>
        </div>
        <div class="delete-actions">
          <button class="btn-delete-cancel" (click)="closeInvite()">{{ trans.translate('close') }}</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="delete-overlay" *ngIf="deleteTarget()" (click)="cancelDelete()">
      <div class="delete-modal glass-card animate-in" (click)="$event.stopPropagation()">
        <div class="delete-icon">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>
        <h3 class="delete-title">{{ trans.translate('delete_strategy') }}</h3>
        <p class="delete-body">
          {{ trans.translate('delete_confirm') }} <strong>{{ deleteTarget()?.name }}</strong>?<br>
          {{ trans.translate('delete_body') }}
        </p>
        <div class="delete-actions">
          <button class="btn-delete-confirm" (click)="executeDelete()">
            <i class="fa-solid fa-trash"></i> {{ trans.translate('delete') }}
          </button>
          <button class="btn-delete-cancel" (click)="cancelDelete()">{{ trans.translate('cancel') }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .strategies-container { padding: 20px 0; position: relative; }
    .header-section { margin-bottom: 40px; }
    .search-bar { display: flex; gap: 20px; margin-bottom: 40px; align-items: center; }
    .strategies-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 30px; }
    .strategy-card { position: relative; cursor: pointer; display: flex; flex-direction: column; gap: 20px; overflow: visible; border-left: 2px solid transparent; transition: var(--transition); }
    .strategy-card:hover { border-left-color: var(--accent-color); background: rgba(255, 176, 0, 0.03); transform: scale(1.02); }
    .card-header { display: flex; justify-content: space-between; align-items: center; }
    .track-tag { font-size: 0.55rem; letter-spacing: 2px; color: var(--accent-color); font-weight: 800; background: rgba(255, 176, 0, 0.1); padding: 3px 8px; border-radius: 4px; }
    .date { font-family: monospace; font-size: 0.7rem; color: var(--text-dim); }
.invite-btn-card { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: var(--accent-color); padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; transition: 0.2s; }
.invite-btn-card:hover { background: rgba(255,176,0,0.1); border-color: var(--accent-color); }
.invite-url-row { display: flex; gap: 10px; margin: 15px 0; }
.invite-url-input { flex: 1; padding: 12px 15px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.3); color: #fff; font-family: monospace; font-size: 0.8rem; }
.btn-copy { display: flex; align-items: center; gap: 6px; background: var(--accent-color); color: #000; border: none; padding: 8px 18px; border-radius: 6px; font-weight: 700; font-family: var(--font-display); font-size: 0.7rem; letter-spacing: 1px; cursor: pointer; transition: 0.2s; white-space: nowrap; }
.btn-copy:hover { background: #ffc926; }
    .strat-title { font-family: var(--font-display); font-size: 1.1rem; margin: 0; line-height: 1.4; }
    .strat-details { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 15px 0; border-top: 1px solid rgba(255,255,255,0.05); }
    .detail-item { display: flex; flex-direction: column; gap: 5px; }
    .label { font-size: 0.6rem; color: var(--text-dim); letter-spacing: 1px; }
    .val { font-size: 0.85rem; font-weight: 700; color: #fff; }
    .card-footer { margin-top: auto; display: flex; gap: 8px; justify-content: flex-end; }
    .load-btn { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 6px 15px; font-family: var(--font-display); font-size: 0.6rem; font-weight: 700; letter-spacing: 1px; border-radius: 4px; transition: 0.3s; cursor: pointer; }
    .strategy-card:hover .load-btn { background: var(--accent-color); color: black; border-color: var(--accent-color); }
    .delete-btn-card { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #ff5252; padding: 6px 10px; border-radius: 4px; cursor: pointer; transition: 0.3s; font-size: 0.75rem; opacity: 0; }
    .strategy-card:hover .delete-btn-card { opacity: 1; }
    .delete-btn-card:hover { background: rgba(255, 82, 82, 0.15); border-color: #ff5252; }
    .empty-state { grid-column: 1 / -1; text-align: center; padding: 100px 20px; }
    .loading-state, .error-state { grid-column: 1 / -1; text-align: center; padding: 80px 20px; }
    input { margin-bottom: 0; }
    .primary-btn { background: var(--accent-color); color: black; border: none; padding: 12px 25px; border-radius: 8px; font-family: var(--font-display); font-weight: 800; font-size: 0.75rem; letter-spacing: 1px; cursor: pointer; }
    .card-glow { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at top right, rgba(255, 176, 0, 0.05), transparent 70%); pointer-events: none; }
    .delete-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(4px); }
    .delete-modal { max-width: 400px; width: 90%; padding: 40px; text-align: center; }
    .delete-icon { font-size: 2.5rem; color: #ff5252; margin-bottom: 15px; }
    .delete-title { font-family: var(--font-display); font-size: 1.2rem; margin: 0 0 10px; }
    .delete-body { color: var(--text-dim); font-size: 0.85rem; line-height: 1.6; margin-bottom: 25px; }
    .delete-body strong { color: #fff; }
    .delete-actions { display: flex; gap: 12px; justify-content: center; }
    .btn-delete-confirm { background: #ff5252; color: white; border: none; padding: 10px 25px; border-radius: 6px; font-family: var(--font-display); font-weight: 700; font-size: 0.7rem; letter-spacing: 1px; cursor: pointer; transition: 0.2s; }
    .btn-delete-confirm:hover { background: #ff1744; }
    .btn-delete-cancel { background: transparent; border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 10px 25px; border-radius: 6px; font-family: var(--font-display); font-weight: 700; font-size: 0.7rem; letter-spacing: 1px; cursor: pointer; transition: 0.2s; }
    .btn-delete-cancel:hover { background: rgba(255,255,255,0.05); }
  `]
})
export class StrategiesListComponent implements OnInit {
  trans = inject(TranslationService);
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

  deleteTarget = signal<ConfirmDeleteState | null>(null);

  confirmDelete(strat: StrategySummary) {
    this.deleteTarget.set({ id: strat.id, name: strat.name });
  }

  cancelDelete() {
    this.deleteTarget.set(null);
  }

  async executeDelete() {
    const target = this.deleteTarget();
    if (!target) return;
    this.deleteTarget.set(null);
    try {
      await this.api.deleteStrategy(target.id);
      await this.loadLibrary();
    } catch {
      this.store.error.set('Failed to delete strategy');
    }
  }

  inviteUrl = signal<string | null>(null);
  inviteCopied = signal(false);

  async openInvite(strat: StrategySummary) {
    try {
      const { token } = await this.api.generateInvite(strat.id);
      const base = window.location.origin;
      this.inviteUrl.set(`${base}/join?token=${token}`);
      this.inviteCopied.set(false);
    } catch {
      this.store.error.set('Failed to generate invite');
    }
  }

  closeInvite() {
    this.inviteUrl.set(null);
    this.inviteCopied.set(false);
  }

  async copyInvite() {
    const url = this.inviteUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      this.inviteCopied.set(true);
      setTimeout(() => this.inviteCopied.set(false), 2000);
    } catch {
      const input = document.querySelector('.invite-url-input') as HTMLInputElement;
      input?.select();
    }
  }

  newStrategy() {
    this.store.clearActive();
    this.router.navigate(['/strategy']);
  }
}
