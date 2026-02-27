import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="home-container">
      <div class="welcome-hero animate-in">
        <div class="hero-content">
          <h1 style="font-family: var(--font-display); font-weight: 800; font-size: 2.5rem; margin: 0;">
            WELCOME BACK, <span style="color: var(--accent-color);">{{ auth.currentUser()?.username }}</span>
          </h1>
          <p style="color: var(--text-dim); margin-top: 10px; font-size: 1.1rem;">
            Ready to optimize your next stint? Your team is waiting in the pit lane.
          </p>
        </div>
        <div class="user-stats glass-card">
          <div class="stat-item">
            <span class="stat-label">LICENSE</span>
            <span class="stat-value" style="color: var(--accent-color);">{{ auth.currentUser()?.license }}</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-label">iRATING</span>
            <span class="stat-value">{{ auth.currentUser()?.irating }}</span>
          </div>
        </div>
      </div>

      <div class="dashboard-grid stagger-1">
        <div class="glass-card feature-card">
          <div class="card-icon"><i class="fa-solid fa-gauge-high"></i></div>
          <h3>Active Strategies</h3>
          <p>You have 3 strategy plans saved for the upcoming 24h Nürburgring.</p>
          <button class="ghost-btn">VIEW ALL</button>
        </div>

        <div class="glass-card feature-card highlight">
          <div class="card-icon"><i class="fa-solid fa-users"></i></div>
          <h3>Team Management</h3>
          <p>D. Ricciardo has updated his average lap times for the GT3 class.</p>
          <button class="primary-btn">MANAGE TEAM</button>
        </div>

        <div class="glass-card feature-card">
          <div class="card-icon"><i class="fa-solid fa-cloud-showers-heavy"></i></div>
          <h3>Tempest Alerts</h3>
          <p>70% chance of rain detected for Sunday's stint at Spa-Francorchamps.</p>
          <button class="ghost-btn">WET SETUP</button>
        </div>
      </div>

      <div class="recent-activity glass-card animate-in stagger-2">
        <h2 style="font-family: var(--font-display); font-size: 1rem; margin-bottom: 20px; color: var(--accent-color);">
          RECENT_TELEMETRY_LOGS
        </h2>
        <div class="log-item">
          <span class="log-time">14:22:05</span>
          <span class="log-msg">Strategy #402 recalculated for increased track temperature.</span>
          <span class="log-status">SYNC_OK</span>
        </div>
        <div class="log-item">
          <span class="log-time">12:10:44</span>
          <span class="log-msg">New driver profile added: 'S. Perez'</span>
          <span class="log-status">UPDATED</span>
        </div>
        <div class="log-item">
          <span class="log-time">10:05:12</span>
          <span class="log-msg">Nürburgring Combined- Endurance Layout catalog synchronized.</span>
          <span class="log-status">SYNC_OK</span>
        </div>
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
      margin-bottom: 40px;
      padding: 40px;
      background: linear-gradient(135deg, rgba(255, 176, 0, 0.05) 0%, rgba(0, 0, 0, 0) 100%);
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.05);
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
      font-size: 0.6rem;
      letter-spacing: 2px;
      color: var(--text-dim);
      margin-bottom: 5px;
    }

    .stat-value {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 1.2rem;
    }

    .stat-divider {
      width: 1px;
      height: 40px;
      background: rgba(255, 255, 255, 0.1);
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 25px;
      margin-bottom: 40px;
    }

    .feature-card {
      padding: 30px;
      display: flex;
      flex-direction: column;
      gap: 15px;
      transition: transform 0.3s ease;
    }

    .feature-card:hover {
      transform: translateY(-5px);
      border-color: rgba(255, 176, 0, 0.3);
    }

    .feature-card.highlight {
      border-left: 4px solid var(--accent-color);
    }

    .card-icon {
      font-size: 1.8rem;
      color: var(--accent-color);
      margin-bottom: 10px;
    }

    .feature-card h3 {
      font-family: var(--font-display);
      font-size: 1.1rem;
      margin: 0;
    }

    .feature-card p {
      color: var(--text-dim);
      font-size: 0.9rem;
      line-height: 1.6;
      margin: 0;
    }

    button {
      margin-top: auto;
      padding: 10px 20px;
      border-radius: 6px;
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 0.7rem;
      letter-spacing: 1px;
      cursor: pointer;
      transition: 0.3s;
    }

    .primary-btn {
      background: var(--accent-color);
      color: black;
      border: none;
    }

    .primary-btn:hover {
      background: #ffc400;
      box-shadow: 0 0 20px rgba(255, 176, 0, 0.3);
    }

    .ghost-btn {
      background: transparent;
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .recent-activity {
      padding: 30px;
    }

    .log-item {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 15px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-family: monospace;
      font-size: 0.8rem;
    }

    .log-time {
      color: var(--text-dim);
      min-width: 80px;
    }

    .log-msg {
      flex: 1;
    }

    .log-status {
      color: var(--accent-color);
      font-weight: 800;
      font-size: 0.65rem;
      background: rgba(255, 176, 0, 0.1);
      padding: 2px 8px;
      border-radius: 4px;
    }
  `]
})
export class HomeComponent {
    auth = inject(AuthService);
}
