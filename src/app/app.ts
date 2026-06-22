import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  auth = inject(AuthService);
  router = inject(Router);

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
