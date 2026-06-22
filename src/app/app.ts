import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { TranslationService } from './core/services/translation.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  auth = inject(AuthService);
  trans = inject(TranslationService);
  router = inject(Router);
  mobileNavOpen = signal(false);

  async login() {
    try {
      await this.auth.login('TrackTitan_99', 'demo');
      this.router.navigate(['/home']);
    } catch {
      alert('Login failed');
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
