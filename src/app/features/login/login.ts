import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="login-page">
      <div class="login-card glass-card animate-in">
        <div class="racing-bg"></div>
        
        <div class="content">
          <div class="logo-large">
            <span class="accent">RACE</span><span>STRATEGIST</span>
          </div>
          
          <h1 class="title">DESIGNED FOR <span class="accent">VICTORY</span></h1>
          <p class="subtitle">The ultimate collaboration platform for iRacing endurance teams. Real-time strategy, telemetry, and weather analytics.</p>
          
          <div class="feature-list">
            <div class="feature-item">
              <i class="fa-solid fa-check"></i>
              <span>Multi-driver Stint Planning</span>
            </div>
            <div class="feature-item">
              <i class="fa-solid fa-check"></i>
              <span>Live Fuel Consumption Tracking</span>
            </div>
            <div class="feature-item">
              <i class="fa-solid fa-check"></i>
              <span>Tempest Weather Integration</span>
            </div>
          </div>

          <button class="login-action-btn" (click)="login()">
            <div class="btn-glow"></div>
            <i class="fa-solid fa-right-to-bracket"></i>
            LOGIN WITH iRACING
          </button>
          
          <div class="footer-meta">
            <span>SECURE_AUTH_v2</span>
            <span class="divider">|</span>
            <span>OAUTH2_CONNECTED</span>
          </div>
        </div>
      </div>
      
      <div class="stats-ribbon animate-in stagger-2">
        <div class="stat-box">
          <span class="val">1,240</span>
          <span class="lbl">ACTIVE_TEAMS</span>
        </div>
        <div class="stat-box">
          <span class="val">45k+</span>
          <span class="lbl">STINTS_PLANNED</span>
        </div>
        <div class="stat-box">
          <span class="val">99.9%</span>
          <span class="lbl">UPTIME</span>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .login-page {
      height: 80vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .login-card {
      width: 100%;
      max-width: 600px;
      padding: 0;
      overflow: hidden;
      position: relative;
      border: 1px solid rgba(255, 176, 0, 0.2);
      box-shadow: 0 25px 50px rgba(0,0,0,0.5);
    }

    .racing-bg {
      height: 120px;
      background: linear-gradient(45deg, #050505 25%, transparent 25%) -50px 0,
                  linear-gradient(-45deg, #050505 25%, transparent 25%) -50px 0,
                  linear-gradient(45deg, transparent 75%, #050505 75%),
                  linear-gradient(-45deg, transparent 75%, #050505 75%);
      background-size: 100px 100px;
      background-color: #0a0a0a;
      opacity: 0.1;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
    }

    .content {
      padding: 60px 40px 40px 40px;
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .logo-large {
      font-family: var(--font-display);
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: 4px;
      margin-bottom: 30px;
    }

    .accent {
      color: var(--accent-color);
    }

    .title {
      font-size: 2.2rem;
      margin-bottom: 15px;
      line-height: 1.1;
    }

    .subtitle {
      color: var(--text-dim);
      font-size: 1.1rem;
      line-height: 1.6;
      margin-bottom: 35px;
      max-width: 450px;
    }

    .feature-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 40px;
      align-items: flex-start;
      padding-left: 20px;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 15px;
      font-size: 0.85rem;
      color: #fff;
      font-weight: 600;
    }

    .feature-item i {
      color: var(--accent-color);
      font-size: 0.7rem;
    }

    .login-action-btn {
      width: 100%;
      background: var(--accent-color);
      color: black;
      border: none;
      padding: 20px;
      border-radius: 12px;
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 1rem;
      letter-spacing: 2px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 15px;
      transition: all 0.3s ease;
    }

    .login-action-btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 30px var(--accent-glow);
    }

    .btn-glow {
      position: absolute;
      top: 0;
      left: -100%;
      width: 50%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
      transition: none;
      animation: shine 3s infinite;
    }

    @keyframes shine {
      0% { left: -100%; }
      20% { left: 150%; }
      100% { left: 150%; }
    }

    .footer-meta {
      margin-top: 30px;
      font-family: monospace;
      font-size: 0.65rem;
      color: var(--text-dim);
      letter-spacing: 1px;
    }

    .divider {
      margin: 0 10px;
      opacity: 0.3;
    }

    .stats-ribbon {
      margin-top: 40px;
      display: flex;
      gap: 60px;
    }

    .stat-box {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .val {
      font-family: var(--font-display);
      font-size: 1.2rem;
      color: #fff;
      margin-bottom: 5px;
    }

    .lbl {
      font-size: 0.6rem;
      color: var(--text-dim);
      letter-spacing: 2px;
    }
  `]
})
export class LoginComponent {
    auth = inject(AuthService);
    router = inject(Router);

    login() {
        this.auth.login();
        setTimeout(() => this.router.navigate(['/home']), 600);
    }
}
