import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="login-page">
      <div class="login-card glass-card animate-in">
        <div class="racing-bg"></div>

        <div class="content">
          <div class="logo-large">
            <span class="accent">RACE</span><span>STRATEGIST</span>
          </div>

          <h1 class="title">DESIGNED FOR <span class="accent">VICTORY</span></h1>
          <p class="subtitle">The ultimate collaboration platform for iRacing endurance teams.</p>

          <div class="auth-form">
            <div class="form-field">
              <label for="username">USERNAME</label>
              <input type="text" id="username" [(ngModel)]="username" placeholder="Enter your username" autocomplete="username">
            </div>
            <div class="form-field password-field">
              <label for="password">PASSWORD</label>
              <div class="password-wrapper">
                <input [type]="showPassword() ? 'text' : 'password'" id="password" [(ngModel)]="password" placeholder="Enter your password" autocomplete="current-password">
                <button type="button" class="toggle-password" (click)="showPassword.set(!showPassword())" [title]="showPassword() ? 'Hide password' : 'Show password'">
                  <i class="fa-solid" [class.fa-eye]="!showPassword()" [class.fa-eye-slash]="showPassword()"></i>
                </button>
              </div>
            </div>

            <div class="error-msg" *ngIf="errorMsg()">{{ errorMsg() }}</div>

            <div class="auth-buttons">
              <button class="login-btn" (click)="login()" [disabled]="loading">
                <i class="fa-solid fa-right-to-bracket"></i>
                {{ loading ? 'LOGGING IN...' : 'LOGIN' }}
              </button>
              <button class="signup-btn" (click)="register()" [disabled]="true">
                <i class="fa-solid fa-user-plus"></i>
                SIGN UP
              </button>
            </div>
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
    .login-page { height: 80vh; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; }
    .login-card { width: 100%; max-width: 450px; padding: 0; overflow: hidden; position: relative; border: 1px solid rgba(255, 176, 0, 0.2); box-shadow: 0 25px 50px rgba(0,0,0,0.5); }
    .racing-bg { height: 80px; background: linear-gradient(45deg, #050505 25%, transparent 25%) -50px 0, linear-gradient(-45deg, #050505 25%, transparent 25%) -50px 0, linear-gradient(45deg, transparent 75%, #050505 75%), linear-gradient(-45deg, transparent 75%, #050505 75%); background-size: 100px 100px; background-color: #0a0a0a; opacity: 0.1; position: absolute; top: 0; left: 0; right: 0; }
    .content { padding: 40px 35px 35px; position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; text-align: center; }
    .logo-large { font-family: var(--font-display); font-size: 1.3rem; font-weight: 800; letter-spacing: 4px; margin-bottom: 15px; }
    .accent { color: var(--accent-color); }
    .title { font-size: 1.4rem; margin-bottom: 5px; line-height: 1.2; }
    .subtitle { color: var(--text-dim); font-size: 0.85rem; line-height: 1.5; margin-bottom: 25px; }
    .auth-form { width: 100%; display: flex; flex-direction: column; gap: 15px; }
    .form-field { text-align: left; }
    .form-field label { font-size: 0.6rem; color: var(--text-dim); letter-spacing: 2px; margin-bottom: 6px; display: block; }
    .form-field input { width: 100%; padding: 12px 15px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #fff; font-size: 0.9rem; transition: 0.2s; }
    .form-field input:focus { outline: none; border-color: var(--accent-color); background: rgba(255,255,255,0.08); box-shadow: 0 0 15px rgba(255,176,0,0.1); }
    .form-field input::placeholder { color: rgba(255,255,255,0.25); }
    .password-field .password-wrapper { position: relative; display: flex; align-items: center; }
    .password-field .password-wrapper input { padding-right: 45px; }
    .toggle-password { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: rgba(255,255,255,0.35); cursor: pointer; padding: 8px; font-size: 1.1rem; display: flex; align-items: center; transition: color 0.2s; }
    .toggle-password:hover { color: var(--accent-color); }
    .error-msg { color: #ff5252; font-size: 0.75rem; text-align: center; padding: 8px; background: rgba(255,82,82,0.1); border-radius: 6px; }
    .auth-buttons { display: flex; gap: 12px; margin-top: 5px; }
    .login-btn, .signup-btn { flex: 1; padding: 14px; border-radius: 8px; font-family: var(--font-display); font-weight: 800; font-size: 0.75rem; letter-spacing: 1.5px; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 10px; border: none; }
    .login-btn { background: var(--accent-color); color: black; }
    .login-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px var(--accent-glow); }
    .signup-btn { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #fff; }
    .signup-btn:hover:not(:disabled) { border-color: var(--accent-color); color: var(--accent-color); }
    .login-btn:disabled, .signup-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .stats-ribbon { margin-top: 40px; display: flex; gap: 60px; }
    .stat-box { display: flex; flex-direction: column; align-items: center; }
    .val { font-family: var(--font-display); font-size: 1.2rem; color: #fff; margin-bottom: 5px; }
    .lbl { font-size: 0.6rem; color: var(--text-dim); letter-spacing: 2px; }
  `]
})
export class LoginComponent {
    auth = inject(AuthService);
    router = inject(Router);
    route = inject(ActivatedRoute);
    username = '';
    password = '';
    loading = false;
    errorMsg = signal('');
    showPassword = signal(false);

    async login() {
        if (!this.username || !this.password) {
            this.errorMsg.set('Please enter username and password');
            return;
        }
        this.loading = true;
        this.errorMsg.set('');
        try {
            await this.auth.login(this.username, this.password);
            const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
            this.router.navigateByUrl(returnUrl);
        } catch {
            this.errorMsg.set('Invalid username or password');
            this.loading = false;
        }
    }

    async register() {
        if (!this.username || !this.password) {
            this.errorMsg.set('Please enter username and password');
            return;
        }
        if (this.username.length < 3) {
            this.errorMsg.set('Username must be at least 3 characters');
            return;
        }
        if (this.password.length < 4) {
            this.errorMsg.set('Password must be at least 4 characters');
            return;
        }
        this.loading = true;
        this.errorMsg.set('');
        try {
            await this.auth.register(this.username, this.password);
            const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
            this.router.navigateByUrl(returnUrl);
        } catch (e: any) {
            this.errorMsg.set(e?.error?.error || 'Registration failed');
            this.loading = false;
        }
    }
}
