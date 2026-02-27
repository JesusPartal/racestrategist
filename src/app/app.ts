import { Component, signal, inject, OnInit } from '@angular/core';
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
  protected readonly title = signal('RaceStrategist');
  auth = inject(AuthService);
  router = inject(Router);

  login() {
    this.auth.login();
    // Redirect happens after state update in a real app, here we'll do it manually for smooth UX
    setTimeout(() => this.router.navigate(['/home']), 600);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
