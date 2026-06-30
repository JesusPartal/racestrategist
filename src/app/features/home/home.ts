import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { StrategyApiService } from '../../core/services/strategy-api.service';
import { TranslationService } from '../../core/services/translation.service';
import { StrategySummary } from '../../core/models/race-strategy.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="home-container">
      <div class="welcome-hero animate-in">
        <div class="hero-content">
          <h1 style="font-family: var(--font-display); font-weight: 800; font-size: 2.5rem; margin: 0;">
            {{ trans.translate('welcome_back') }}             <span style="color: var(--accent-color);">{{ auth.currentUser()?.displayName || auth.currentUser()?.username }}</span>
          </h1>
          <p style="color: var(--text-dim); margin-top: 10px; font-size: 1.1rem;">
            {{ trans.translate('home_subtitle') }}
          </p>
        </div>
        <div class="user-stats glass-card">
          <div class="stat-item">
            <span class="stat-label">{{ trans.translate('license') }}</span>
            <span class="stat-value" style="color: var(--accent-color);">{{ auth.currentUser()?.licenseClass }}</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-label">{{ trans.translate('irating') }}</span>
            <span class="stat-value">{{ auth.currentUser()?.iRating }}</span>
          </div>
        </div>
      </div>

      <div class="dashboard-grid stagger-1">
        <div class="glass-card feature-card">
          <div class="card-icon"><i class="fa-solid fa-gauge-high"></i></div>
          <h3>{{ trans.translate('active_strategies') }}</h3>
          <p>{{ strategyCount() > 0 ? strategyCount() + ' ' + (strategyCount() !== 1 ? trans.translate('strategies_plural') : trans.translate('strategies_singular')) : trans.translate('no_strategies_yet') }}</p>
          <button class="ghost-btn" routerLink="/strategies">{{ trans.translate('view_all') }}</button>
        </div>

        <div class="glass-card feature-card highlight">
          <div class="card-icon"><i class="fa-solid fa-users-gear"></i></div>
          <h3>{{ trans.translate('team_management') }}</h3>
          <p>{{ trans.translate('team_desc') }}</p>
          <button class="ghost-btn" routerLink="/team">{{ trans.translate('manage_team_btn') }}</button>
        </div>

        <div class="glass-card feature-card">
          <div class="card-icon"><i class="fa-solid fa-cloud-bolt"></i></div>
          <h3>{{ trans.translate('tempest_alerts') }}</h3>
          <p>{{ trans.translate('weather_alert') }}</p>
          <button class="ghost-btn" disabled>{{ trans.translate('soon') }}</button>
        </div>
      </div>

      <div class="glass-card animate-in stagger-2" style="margin-top: 40px;">
        <h2 style="font-size: 1rem; color: #fff; margin-bottom: 20px;">{{ trans.translate('recent_strategies') }}</h2>
        <div class="log-table" *ngIf="recentStrategies().length > 0">
          <div class="log-row" *ngFor="let s of recentStrategies()">
            <span class="time">{{ formatDate(s.lastModified) }}</span>
            <span class="msg">{{ s.name }} <span style="color: var(--text-dim)">— {{ s.vehicleName }}</span></span>
            <span class="status-ok">{{ s.stintCount }} {{ trans.translate('stints') }} · {{ s.driverCount }} {{ trans.translate('drivers') }}</span>
          </div>
        </div>
        <p *ngIf="recentStrategies().length === 0" style="color: var(--text-dim); padding: 20px 0;">{{ trans.translate('no_strategies_yet') }}</p>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      padding: 20px 0;
    }

    .welcome-hero {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 50px;
      padding: 40px;
      border-radius: 20px;
      background: linear-gradient(90deg, rgba(255, 176, 0, 0.05), transparent);
      border: 1px solid rgba(255, 176, 0, 0.1);
    }

    .user-stats {
      display: flex;
      gap: 30px;
      padding: 20px 40px;
      align-items: center;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .stat-label {
      font-size: 0.65rem;
      letter-spacing: 2px;
      color: var(--text-dim);
      margin-bottom: 5px;
    }

    .stat-value {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 1.4rem;
    }

    .stat-divider {
      width: 1px;
      height: 40px;
      background: rgba(255, 255, 255, 0.1);
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 30px;
      margin-bottom: 40px;
    }

    .feature-card {
      padding: 40px;
      display: flex;
      flex-direction: column;
      gap: 15px;
      transition: all 0.4s ease;
    }

    .feature-card:hover {
      transform: translateY(-10px);
      border-color: rgba(255, 176, 0, 0.3);
    }

    .feature-card.highlight {
      border-left: 4px solid var(--accent-color);
    }

    .card-icon {
      font-size: 2rem;
      color: var(--accent-color);
      margin-bottom: 10px;
    }

    .feature-card h3 {
      font-size: 1.2rem;
      color: #fff;
    }

    .feature-card p {
      font-size: 0.9rem;
      color: var(--text-dim);
      line-height: 1.6;
    }

    .ghost-btn {
      background: transparent;
      border: 1px solid rgba(255,255,255,0.1);
      color: #fff;
      padding: 10px 20px;
      border-radius: 4px;
      font-family: var(--font-display);
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 1px;
      margin-top: auto;
      cursor: pointer;
      transition: 0.3s;
    }

    .ghost-btn:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: var(--accent-color);
    }

    .log-table {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .log-row {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.02);
      border-radius: 8px;
      font-size: 0.85rem;
    }

    .log-row .time {
      color: var(--text-dim);
      font-family: monospace;
      width: 80px;
    }

    .log-row .msg {
      flex: 1;
      color: #fff;
    }

    .status-ok {
      font-size: 0.6rem;
      font-weight: 800;
      color: var(--success-color);
      letter-spacing: 1px;
      padding: 4px 10px;
      background: rgba(0, 230, 118, 0.1);
      border-radius: 4px;
    }
  `]
})
export class HomeComponent implements OnInit {
  auth = inject(AuthService);
  trans = inject(TranslationService);
  api = inject(StrategyApiService);
  strategies = signal<StrategySummary[]>([]);
  strategyCount = computed(() => this.strategies().length);
  recentStrategies = computed(() =>
    [...this.strategies()]
      .sort((a, b) => b.lastModified - a.lastModified)
      .slice(0, 5)
  );

  async ngOnInit() {
    try {
      const list = await this.api.loadLibrary();
      this.strategies.set(list);
    } catch {}
  }

  formatDate(timestamp: number): string {
    const d = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ago`;
  }
}
