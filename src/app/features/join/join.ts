import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { StrategyApiService } from '../../core/services/strategy-api.service';
import { TranslationService } from '../../core/services/translation.service';
import { RaceStrategy } from '../../core/models/race-strategy.model';

@Component({
  selector: 'app-join',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="join-page">
      <div class="join-card glass-card animate-in">
        <div *ngIf="!auth.currentUser()" class="content">
          <div class="icon"><i class="fa-solid fa-link"></i></div>
          <h2>{{ trans.translate('invite_login_title') }}</h2>
          <p>{{ trans.translate('invite_login_body') }}</p>
          <a class="login-btn" [routerLink]="'/login'" [queryParams]="{ returnUrl: '/join?token=' + token() }">
            <i class="fa-solid fa-right-to-bracket"></i> {{ trans.translate('login') }}
          </a>
        </div>

        <div *ngIf="auth.currentUser() && !strategy() && !error()" class="content">
          <div class="icon"><i class="fa-solid fa-spinner fa-spin"></i></div>
          <h2>{{ trans.translate('invite_loading') }}</h2>
        </div>

        <div *ngIf="error()" class="content">
          <div class="icon" style="color: #ff5252;"><i class="fa-solid fa-triangle-exclamation"></i></div>
          <h2>{{ trans.translate('invite_error') }}</h2>
          <p>{{ error() }}</p>
          <a class="login-btn" routerLink="/strategies">
            <i class="fa-solid fa-arrow-left"></i> {{ trans.translate('back_strategies') }}
          </a>
        </div>

        <div *ngIf="strategy() && !accepted()" class="content">
          <div class="icon"><i class="fa-solid fa-flag-checkered"></i></div>
          <h2>{{ trans.translate('invite_found_title') }}</h2>
          <p class="strategy-name">{{ strategy()!.name }}</p>
          <button class="accept-btn" (click)="accept()" [disabled]="loading()">
            <i class="fa-solid fa-check"></i> {{ loading() ? trans.translate('invite_accepting') : trans.translate('invite_accept') }}
          </button>
        </div>

        <div *ngIf="accepted()" class="content">
          <div class="icon" style="color: #4caf50;"><i class="fa-solid fa-check-circle"></i></div>
          <h2>{{ trans.translate('invite_accepted_title') }}</h2>
          <p>{{ trans.translate('invite_accepted_body') }}</p>
          <a class="login-btn" routerLink="/strategies">
            <i class="fa-solid fa-arrow-right"></i> {{ trans.translate('invite_go_strategies') }}
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .join-page { height: 70vh; display: flex; align-items: center; justify-content: center; }
    .join-card { width: 100%; max-width: 480px; padding: 40px; text-align: center; border: 1px solid rgba(255,176,0,0.2); }
    .content { display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .icon { font-size: 2.5rem; color: var(--accent-color); margin-bottom: 10px; }
    h2 { font-family: var(--font-display); font-size: 1.2rem; margin: 0; }
    p { color: var(--text-dim); font-size: 0.85rem; margin: 0; line-height: 1.5; }
    .strategy-name { font-size: 1.1rem; color: #fff; font-weight: 700; margin: 5px 0 10px; }
    .login-btn, .accept-btn { display: inline-flex; align-items: center; gap: 8px; margin-top: 15px; padding: 14px 30px; border-radius: 8px; font-family: var(--font-display); font-weight: 800; font-size: 0.75rem; letter-spacing: 1.5px; cursor: pointer; transition: 0.3s; text-decoration: none; border: none; }
    .login-btn { background: var(--accent-color); color: #000; }
    .login-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px var(--accent-glow); }
    .accept-btn { background: var(--accent-color); color: #000; }
    .accept-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px var(--accent-glow); }
    .accept-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class JoinStrategyComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(StrategyApiService);
  auth = inject(AuthService);
  trans = inject(TranslationService);

  token = signal('');
  strategy = signal<RaceStrategy | null>(null);
  error = signal<string | null>(null);
  loading = signal(false);
  accepted = signal(false);

  async ngOnInit() {
    const t = this.route.snapshot.queryParams['token'];
    if (!t) {
      this.error.set('No invite token provided');
      return;
    }
    this.token.set(t);

    if (this.auth.currentUser()) {
      await this.resolveStrategy();
    }
  }

  private async resolveStrategy() {
    try {
      const result = await this.api.resolveInvite(this.token());
      this.strategy.set(result.strategy);
    } catch {
      this.error.set('This invite link is invalid or has expired.');
    }
  }

  async accept() {
    this.loading.set(true);
    try {
      await this.api.acceptInvite(this.token());
      this.accepted.set(true);
    } catch {
      this.error.set('Could not accept invite. It may have expired.');
    } finally {
      this.loading.set(false);
    }
  }
}
